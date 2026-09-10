/**
 * Skill Badlu — Admin Moderation & Dispute Arbitration Portal
 * Reference: docs/architecture/system-design.md#53-user-onboarding--admin-approval-flowchart
 */

class AdminManager {
  constructor(store, ledger) {
    this.store = store;
    this.ledger = ledger;
  }

  getPendingUsers() {
    return this.store.users.filter(u => u.verified_status === "PENDING_REVIEW");
  }

  getDisputedSessions() {
    return this.store.sessions.filter(s => s.status === "DISPUTED");
  }

  approveUser(userId) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");

    user.verified_status = "VERIFIED";

    // Grant 50 Welcome Platform Credits
    const grantTx = this.ledger.insertTransaction({
      sessionId: null,
      fromUser: "PLATFORM_TREASURY",
      toUser: user.id,
      amount: 50,
      type: "ONBOARDING_WELCOME_GRANT"
    });

    this.store.notify("USER_APPROVED", { user, grantTx });
    return { user, grantTx };
  }

  rejectUser(userId, reason) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");

    user.verified_status = "REJECTED";
    user.rejection_reason = reason || "Application credentials could not be verified.";

    this.store.notify("USER_REJECTED", { user });
    return { user, refunded: true, feeAmount: 499 };
  }

  resolveDispute(sessionId, resolution) {
    const session = this.store.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error("Session not found.");

    if (resolution === "settle_teacher") {
      // Award credits to teacher
      const tx = this.ledger.insertTransaction({
        sessionId: session.id,
        fromUser: session.learner_id,
        toUser: session.teacher_id,
        amount: session.agreed_credit_amount,
        type: "DISPUTE_MEDIATED_SETTLEMENT"
      });
      session.status = "SETTLED";
      session.settled_at = new Date();
      this.store.notify("DISPUTE_RESOLVED", { session, tx, resolution });
      return { session, tx };
    } else {
      // Cancel without debiting learner
      session.status = "CANCELLED";
      this.store.notify("DISPUTE_RESOLVED", { session, resolution: "cancelled" });
      return { session };
    }
  }

  getPendingCourses() {
    return this.store.getPendingCourses();
  }

  approveCourse(courseId) {
    const course = this.store.getCourse(courseId);
    if (!course) throw new Error("Course not found.");

    course.status = "APPROVED";
    course.approved_at = new Date();

    this.store.notify("COURSE_APPROVED", { course });
    return course;
  }

  rejectCourse(courseId, reason) {
    const course = this.store.getCourse(courseId);
    if (!course) throw new Error("Course not found.");

    course.status = "REJECTED";
    course.rejection_reason = reason || "Course content does not meet platform quality or verification standards.";

    this.store.notify("COURSE_REJECTED", { course });
    return course;
  }
}

window.admin = new AdminManager(window.store, window.ledger);
