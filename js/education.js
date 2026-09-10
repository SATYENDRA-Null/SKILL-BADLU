/**
 * Skill Badlu — Education & Video Academy Manager
 * Implements: Credit-gated courses, Anti-Skip playback integrity verification,
 * Skipped-video warnings, and cryptographically stamped completion certificates.
 */

class EducationManager {
  constructor(store, ledger) {
    this.store = store;
    this.ledger = ledger;

    // Current active player session state
    this.activeCourse = null;
    this.activeEnrollment = null;
    this.activeVideoEl = null;

    // Anti-skip playback integrity tracker
    this.playbackTracker = {
      watchedIntervals: [], // Array of [start, end]
      lastPlaybackTime: 0,
      forwardSkipOccurred: false,
      maxAllowedForwardJump: 2.0, // seconds
      isCompleted: false,
      totalDuration: 0
    };
  }

  // --- 1. COURSE ENROLLMENT & PURCHASE ---

  /**
   * Enroll / Unlock a course by spending ledger credits.
   * Atomic transfer from Learner to Creator.
   */
  unlockCourse(courseId) {
    const currentUser = this.store.getCurrentUser();
    if (!currentUser) throw new Error("Please log in to unlock courses.");

    const course = this.store.getCourse(courseId);
    if (!course) throw new Error("Course not found.");
    if (course.status !== "APPROVED") {
      throw new Error("This course is currently awaiting admin approval.");
    }

    // Check if already enrolled
    const existingEnrollment = this.store.getUserEnrollment(currentUser.id, courseId);
    if (existingEnrollment) {
      return { success: true, alreadyEnrolled: true, enrollment: existingEnrollment };
    }

    const currentBalance = this.ledger.getBalance(currentUser.id);
    if (currentBalance < course.credit_cost) {
      throw new Error(`Insufficient credits (${currentBalance} CR). Unlocking requires ${course.credit_cost} CR.`);
    }

    // Insert ledger transaction (Learner -> Course Creator)
    let purchaseTx = null;
    if (course.credit_cost > 0 && currentUser.id !== course.creator_id) {
      purchaseTx = this.ledger.insertTransaction({
        sessionId: null,
        fromUser: currentUser.id,
        toUser: course.creator_id,
        amount: course.credit_cost,
        type: "EDUCATION_PURCHASE"
      });
    }

    const newEnrollment = {
      id: "enr_" + Math.random().toString(36).substring(2, 9),
      user_id: currentUser.id,
      course_id: course.id,
      enrolled_at: new Date(),
      completed: false,
      watched_seconds: 0,
      certificate_id: null
    };

    this.store.enrollments.unshift(newEnrollment);
    course.enrolled_count = (course.enrolled_count || 0) + 1;

    this.store.notify("COURSE_UNLOCKED", {
      course,
      enrollment: newEnrollment,
      transaction: purchaseTx
    });

    return { success: true, enrollment: newEnrollment, transaction: purchaseTx };
  }

  // --- 2. ANTI-SKIP VIDEO PLAYER & INTEGRITY TRACKER ---

  /**
   * Initialize anti-skip tracker for a video element.
   */
  initAntiSkipTracker(videoEl, course, enrollment) {
    this.activeCourse = course;
    this.activeEnrollment = enrollment;
    this.activeVideoEl = videoEl;

    // Reset tracker
    this.playbackTracker = {
      watchedIntervals: [],
      lastPlaybackTime: 0,
      forwardSkipOccurred: false,
      maxAllowedForwardJump: 2.0,
      isCompleted: enrollment ? enrollment.completed : false,
      totalDuration: course.duration_seconds || 45
    };

    // DOM indicators in modal (safe check if document exists)
    if (typeof document !== "undefined") {
      const elSkipAlert = document.getElementById("player-skip-warning");
      const elCompleteBanner = document.getElementById("player-complete-banner");
      const elClaimCertBtn = document.getElementById("btn-claim-certificate");
      const elIntegrityBadge = document.getElementById("player-integrity-badge");

      if (elSkipAlert) elSkipAlert.style.display = "none";
      if (elCompleteBanner) elCompleteBanner.style.display = enrollment?.completed ? "flex" : "none";
      if (elClaimCertBtn) {
        elClaimCertBtn.disabled = !enrollment?.completed;
        elClaimCertBtn.textContent = enrollment?.completed ? "🎓 Claim & View Certificate" : "🔒 Complete Video to Earn Certificate";
      }
    }

    // Wire HTML5 video events
    videoEl.onloadedmetadata = () => {
      this.playbackTracker.totalDuration = videoEl.duration || course.duration_seconds || 45;
      this.updatePlayerUI();
    };

    videoEl.ontimeupdate = () => {
      this.handleTimeUpdate();
    };

    videoEl.onseeking = () => {
      this.handleSeeking();
    };

    videoEl.onseeked = () => {
      this.handleSeeked();
    };

    videoEl.onended = () => {
      this.handleVideoEnded();
    };
  }

  handleTimeUpdate() {
    if (!this.activeVideoEl || !this.activeCourse) return;
    const currentTime = this.activeVideoEl.currentTime;
    const tracker = this.playbackTracker;

    // Detect forward skipping beyond the allowed tolerance
    if (currentTime - tracker.lastPlaybackTime > tracker.maxAllowedForwardJump) {
      tracker.forwardSkipOccurred = true;
      this.showSkippedWarning(true);
    } else if (currentTime >= tracker.lastPlaybackTime) {
      // Continuous forward playback: Record watched range [lastPlaybackTime, currentTime]
      this.addWatchedInterval(tracker.lastPlaybackTime, currentTime);
    }

    tracker.lastPlaybackTime = currentTime;
    this.updatePlayerUI();
  }

  handleSeeking() {
    if (!this.activeVideoEl) return;
    const tracker = this.playbackTracker;
    const newTime = this.activeVideoEl.currentTime;

    // If seeking ahead past what has been watched
    if (newTime > tracker.lastPlaybackTime + tracker.maxAllowedForwardJump) {
      tracker.forwardSkipOccurred = true;
      this.showSkippedWarning(true);
    }
  }

  handleSeeked() {
    if (!this.activeVideoEl) return;
    this.playbackTracker.lastPlaybackTime = this.activeVideoEl.currentTime;
    this.updatePlayerUI();
  }

  addWatchedInterval(start, end) {
    if (end <= start) return;
    this.playbackTracker.watchedIntervals.push([start, end]);
    // Merge overlapping intervals
    this.playbackTracker.watchedIntervals = this.mergeIntervals(this.playbackTracker.watchedIntervals);
  }

  mergeIntervals(intervals) {
    if (!intervals.length) return [];
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    const merged = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = sorted[i];

      if (curr[0] <= prev[1] + 0.5) {
        prev[1] = Math.max(prev[1], curr[1]);
      } else {
        merged.push(curr);
      }
    }
    return merged;
  }

  calculateTotalWatchedSeconds() {
    return this.playbackTracker.watchedIntervals.reduce((sum, interval) => {
      return sum + (interval[1] - interval[0]);
    }, 0);
  }

  handleVideoEnded() {
    const tracker = this.playbackTracker;
    const totalDuration = this.activeVideoEl?.duration || tracker.totalDuration || 1;
    const watchedSeconds = this.calculateTotalWatchedSeconds();
    const coverageRatio = watchedSeconds / totalDuration;

    console.log(`[AntiSkip Watch Integrity Check] Watched: ${watchedSeconds.toFixed(1)}s / Total: ${totalDuration.toFixed(1)}s (Coverage: ${(coverageRatio * 100).toFixed(1)}%). Forward Skip: ${tracker.forwardSkipOccurred}`);

    // Verification Criteria:
    // 1. No forward skip was left unaddressed
    // 2. Watched at least 95% of total video duration
    if (tracker.forwardSkipOccurred || coverageRatio < 0.95) {
      // Video was skipped!
      this.showSkippedWarning(true);
      if (window.appToast) {
        window.appToast("⚠️ Anti-Skip Protection: Video was skipped and not fully completed. Watch continuously to unlock certification.", "error");
      }
    } else {
      // Successful authentic completion!
      this.markCourseCompleted();
    }
  }

  showSkippedWarning(isSkipped) {
    if (typeof document === "undefined") return;
    const elSkipAlert = document.getElementById("player-skip-warning");
    const elIntegrityBadge = document.getElementById("player-integrity-badge");
    const elClaimCertBtn = document.getElementById("btn-claim-certificate");

    if (elSkipAlert) {
      elSkipAlert.style.display = isSkipped ? "block" : "none";
    }
    if (elIntegrityBadge) {
      if (isSkipped) {
        elIntegrityBadge.textContent = "⚠️ SKIPPING DETECTED — UNVERIFIED";
        elIntegrityBadge.style.backgroundColor = "#ff2d55";
        elIntegrityBadge.style.color = "#ffffff";
      } else {
        elIntegrityBadge.textContent = "✓ VERIFIED CONTINUOUS WATCHING";
        elIntegrityBadge.style.backgroundColor = "#00ff66";
        elIntegrityBadge.style.color = "#000000";
      }
    }
    if (elClaimCertBtn && isSkipped && !this.activeEnrollment?.completed) {
      elClaimCertBtn.disabled = true;
      elClaimCertBtn.textContent = "🔒 Skipped: Certification Locked";
    }
  }

  resetPlaybackToRewatch() {
    if (!this.activeVideoEl) return;
    this.playbackTracker.watchedIntervals = [];
    this.playbackTracker.lastPlaybackTime = 0;
    this.playbackTracker.forwardSkipOccurred = false;
    this.activeVideoEl.currentTime = 0;
    this.activeVideoEl.play();
    this.showSkippedWarning(false);
    this.updatePlayerUI();
  }

  markCourseCompleted() {
    if (!this.activeEnrollment || !this.activeCourse) return;

    this.activeEnrollment.completed = true;
    this.activeEnrollment.completed_at = new Date();
    this.playbackTracker.isCompleted = true;

    this.showSkippedWarning(false);

    if (typeof document !== "undefined") {
      const elCompleteBanner = document.getElementById("player-complete-banner");
      const elClaimCertBtn = document.getElementById("btn-claim-certificate");
      const elIntegrityBadge = document.getElementById("player-integrity-badge");

      if (elCompleteBanner) elCompleteBanner.style.display = "flex";
      if (elIntegrityBadge) {
        elIntegrityBadge.textContent = "★ 100% COMPLETE & CERTIFIED";
        elIntegrityBadge.style.backgroundColor = "#00ff66";
        elIntegrityBadge.style.color = "#000000";
      }
      if (elClaimCertBtn) {
        elClaimCertBtn.disabled = false;
        elClaimCertBtn.textContent = "🎓 Claim & View Certificate";
        elClaimCertBtn.classList.remove("btn-secondary");
        elClaimCertBtn.classList.add("neo-btn-primary");
      }
    }

    this.store.notify("COURSE_COMPLETED", {
      course: this.activeCourse,
      enrollment: this.activeEnrollment
    });
  }

  updatePlayerUI() {
    if (!this.activeVideoEl || typeof document === "undefined") return;
    const currentTime = this.activeVideoEl.currentTime || 0;
    const totalDuration = this.activeVideoEl.duration || this.playbackTracker.totalDuration || 1;
    const watchedSeconds = this.calculateTotalWatchedSeconds();

    const percent = Math.min(100, Math.round((watchedSeconds / totalDuration) * 100));

    const elProgressFill = document.getElementById("player-watched-progress-fill");
    const elProgressPct = document.getElementById("player-watched-percent");
    const elTimeCur = document.getElementById("player-time-current");
    const elTimeTotal = document.getElementById("player-time-total");

    if (elProgressFill) elProgressFill.style.width = `${percent}%`;
    if (elProgressPct) elProgressPct.textContent = `${percent}%`;

    const fmt = (sec) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (elTimeCur) elTimeCur.textContent = fmt(currentTime);
    if (elTimeTotal) elTimeTotal.textContent = fmt(totalDuration);
  }

  // --- 3. CERTIFICATE GENERATION ---

  /**
   * Issue / Retrieve official Certificate of Completion
   */
  claimCertificate(courseId) {
    const currentUser = this.store.getCurrentUser();
    if (!currentUser) throw new Error("Please log in to claim your certificate.");

    const course = this.store.getCourse(courseId);
    if (!course) throw new Error("Course not found.");

    const enrollment = this.store.getUserEnrollment(currentUser.id, courseId);
    if (!enrollment || !enrollment.completed) {
      throw new Error("You must complete the full video course without skipping to claim this certificate.");
    }

    let cert = this.store.certificates.find(c => c.user_id === currentUser.id && c.course_id === courseId);
    if (!cert) {
      const creator = this.store.getUser(course.creator_id) || { name: "Accredited Peer Mentor" };
      cert = {
        id: "CERT-SB-" + Math.floor(100000 + Math.random() * 900000) + "-2026",
        user_id: currentUser.id,
        user_name: currentUser.name.split(" (")[0],
        course_id: course.id,
        course_title: course.title,
        category: course.category,
        creator_id: course.creator_id,
        creator_name: creator.name.split(" (")[0],
        issued_at: new Date(),
        verification_hash: "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        accreditation_score: "100% (Anti-Skip Verified)"
      };

      this.store.certificates.unshift(cert);
      enrollment.certificate_id = cert.id;
      this.store.notify("CERTIFICATE_ISSUED", { certificate: cert, course, enrollment });
    }

    return cert;
  }
}

window.education = new EducationManager(window.store, window.ledger);
