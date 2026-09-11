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
    return this.store.users.filter(
      (u) => u.verified_status === "PENDING_REVIEW"
    );
  }

  getDisputedSessions() {
    return this.store.sessions.filter((s) => s.status === "DISPUTED");
  }

  approveUser(userId) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");

    user.verified_status = "VERIFIED";
    user.kyc_status = "VERIFIED";
    if (user.fee_status !== "PAID") {
      user.fee_status = "PENDING_PAYMENT";
    }

    // Grant 50 Welcome Platform Credits if not already granted
    let grantTx = null;
    const existingTx = this.store.transactions.find(
      (tx) =>
        tx.to_user === user.id &&
        tx.transaction_type === "ONBOARDING_WELCOME_GRANT"
    );
    if (!existingTx) {
      grantTx = this.ledger.insertTransaction({
        sessionId: null,
        fromUser: "PLATFORM_TREASURY",
        toUser: user.id,
        amount: 50,
        type: "ONBOARDING_WELCOME_GRANT"
      });
    }

    this.store.saveState();
    this.store.notify("USER_APPROVED", { user, grantTx });
    return { user, grantTx };
  }

  rejectUser(userId, reason) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");

    const hadPaid = user.fee_status === "PAID";
    user.verified_status = "REJECTED";
    user.rejection_reason =
      reason || "Application credentials could not be verified.";
    if (hadPaid) {
      user.fee_status = "REFUNDED";
    }

    this.store.saveState();
    this.store.notify("USER_REJECTED", {
      user,
      refunded: hadPaid,
      feeAmount: hadPaid ? 99 : 0
    });
    return { user, refunded: hadPaid, feeAmount: hadPaid ? 99 : 0 };
  }

  getOnboardingPayments() {
    return this.store.getOnboardingPayments();
  }

  getOnboardingRevenueStats() {
    return this.store.getRevenueMetrics();
  }

  resolveDispute(sessionId, resolution) {
    const session = this.store.sessions.find((s) => s.id === sessionId);
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
      this.store.saveState();
      this.store.notify("DISPUTE_RESOLVED", { session, tx, resolution });
      return { session, tx };
    } else {
      // Cancel without debiting learner
      session.status = "CANCELLED";
      this.store.saveState();
      this.store.notify("DISPUTE_RESOLVED", {
        session,
        resolution: "cancelled"
      });
      return { session };
    }
  }

  getPendingCourses() {
    return this.store.getPendingCourses();
  }

  getAllCourses() {
    return this.store.getCourses();
  }

  approveCourse(courseId) {
    const course = this.store.getCourse(courseId);
    if (!course) throw new Error("Course not found.");

    course.status = "APPROVED";
    course.approved_at = new Date();

    // Also ensure creator is authorized as an approved educator
    const creator = this.store.getUser(course.creator_id);
    if (creator) {
      creator.creator_status = "APPROVED";
      creator.can_upload_videos = true;
    }

    this.store.saveState();
    this.store.notify("COURSE_APPROVED", { course, creator });
    return course;
  }

  rejectCourse(courseId, reason) {
    const course = this.store.getCourse(courseId);
    if (!course) throw new Error("Course not found.");

    course.status = "REJECTED";
    course.rejection_reason =
      reason ||
      "Course content does not meet platform quality or verification standards.";

    this.store.saveState();
    this.store.notify("COURSE_REJECTED", { course });
    return course;
  }

  grantCreatorPermission(userId) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");

    user.creator_status = "APPROVED";
    user.can_upload_videos = true;

    this.store.saveState();
    this.store.notify("CREATOR_PERMISSION_GRANTED", { user });
    return user;
  }

  revokeCreatorPermission(userId) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");

    user.creator_status = "REVOKED";
    user.can_upload_videos = false;

    this.store.saveState();
    this.store.notify("CREATOR_PERMISSION_REVOKED", { user });
    return user;
  }
}

window.admin = new AdminManager(window.store, window.ledger);
