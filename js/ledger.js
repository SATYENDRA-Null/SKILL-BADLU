/**
 * Skill Badlu — Append-Only Double-Entry Credit Ledger Engine
 * Reference: docs/architecture/system-design.md#51-append-only-double-entry-credit-ledger
 */

class LedgerEngine {
  constructor(store) {
    this.store = store;
  }

  /**
   * Derive balance strictly from the immutable ledger transactions.
   * Balance(u) = SUM(credits_in) - SUM(credits_out)
   */
  getBalance(userId) {
    let creditsIn = 0;
    let creditsOut = 0;

    for (const tx of this.store.transactions) {
      if (tx.to_user === userId) {
        creditsIn += tx.amount;
      }
      if (tx.from_user === userId) {
        creditsOut += tx.amount;
      }
    }

    return creditsIn - creditsOut;
  }

  /**
   * Append-only insert. Never mutates or deletes existing transactions.
   */
  insertTransaction({ sessionId, fromUser, toUser, amount, type }) {
    if (!fromUser || !toUser) {
      throw new Error("Ledger transaction requires valid from_user and to_user.");
    }
    if (amount <= 0) {
      throw new Error("Transaction amount must be strictly greater than zero.");
    }
    if (fromUser === toUser) {
      throw new Error("Transacting parties must be distinct (from_user != to_user).");
    }

    // Idempotency check for session settlements
    if (type === "SESSION_SETTLEMENT" && sessionId) {
      const existing = this.store.transactions.find(
        tx => tx.session_id === sessionId && tx.transaction_type === "SESSION_SETTLEMENT"
      );
      if (existing) {
        console.warn(`Idempotency guard triggered: session ${sessionId} already settled.`);
        return existing;
      }
    }

    const newTx = {
      id: "tx_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      session_id: sessionId || null,
      from_user: fromUser,
      to_user: toUser,
      amount: parseInt(amount, 10),
      transaction_type: type,
      created_at: new Date()
    };

    // Immutably append
    this.store.transactions.unshift(newTx);
    this.store.notify("LEDGER_UPDATED", { transaction: newTx });
    return newTx;
  }

  /**
   * Settles a completed session atomically once both parties have confirmed.
   */
  completeSession(sessionId) {
    const session = this.store.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    if (session.status === "SETTLED") {
      return { status: "already_settled", sessionId };
    }

    if (!session.confirmed_by_a || !session.confirmed_by_b) {
      throw new Error("Session settlement requires two-way confirmation (both learner and teacher).");
    }

    // Atomic write to ledger
    const tx = this.insertTransaction({
      sessionId: session.id,
      fromUser: session.learner_id,
      toUser: session.teacher_id,
      amount: session.agreed_credit_amount,
      type: "SESSION_SETTLEMENT"
    });

    session.status = "SETTLED";
    session.settled_at = new Date();

    this.store.notify("SESSION_SETTLED", { session, transaction: tx });
    return { status: "settled", session, transaction: tx };
  }

  /**
   * Periodic or on-demand Reconciliation Check
   * Computes mathematical integrity proof of all balances vs sum of transactions.
   */
  reconcile() {
    const auditReport = {
      timestamp: new Date(),
      totalTransactions: this.store.transactions.length,
      userAudits: [],
      systemInbalance: 0,
      isVerified: true
    };

    let totalMinted = 0;
    let totalCashedOut = 0;

    for (const tx of this.store.transactions) {
      if (tx.from_user === "PLATFORM_TREASURY") {
        totalMinted += tx.amount;
      }
      if (tx.to_user === "PLATFORM_CASHOUT") {
        totalCashedOut += tx.amount;
      }
    }

    let sumOfAllUserBalances = 0;

    for (const user of this.store.users) {
      const derived = this.getBalance(user.id);
      sumOfAllUserBalances += derived;

      auditReport.userAudits.push({
        userId: user.id,
        userName: user.name,
        derivedBalance: derived,
        status: "OK"
      });
    }

    // Ledger invariant: Sum of User Balances + Total Cashed Out == Total Minted
    const expectedTreasuryCirculation = totalMinted - totalCashedOut;
    const discrepancy = sumOfAllUserBalances - expectedTreasuryCirculation;

    auditReport.totalMinted = totalMinted;
    auditReport.totalCashedOut = totalCashedOut;
    auditReport.circulatingSupply = sumOfAllUserBalances;
    auditReport.discrepancy = discrepancy;
    auditReport.isVerified = (discrepancy === 0);

    return auditReport;
  }
}

window.ledger = new LedgerEngine(window.store);
