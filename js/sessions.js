/**
 * Skill Badlu — Two-Way Session Lifecycle & State Machine
 * Reference: docs/architecture/system-design.md#55-session-state-transition-diagram
 */

class SessionManager {
  constructor(store, ledger) {
    this.store = store;
    this.ledger = ledger;
  }

  requestSession({ teacherId, skillId, creditAmount }) {
    const currentUser = this.store.getCurrentUser();
    const teacher = this.store.getUser(teacherId);
    const skill = this.store.getSkill(skillId) || { name: "Custom Skill Swap" };

    if (!currentUser || !teacher) {
      throw new Error("Invalid session participants.");
    }

    const newSession = {
      id: "sess_" + Math.random().toString(36).substring(2, 8),
      match_id: `match_${currentUser.id}_${teacher.id}`,
      learner_id: currentUser.id,
      teacher_id: teacher.id,
      skill_id: skillId,
      skill_name: skill.name,
      agreed_credit_amount: parseInt(creditAmount, 10) || 50,
      confirmed_by_a: false, // Learner confirmation
      confirmed_by_b: false, // Teacher confirmation
      status: "REQUESTED",
      scheduled_start: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
      settled_at: null
    };

    this.store.sessions.unshift(newSession);
    this.store.notify("SESSION_CREATED", { session: newSession });
    return newSession;
  }

  acceptSession(sessionId) {
    const session = this.store.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found.");

    session.status = "SCHEDULED";
    this.store.notify("SESSION_UPDATED", { session });
    return session;
  }

  startSession(sessionId) {
    const session = this.store.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found.");

    session.status = "IN_PROGRESS";
    this.store.notify("SESSION_UPDATED", { session });
    return session;
  }

  concludeSession(sessionId) {
    const session = this.store.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found.");

    session.status = "PENDING_CONFIRMATION";
    this.store.notify("SESSION_UPDATED", { session });
    return session;
  }

  /**
   * Two-Way Confirmation Action
   * When both confirmed_by_a AND confirmed_by_b become true,
   * automatically calls ledger.completeSession(sessionId)
   */
  confirmSession(sessionId, userRole) {
    const session = this.store.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found.");

    if (userRole === "learner") {
      session.confirmed_by_a = true;
    } else if (userRole === "teacher") {
      session.confirmed_by_b = true;
    }

    // If session was in previous states, move it to PENDING_CONFIRMATION
    if (session.status === "REQUESTED" || session.status === "SCHEDULED" || session.status === "IN_PROGRESS") {
      session.status = "PENDING_CONFIRMATION";
    }

    // Both parties confirmed -> ATOMIC SETTLEMENT!
    if (session.confirmed_by_a && session.confirmed_by_b) {
      const settlement = this.ledger.completeSession(session.id);
      return { settled: true, session, settlement };
    }

    this.store.notify("SESSION_CONFIRMATION_UPDATED", { session });
    return { settled: false, session };
  }

  disputeSession(sessionId, reason) {
    const session = this.store.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found.");

    session.status = "DISPUTED";
    session.dispute_reason = reason || "Disputed session outcome by participant";
    this.store.notify("SESSION_DISPUTED", { session });
    return session;
  }
}

window.sessions = new SessionManager(window.store, window.ledger);
