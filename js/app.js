/**
 * Skill Badlu — Main UI Controller & View Coordinator
 * Reference: docs/architecture/system-design.md
 */

document.addEventListener("DOMContentLoaded", () => {
  const store = window.store;
  const ledger = window.ledger;
  const matchmaker = window.matchmaker;
  const sessions = window.sessions;
  const payouts = window.payouts;

  // Cache DOM Elements
  const elNavTabs = document.querySelectorAll(".nav-tab-btn, .nav-tab-white");
  const elSections = document.querySelectorAll(".app-section");
  const elBalanceAmount = document.getElementById("header-balance-amount");
  const elIntegrityBadge = document.getElementById("header-integrity-badge");
  const elToastContainer = document.getElementById("toast-container");

  // Initial State Setup
  function init() {
    bindNavigation();
    bindHeaderActions();
    bindAuthSystem();
    bindModals();
    bindMatchmakerSliders();
    bindPayoutControls();

    // Sync Authentication and initial render
    syncAuthState();
    renderHeroMetrics();

    if (store.isAuthenticated()) {
      updateHeader();
      renderSkillDirectory();
      renderMatchmaker();
      renderSessions();
      renderPayoutSection();
    }

    // Subscribe to all store updates
    store.subscribe((event, data) => {
      console.log(`[Store Event]: ${event}`, data);
      syncAuthState();
      renderHeroMetrics();

      if (store.isAuthenticated()) {
        updateHeader();
        renderSkillDirectory();
        renderMatchmaker();
        renderSessions();
        renderPayoutSection();
      }
    });
  }

  // Authentication State Synchronization
  function syncAuthState() {
    const isAuth = store.isAuthenticated();
    const currentUser = store.getCurrentUser();

    if (isAuth && currentUser) {
      document.body.classList.add("state-logged-in");
      document.body.classList.remove("state-logged-out");

      // Check admin status — Route dedicated admin console to admin.html
      if (currentUser.role === "admin") {
        window.location.href = "admin.html";
        return;
      }

      document.body.classList.remove("is-admin");
      const activeTabEl = document.querySelector(".app-section.active");
      if (!activeTabEl || activeTabEl.id === "tab-admin") {
        switchTab("tab-marketplace");
      }

      // Update avatar & name in header
      const elAvatar = document.getElementById("auth-user-avatar");
      const elName = document.getElementById("auth-user-name");
      const elRoleBadge = document.getElementById("auth-user-role-badge");

      if (elAvatar) elAvatar.textContent = currentUser.avatar;
      if (elName) elName.textContent = currentUser.name.split(" (")[0];
      if (elRoleBadge) {
        if (currentUser.role === "admin") {
          elRoleBadge.textContent = "ADMIN";
          elRoleBadge.style.backgroundColor = "#ffe600";
          elRoleBadge.style.color = "#000000";
        } else {
          elRoleBadge.textContent = "VERIFIED";
          elRoleBadge.style.backgroundColor = "#00ff66";
          elRoleBadge.style.color = "#000000";
        }
      }

      updateHeader();
    } else {
      document.body.classList.add("state-logged-out");
      document.body.classList.remove("state-logged-in");
      document.body.classList.remove("is-admin");
    }
  }

  // Toast Notification Helper
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    toast.innerHTML = `
      <span style="font-size:1.2rem; font-weight:bold;">${icon}</span>
      <div style="font-size:0.9rem;">${message}</div>
    `;
    elToastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Navigation Controller
  function bindNavigation() {
    elNavTabs.forEach(tabBtn => {
      tabBtn.addEventListener("click", () => {
        const targetId = tabBtn.getAttribute("data-tab");
        switchTab(targetId);
      });
    });

    // Handle any in-page tab jumps
    document.querySelectorAll("[data-jump-tab]").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = el.getAttribute("data-jump-tab");
        switchTab(targetId);
      });
    });
  }

  function switchTab(targetId) {
    elNavTabs.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === targetId);
    });

    elSections.forEach(section => {
      section.classList.toggle("active", section.id === targetId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Header & Global State Sync
  function updateHeader() {
    const currentUser = store.getCurrentUser();
    if (!currentUser) return;

    const balance = ledger.getBalance(currentUser.id);
    elBalanceAmount.textContent = `${balance} CR`;

    // Pulse green animation on balance update
    elBalanceAmount.style.transform = "scale(1.15)";
    setTimeout(() => {
      elBalanceAmount.style.transform = "scale(1)";
    }, 200);

    // Update sessions badge count (pending confirmation)
    const pendingConfCount = store.sessions.filter(s => s.status === "PENDING_CONFIRMATION" || s.status === "SCHEDULED").length;
    const sessionBadge = document.getElementById("sessions-tab-badge");
    if (sessionBadge) {
      sessionBadge.textContent = pendingConfCount;
      sessionBadge.style.display = pendingConfCount > 0 ? "inline-block" : "none";
    }
  }

  function bindHeaderActions() {
    elIntegrityBadge?.addEventListener("click", () => {
      openReconciliationModal();
    });

    document.getElementById("btn-run-audit-ledger")?.addEventListener("click", () => {
      openReconciliationModal();
    });
  }

  // Hero Metrics
  function renderHeroMetrics() {
    const elActiveSwappers = document.getElementById("stat-active-swappers");
    const elSettledSessions = document.getElementById("stat-settled-sessions");
    const elCirculatingCredits = document.getElementById("stat-circulating-credits");

    if (elActiveSwappers) elActiveSwappers.textContent = store.users.length;
    if (elSettledSessions) {
      elSettledSessions.textContent = store.sessions.filter(s => s.status === "SETTLED").length;
    }
    if (elCirculatingCredits) {
      let totalVolume = 0;
      store.transactions.forEach(tx => totalVolume += tx.amount);
      elCirculatingCredits.textContent = `${totalVolume} CR`;
    }
  }

  // 1. Skill Directory View
  function renderSkillDirectory() {
    const currentUser = store.getCurrentUser();
    if (!currentUser) return;

    const haveListEl = document.getElementById("skills-have-list");
    const wantListEl = document.getElementById("skills-want-list");
    const haveCountEl = document.getElementById("skills-have-count");
    const wantCountEl = document.getElementById("skills-want-count");

    if (haveCountEl) haveCountEl.textContent = `${currentUser.skills_have.length} Skills`;
    if (wantCountEl) wantCountEl.textContent = `${currentUser.skills_want.length} Skills`;

    const renderSkillCards = (skills, type) => {
      return skills.map(skill => {
        const catClass = `cat-${skill.category || 'tech'}`;
        const levelNames = ["Beginner", "Intermediate", "Advanced", "Expert"];
        const levelDots = [1, 2, 3, 4].map(l => 
          `<span class="level-dot ${l <= skill.level ? 'active' : ''}"></span>`
        ).join("");

        return `
          <div class="skill-pill-card">
            <div class="skill-main-info">
              <span class="skill-category-tag ${catClass}">${skill.category || 'TECH'}</span>
              <div>
                <div class="skill-name">${skill.name}</div>
                <div class="level-indicator">
                  <span>Level ${skill.level} (${levelNames[skill.level - 1] || 'Standard'})</span>
                  <div class="level-dots">${levelDots}</div>
                </div>
              </div>
            </div>
            <button class="btn btn-sm btn-secondary" onclick="window.removeUserSkill('${type}', '${skill.skill_id}')" title="Remove skill">
              ✕
            </button>
          </div>
        `;
      }).join("");
    };

    if (haveListEl) haveListEl.innerHTML = renderSkillCards(currentUser.skills_have, "have");
    if (wantListEl) wantListEl.innerHTML = renderSkillCards(currentUser.skills_want, "want");
  }

  window.removeUserSkill = function(type, skillId) {
    const currentUser = store.getCurrentUser();
    if (!currentUser) return;
    if (type === "have") {
      currentUser.skills_have = currentUser.skills_have.filter(s => s.skill_id !== skillId);
    } else {
      currentUser.skills_want = currentUser.skills_want.filter(s => s.skill_id !== skillId);
    }
    store.notify("USER_SKILLS_UPDATED");
    showToast("Skill declaration updated.", "info");
  };

  // 2. Matchmaking Engine View
  function bindMatchmakerSliders() {
    const sliders = [
      { id: "slider-w1", key: "w1", valId: "val-w1" },
      { id: "slider-w2", key: "w2", valId: "val-w2" },
      { id: "slider-w3", key: "w3", valId: "val-w3" },
      { id: "slider-w4", key: "w4", valId: "val-w4" },
      { id: "slider-w5", key: "w5", valId: "val-w5" }
    ];

    sliders.forEach(({ id, key, valId }) => {
      const sliderEl = document.getElementById(id);
      const valEl = document.getElementById(valId);
      if (!sliderEl) return;

      sliderEl.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        valEl.textContent = val.toFixed(2);
        matchmaker.setWeights({ [key]: val });
        renderMatchmaker();
      });
    });

    document.getElementById("btn-reset-weights")?.addEventListener("click", () => {
      const defaultWeights = { w1: 0.30, w2: 0.15, w3: 0.35, w4: 0.10, w5: 0.10 };
      matchmaker.setWeights(defaultWeights);
      sliders.forEach(({ id, key, valId }) => {
        document.getElementById(id).value = defaultWeights[key];
        document.getElementById(valId).textContent = defaultWeights[key].toFixed(2);
      });
      renderMatchmaker();
      showToast("Matchmaking weights reset to default.", "info");
    });
  }

  function renderMatchmaker() {
    const currentUser = store.getCurrentUser();
    const container = document.getElementById("matches-container");
    if (!currentUser || !container) return;

    const matches = matchmaker.findMatches(currentUser);

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:48px;">
          <div style="font-size:2rem; margin-bottom:12px;">🔍</div>
          <h3>No eligible matches found</h3>
          <p style="color:var(--text-secondary); margin-top:8px;">
            Try declaring more skills in your <strong>"Skills I Want"</strong> list or adjust algorithm weights.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(match => {
      const cand = match.candidate;
      const b = match.breakdown;
      const teacheList = match.matchingSkills.candTeaches.map(s => `<strong>${s.name}</strong>`).join(", ");
      const learnList = match.matchingSkills.userTeaches.map(s => `<strong>${s.name}</strong>`).join(", ");

      return `
        <div class="match-card">
          <div class="match-card-top">
            <div class="candidate-profile">
              <div class="candidate-avatar">${cand.avatar}</div>
              <div>
                <div class="candidate-name">${cand.name}</div>
                <div class="candidate-rating">
                  ★ ${cand.avg_rating.toFixed(2)} Rating • Active recently
                </div>
              </div>
            </div>
            <div class="match-score-badge">
              <div class="score-number">${match.totalScore}%</div>
              <div class="score-caption">Affinity Score</div>
            </div>
          </div>

          <!-- Swap Preview Banner -->
          <div class="swap-skills-preview">
            <div class="swap-side">
              <div class="swap-side-title">They Teach You</div>
              <div class="swap-skill-pill">${teacheList || 'General Mentorship'}</div>
            </div>
            <div class="swap-arrow">⇄</div>
            <div class="swap-side">
              <div class="swap-side-title">You Teach Them</div>
              <div class="swap-skill-pill">${learnList || 'Open for Proposal'}</div>
            </div>
          </div>

          <!-- Scoring Breakdown Pills -->
          <div class="match-breakdown">
            <div class="breakdown-stat">
              <span class="breakdown-label">Tag Overlap</span>
              <span class="breakdown-val">${b.overlapScore}%</span>
            </div>
            <div class="breakdown-stat">
              <span class="breakdown-label">Level Match</span>
              <span class="breakdown-val">${b.levelCompat}%</span>
            </div>
            <div class="breakdown-stat">
              <span class="breakdown-label">Mutual Swap</span>
              <span class="breakdown-val">${b.isMutualSwap ? '✓ YES (Bonus)' : '✕ Direct'}</span>
            </div>
            <div class="breakdown-stat">
              <span class="breakdown-label">Rating Factor</span>
              <span class="breakdown-val">${b.ratingScore}%</span>
            </div>
            <div class="breakdown-stat">
              <span class="breakdown-label">Recency</span>
              <span class="breakdown-val">${b.recencyScore}%</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            ${b.isMutualSwap ? `
              <span class="mutual-swap-tag">
                <span>⚡</span> True 2-Way Reciprocal Swap
              </span>
            ` : `
              <span style="font-size:0.8rem; color:var(--text-muted);">
                Single-direction skill transfer
              </span>
            `}
            <button class="btn btn-primary btn-sm neo-btn neo-btn-primary" onclick="window.initiateSessionSwap('${cand.id}', '${match.matchingSkills.candTeaches[0]?.skill_id || ''}')">
              Schedule Swap Session (50 CR)
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  window.initiateSessionSwap = function(teacherId, skillId) {
    try {
      const newSession = sessions.requestSession({
        teacherId,
        skillId: skillId || "sk_french",
        creditAmount: 50
      });
      showToast(`Swap session requested with ${store.getUser(teacherId).name}!`, "success");
      switchTab("tab-sessions");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // 3. Sessions & Two-Way Confirmation Simulator
  function renderSessions() {
    const container = document.getElementById("sessions-container");
    if (!container) return;

    if (store.sessions.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:48px;">
          <h3>No active swap sessions</h3>
          <p style="color:var(--text-secondary); margin-top:8px;">
            Head over to the <strong>Matchmaker</strong> tab to discover complementary peers!
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = store.sessions.map(s => {
      const learner = store.getUser(s.learner_id) || { name: s.learner_id };
      const teacher = store.getUser(s.teacher_id) || { name: s.teacher_id };
      const statusClass = `status-${s.status.toLowerCase()}`;

      return `
        <div class="session-card">
          <div class="session-header-row">
            <div class="session-title-block">
              <div>
                <h3 style="font-size:1.15rem;">${s.skill_name}</h3>
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">
                  Learner: <strong>${learner.name}</strong> • Teacher: <strong>${teacher.name}</strong> • Agreed: <strong>${s.agreed_credit_amount} CR</strong>
                </div>
              </div>
            </div>
            <span class="session-status-badge ${statusClass}">${s.status.replace('_', ' ')}</span>
          </div>

          <!-- Two-Way Confirmation Stepper -->
          <div class="confirmation-stepper">
            <div class="confirm-box">
              <div class="confirm-user-info">
                <span class="confirm-status-icon ${s.confirmed_by_a ? 'confirm-done' : 'confirm-waiting'}">
                  ${s.confirmed_by_a ? '✓' : '1'}
                </span>
                <div>
                  <div style="font-weight:600; font-size:0.9rem;">${learner.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">
                    Learner: ${s.confirmed_by_a ? '<span style="color:#34d399;">Confirmed</span>' : 'Awaiting Confirmation'}
                  </div>
                </div>
              </div>
            </div>

            <div class="stepper-arrow">⇄</div>

            <div class="confirm-box">
              <div class="confirm-user-info">
                <span class="confirm-status-icon ${s.confirmed_by_b ? 'confirm-done' : 'confirm-waiting'}">
                  ${s.confirmed_by_b ? '✓' : '2'}
                </span>
                <div>
                  <div style="font-weight:600; font-size:0.9rem;">${teacher.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">
                    Teacher: ${s.confirmed_by_b ? '<span style="color:#34d399;">Confirmed</span>' : 'Awaiting Confirmation'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactive Actions Based on State -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:12px; border-top:1px solid var(--border-subtle);">
            <div style="font-size:0.8rem; color:var(--text-muted);">
              Session ID: <code style="color:#a5b4fc;">${s.id}</code>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              ${s.status === "REQUESTED" ? `
                <button class="btn btn-secondary btn-sm" onclick="window.advanceSessionState('${s.id}', 'accept')">
                  Accept & Schedule
                </button>
              ` : ''}

              ${s.status === "SCHEDULED" ? `
                <button class="btn btn-primary btn-sm" onclick="window.advanceSessionState('${s.id}', 'start')">
                  Start Video Call
                </button>
              ` : ''}

              ${s.status === "IN_PROGRESS" ? `
                <button class="btn btn-primary btn-sm" onclick="window.advanceSessionState('${s.id}', 'conclude')">
                  Conclude Session
                </button>
              ` : ''}

              ${(s.status === "PENDING_CONFIRMATION" || s.status === "SCHEDULED" || s.status === "IN_PROGRESS") ? `
                ${!s.confirmed_by_a ? `
                  <button class="btn btn-emerald btn-sm" onclick="window.confirmSessionRole('${s.id}', 'learner')">
                    Confirm as Learner (A)
                  </button>
                ` : ''}
                ${!s.confirmed_by_b ? `
                  <button class="btn btn-emerald btn-sm" onclick="window.confirmSessionRole('${s.id}', 'teacher')">
                    Confirm as Teacher (B)
                  </button>
                ` : ''}
                <button class="btn btn-rose btn-sm" onclick="window.flagSessionDispute('${s.id}')">
                  Flag Dispute
                </button>
              ` : ''}

              ${s.status === "SETTLED" ? `
                <div style="display:flex; align-items:center; gap:8px; color:#34d399; font-size:0.9rem; font-weight:600;">
                  <span>✓</span> Settled in Ledger (${s.agreed_credit_amount} CR Transferred)
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  window.advanceSessionState = function(sessionId, action) {
    try {
      if (action === "accept") sessions.acceptSession(sessionId);
      if (action === "start") sessions.startSession(sessionId);
      if (action === "conclude") sessions.concludeSession(sessionId);
      showToast(`Session status updated: ${action}`, "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  window.confirmSessionRole = function(sessionId, role) {
    try {
      const result = sessions.confirmSession(sessionId, role);
      if (result.settled) {
        showToast(`Both parties confirmed! ${result.settlement.transaction.amount} Credits settled to ledger atomically!`, "success");
      } else {
        showToast(`Confirmed as ${role}. Waiting on peer confirmation for atomic ledger release.`, "info");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  window.flagSessionDispute = function(sessionId) {
    const reason = prompt("Describe the dispute reason (e.g. peer did not attend, poor audio):", "Peer did not attend scheduled session.");
    if (reason) {
      sessions.disputeSession(sessionId, reason);
      showToast("Session moved to DISPUTED state. Excluded from ledger settlement pending admin review.", "error");
    }
  };



  // 5. Payout Gateway View
  function bindPayoutControls() {
    const failureToggle = document.getElementById("toggle-simulate-failure");
    if (failureToggle) {
      failureToggle.addEventListener("change", (e) => {
        payouts.setSimulateFailure(e.target.checked);
        showToast(
          e.target.checked 
            ? "Gateway Failure Simulation ENABLED. Next payout will demonstrate compensating reversal."
            : "Gateway Failure Simulation DISABLED. Normal transfers active.",
          e.target.checked ? "error" : "info"
        );
      });
    }

    document.getElementById("btn-submit-payout")?.addEventListener("click", async () => {
      const currentUser = store.getCurrentUser();
      const amountInput = document.getElementById("input-payout-amount");
      const btn = document.getElementById("btn-submit-payout");
      const amount = parseInt(amountInput.value, 10);

      if (!amount || amount <= 0) {
        showToast("Please enter a valid payout credit amount.", "error");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Connecting to Payment Gateway...";

      try {
        const res = await payouts.requestPayout({
          userId: currentUser.id,
          amount
        });
        showToast(res.message, "success");
        amountInput.value = "";
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Withdraw Funds via Razorpay";
      }
    });
  }

  function renderPayoutSection() {
    const currentUser = store.getCurrentUser();
    if (!currentUser) return;

    const availableBalance = ledger.getBalance(currentUser.id);
    const elAvailable = document.getElementById("payout-available-balance");
    const elFiatEquivalent = document.getElementById("payout-fiat-equivalent");

    if (elAvailable) elAvailable.textContent = `${availableBalance} CR`;
    if (elFiatEquivalent) elFiatEquivalent.textContent = `₹${availableBalance * 10} INR`;
  }



  // Modals Controller
  function bindModals() {
    // Add Skill Modal
    const btnAddSkill = document.getElementById("btn-add-skill-modal");
    const modalAddSkill = document.getElementById("modal-add-skill");
    const btnCloseSkill = document.getElementById("modal-skill-close");

    btnAddSkill?.addEventListener("click", () => modalAddSkill.classList.add("active"));
    btnCloseSkill?.addEventListener("click", () => modalAddSkill.classList.remove("active"));

    document.getElementById("form-add-skill")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const currentUser = store.getCurrentUser();
      const name = document.getElementById("input-skill-name").value;
      const type = document.getElementById("select-skill-type").value;
      const category = document.getElementById("select-skill-cat").value;
      const level = parseInt(document.getElementById("select-skill-level").value, 10);

      const newSkill = {
        skill_id: "sk_" + Math.random().toString(36).substring(2, 8),
        name,
        category,
        level
      };

      if (type === "HAVE") {
        currentUser.skills_have.push(newSkill);
      } else {
        currentUser.skills_want.push(newSkill);
      }

      store.notify("USER_SKILLS_UPDATED");
      modalAddSkill.classList.remove("active");
      e.target.reset();
      showToast(`Skill added to ${type === 'HAVE' ? 'Skills I Have' : 'Skills I Want'}!`, "success");
    });

    // Reconciliation Modal
    const modalRecon = document.getElementById("modal-reconciliation");
    const btnCloseRecon = document.getElementById("modal-recon-close");
    btnCloseRecon?.addEventListener("click", () => modalRecon.classList.remove("active"));
  }

  // Authentication Controller & Navigation Bindings
  function bindAuthSystem() {
    const signOutBtn = document.getElementById("header-btn-signout");

    // Any legacy .btn-open-auth elements cleanly navigate to login.html
    document.querySelectorAll(".btn-open-auth").forEach(btn => {
      btn.addEventListener("click", (e) => {
        if (btn.tagName.toLowerCase() !== "a") {
          e.preventDefault();
          const tab = btn.getAttribute("data-auth-tab") || "signin";
          window.location.href = `login.html?tab=${tab}`;
        }
      });
    });

    signOutBtn?.addEventListener("click", () => {
      store.logout();
      showToast("Signed out successfully. Returning to landing page.", "info");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("nav-guest-home")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("nav-guest-features")?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
    });

    document.getElementById("nav-guest-howitworks")?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("how-it-works-section")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  window.quickDemoLogin = function(userId) {
    try {
      const user = store.login(userId);
      if (user.role === "admin") {
        showToast(`Welcome back, ${user.name}! Accessing Admin Console...`, "success");
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 200);
        return;
      }

      showToast(`Welcome back, ${user.name}! Accessing live dashboard.`, "success");
      switchTab("tab-marketplace");
      setTimeout(() => {
        const container = document.getElementById("platform-dashboard-container");
        if (container) {
          const y = container.getBoundingClientRect().top + window.pageYOffset - 20;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }
      }, 200);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  window.viewPublicAudit = function() {
    openReconciliationModal();
  };

  function openReconciliationModal() {
    const modal = document.getElementById("modal-reconciliation");
    if (!modal) return;
    const report = ledger.reconcile();

    const elBadge = document.getElementById("recon-status-badge");
    if (elBadge) {
      elBadge.textContent = report.isVerified ? "100% RECONCILED (OK)" : "DISCREPANCY DETECTED";
      elBadge.style.color = report.isVerified ? "#34d399" : "#f43f5e";
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal("recon-total-tx", report.totalTransactions);
    setVal("recon-total-minted", `${report.totalMinted} CR`);
    setVal("recon-total-cashed", `${report.totalCashedOut} CR`);
    setVal("recon-user-balances", `${report.circulatingSupply} CR`);
    setVal("recon-discrepancy", `${report.discrepancy} CR`);

    const userTableBody = document.getElementById("recon-user-tbody");
    if (userTableBody) {
      userTableBody.innerHTML = report.userAudits.map(u => `
        <tr>
          <td><strong>${u.userName}</strong></td>
          <td><code>${u.userId}</code></td>
          <td style="font-family:var(--font-mono); font-weight:bold; color:#38bdf8;">${u.derivedBalance} CR</td>
          <td style="color:#34d399; font-weight:600;">✓ ${u.status}</td>
        </tr>
      `).join("");
    }

    modal.classList.add("active");
  }

  // Launch Application
  init();
});
