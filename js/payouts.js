/**
 * Skill Badlu — Payout & Compensating Reversal Engine
 * Reference: docs/architecture/system-design.md#54-payout-algorithm-with-compensating-reversal
 */

class PayoutEngine {
  constructor(store, ledger) {
    this.store = store;
    this.ledger = ledger;
    this.PLATFORM_CASHOUT = "PLATFORM_CASHOUT";
    this.simulateFailure = false;
  }

  setSimulateFailure(shouldFail) {
    this.simulateFailure = shouldFail;
    this.store.notify("PAYOUT_CONFIG_UPDATED", { simulateFailure: this.simulateFailure });
  }

  async requestPayout({ userId, amount, bankDetails }) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");

    // 1. KYC verification check
    if (user.kyc_status !== "VERIFIED") {
      throw new Error("Payout rejected: KYC verification required prior to cashouts.");
    }

    // 2. Derive balance directly from immutable ledger
    const availableBalance = this.ledger.getBalance(userId);
    const parsedAmount = parseInt(amount, 10);

    if (parsedAmount <= 0) {
      throw new Error("Payout amount must be greater than zero.");
    }

    if (availableBalance < parsedAmount) {
      throw new Error(`Insufficient credits. Available: ${availableBalance} CR, Requested: ${parsedAmount} CR.`);
    }

    const payoutId = "po_" + Math.random().toString(36).substring(2, 9);
    
    // 3. Atomic Debit Reservation
    const payoutRecord = {
      id: payoutId,
      user_id: userId,
      amount: parsedAmount,
      status: "PENDING",
      bank_details: bankDetails || user.bank_details,
      gateway_ref: null,
      error_log: null,
      created_at: new Date()
    };
    this.store.payouts.unshift(payoutRecord);

    const debitTx = this.ledger.insertTransaction({
      sessionId: null,
      fromUser: userId,
      toUser: this.PLATFORM_CASHOUT,
      amount: parsedAmount,
      type: "PAYOUT_RESERVATION"
    });

    // 4. Simulated Gateway API Call (Razorpay / Stripe)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!this.simulateFailure) {
          // Success Path
          payoutRecord.status = "COMPLETED";
          payoutRecord.gateway_ref = "rzp_xfer_" + Math.random().toString(36).substring(2, 10);
          payoutRecord.settled_at = new Date();

          this.store.notify("PAYOUT_COMPLETED", { payout: payoutRecord, debitTx });
          resolve({
            success: true,
            payout: payoutRecord,
            message: `Payout of ₹${parsedAmount * 10} (${parsedAmount} CR) transferred successfully to bank account.`
          });
        } else {
          // Failure Path -> Execute COMPENSATING REVERSAL!
          payoutRecord.status = "FAILED";
          payoutRecord.error_log = "Simulated Gateway Bank Rail Timeout (HTTP 504: Beneficiary Bank Unreachable)";

          // Insert Compensating Reversal Transaction to restore balance
          const reversalTx = this.ledger.insertTransaction({
            sessionId: null,
            fromUser: this.PLATFORM_CASHOUT,
            toUser: userId,
            amount: parsedAmount,
            type: "PAYOUT_COMPENSATING_REVERSAL"
          });

          this.store.notify("PAYOUT_FAILED", { payout: payoutRecord, reversalTx });
          reject(new Error(
            `Gateway transfer failed: ${payoutRecord.error_log}. ` +
            `Compensating reversal (${parsedAmount} CR) automatically credited back to your account.`
          ));
        }
      }, 900); // Realistic network latency simulation
    });
  }
}

window.payouts = new PayoutEngine(window.store, window.ledger);
