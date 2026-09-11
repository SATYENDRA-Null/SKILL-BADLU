/**
 * SKILL BADLU — Access Gateway & Login Controller (js/login.js)
 * Handles Sign In / Sign Up toggles, Pre-Login Admin Verification Gate,
 * ₹99 Neo-Brutalist Payment Gateway processing, and live Express backend sync.
 */

(function () {
  // DOM Elements
  const tabSignIn = document.getElementById("tab-btn-signin");
  const tabSignUp = document.getElementById("tab-btn-signup");
  const nameGroup = document.getElementById("signup-name-group");
  const skillsGroup = document.getElementById("signup-skills-group");
  const policyNote = document.getElementById("signup-policy-note");
  const submitBtn = document.getElementById("btn-auth-submit");

  let currentPendingUserId = null;
  let currentSelectedPayMethod = "UPI (Instant)";

  // Mode switcher (Sign In vs Sign Up)
  function setMode(mode) {
    if (mode === "signup") {
      tabSignUp.classList.add("active");
      tabSignIn.classList.remove("active");
      nameGroup.style.display = "flex";
      skillsGroup.style.display = "flex";
      policyNote.style.display = "block";
      submitBtn.textContent = "Submit for Admin Verification →";
    } else {
      tabSignIn.classList.add("active");
      tabSignUp.classList.remove("active");
      nameGroup.style.display = "none";
      skillsGroup.style.display = "none";
      policyNote.style.display = "none";
      submitBtn.textContent = "Enter Platform →";
    }
  }

  // Modal helpers
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("active");
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("active");
  }

  // Toast notification helper
  function showNotification(msg) {
    const toast = document.getElementById("toast-notification");
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3500);
  }

  // Payment method selector
  function selectPayMethod(method) {
    document
      .querySelectorAll(".pay-method-btn")
      .forEach((b) => b.classList.remove("active"));
    document.getElementById("pay-content-upi").style.display = "none";
    document.getElementById("pay-content-card").style.display = "none";
    document.getElementById("pay-content-netbanking").style.display = "none";

    if (method === "upi") {
      document.getElementById("pay-tab-upi").classList.add("active");
      document.getElementById("pay-content-upi").style.display = "block";
      currentSelectedPayMethod = "UPI (Instant)";
    } else if (method === "card") {
      document.getElementById("pay-tab-card").classList.add("active");
      document.getElementById("pay-content-card").style.display = "block";
      currentSelectedPayMethod = "Credit/Debit Card";
    } else if (method === "netbanking") {
      document.getElementById("pay-tab-nb").classList.add("active");
      document.getElementById("pay-content-netbanking").style.display = "block";
      currentSelectedPayMethod = "NetBanking";
    }
  }

  function setUpiApp(app) {
    const vpa = document.getElementById("upi-vpa-input");
    if (vpa) vpa.value = "user@" + app.toLowerCase().replace(/[^a-z]/g, "");
    currentSelectedPayMethod = `UPI (${app})`;
    showNotification(`Selected ${app} for ₹99 payment.`);
  }

  // Login performer (Live Express API with fallback to Local Store)
  async function performLogin(userId, email, password) {
    // 1. Attempt Live Express API
    if (window.SkillBadluAPI) {
      try {
        const payload = userId
          ? { userId }
          : { email, password: password || "password123" };
        const res = await SkillBadluAPI.auth.login(payload);

        // Update client-side store for UI coherence
        if (res.user && typeof store !== "undefined") {
          store.currentUser = res.user;
          localStorage.setItem(
            "skillbadlu_current_user",
            JSON.stringify(res.user)
          );
        }

        const destination =
          res.destination ||
          (res.user && res.user.role === "admin" ? "admin.html" : "index.html");
        const label =
          res.user && res.user.role === "admin"
            ? "Admin Console"
            : "Swapper Dashboard";
        showNotification(
          `✓ Access Granted: ${res.user ? res.user.name : "User"}! Redirecting to ${label}...`
        );
        setTimeout(() => {
          window.location.href = destination;
        }, 350);
        return;
      } catch (err) {
        if (
          err.status === 403 &&
          err.data &&
          err.data.status === "PENDING_VERIFICATION"
        ) {
          currentPendingUserId = err.data.userId || userId;
          const u = err.data.user || {};
          document.getElementById("modal-pending-name").textContent =
            u.name || "Applicant";
          document.getElementById("modal-pending-email").textContent =
            u.email || email || "User Email";
          openModal("modal-pending-review");
          return;
        }

        if (
          err.status === 402 &&
          err.data &&
          err.data.status === "PAYMENT_REQUIRED"
        ) {
          currentPendingUserId = err.data.userId || userId;
          const u = err.data.user || {};
          document.getElementById("pay-user-name").textContent =
            u.name || "Approved User";
          document.getElementById("pay-user-email").textContent =
            u.email || email || "User Email";
          openModal("modal-payment-gateway");
          return;
        }

        if (err.status === 403 && err.data && err.data.status === "REJECTED") {
          alert(
            `Application Not Approved:\n${err.data.message || "Application rejected by admin."}`
          );
          return;
        }

        if (err.status === 401 || err.status === 404) {
          alert(
            "Authentication Notice: " +
              (err.data ? err.data.message : err.message)
          );
          return;
        }

        console.warn(
          "[Backend API offline or network notice, using local store]:",
          err.message
        );
      }
    }

    // 2. Fallback to Local Store
    try {
      const eligibility = store.checkLoginEligibility(userId);

      if (!eligibility.eligible) {
        if (eligibility.reason === "PENDING_VERIFICATION") {
          currentPendingUserId = userId;
          document.getElementById("modal-pending-name").textContent =
            eligibility.user.name;
          document.getElementById("modal-pending-email").textContent =
            eligibility.user.email;
          openModal("modal-pending-review");
          return;
        }

        if (eligibility.reason === "PAYMENT_REQUIRED") {
          currentPendingUserId = userId;
          document.getElementById("pay-user-name").textContent =
            eligibility.user.name;
          document.getElementById("pay-user-email").textContent =
            eligibility.user.email;
          openModal("modal-payment-gateway");
          return;
        }

        if (eligibility.reason === "REJECTED") {
          alert(`Application Not Approved:\n${eligibility.message}`);
          return;
        }

        alert("Authentication Notice: " + eligibility.message);
        return;
      }

      // User is fully verified and paid (or admin)
      const user = store.login(userId);
      const destination = user.role === "admin" ? "admin.html" : "index.html";
      const label =
        user.role === "admin" ? "Admin Console" : "Swapper Dashboard";
      showNotification(
        `✓ Access Granted: ${user.name}! Redirecting to ${label}...`
      );
      setTimeout(() => {
        window.location.href = destination;
      }, 350);
    } catch (err) {
      alert("Authentication error: " + err.message);
    }
  }

  // Process the ₹99 payment
  async function processOnboardingFeePayment() {
    if (!currentPendingUserId) return;

    const btn = document.getElementById("btn-process-payment");
    btn.textContent = "⏳ Processing ₹99 Payment via Gateway...";
    btn.disabled = true;

    // 1. Try Live API Gateway
    if (window.SkillBadluAPI) {
      try {
        const res = await SkillBadluAPI.payments.verifyAndPay({
          userId: currentPendingUserId,
          method: currentSelectedPayMethod
        });

        // Sync local store
        if (typeof store !== "undefined" && store.recordOnboardingPayment) {
          try {
            store.recordOnboardingPayment(currentPendingUserId, {
              method: currentSelectedPayMethod
            });
            store.login(currentPendingUserId, { bypassChecks: true });
          } catch (e) {}
        }

        showNotification(
          `✓ Payment of ₹99 Successful (${res.payment.id})! 50 Welcome Credits Minted.`
        );
        closeModal("modal-payment-gateway");

        setTimeout(() => {
          window.location.href = res.destination || "index.html";
        }, 400);
        return;
      } catch (err) {
        console.warn(
          "[API Payment notice, fallback to local store]:",
          err.message
        );
      }
    }

    // 2. Fallback to Local Store
    setTimeout(() => {
      try {
        const { user, payment } = store.recordOnboardingPayment(
          currentPendingUserId,
          {
            method: currentSelectedPayMethod
          }
        );

        // Log in user
        store.login(user.id, { bypassChecks: true });

        showNotification(
          `✓ Payment of ₹99 Successful (${payment.id})! 50 Welcome Credits Minted.`
        );
        closeModal("modal-payment-gateway");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 400);
      } catch (err) {
        alert("Payment processing error: " + err.message);
        btn.textContent = "⚡ Pay ₹99 & Enter Platform →";
        btn.disabled = false;
      }
    }, 600);
  }

  // Form handler
  async function handleFormAuth(e) {
    e.preventDefault();
    const isSignup = tabSignUp.classList.contains("active");
    const email = document
      .getElementById("auth-email")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("auth-password")
      ? document.getElementById("auth-password").value
      : "password123";

    if (isSignup) {
      const name =
        document.getElementById("auth-name").value.trim() || "New Applicant";
      const skillsText = document.getElementById("auth-skills")
        ? document.getElementById("auth-skills").value.trim()
        : "";
      const skillsHave = skillsText
        ? skillsText.split(",").map((s, idx) => ({
            skill_id: "sk_custom_" + idx,
            name: s.trim(),
            category: "tech",
            level: 3
          }))
        : [];

      // 1. Try Live API Register
      if (window.SkillBadluAPI) {
        try {
          const res = await SkillBadluAPI.auth.register({
            name,
            email,
            password,
            skillsHave
          });

          // Also keep local store in sync
          if (typeof store !== "undefined" && store.registerUser) {
            try {
              store.registerUser({
                id: res.user.id,
                name,
                email,
                password,
                skillsHave
              });
            } catch (e) {}
          }

          showNotification(
            `✓ Application submitted for ${name}! Awaiting Admin Verification.`
          );
          setMode("signin");
          document.getElementById("auth-email").value = email;

          currentPendingUserId = res.user.id;
          document.getElementById("modal-pending-name").textContent = name;
          document.getElementById("modal-pending-email").textContent = email;
          setTimeout(() => {
            openModal("modal-pending-review");
          }, 400);
          return;
        } catch (err) {
          console.warn(
            "[API Register notice, fallback to local store]:",
            err.message
          );
        }
      }

      // 2. Fallback to Local Store
      try {
        const newUser = store.registerUser({
          name,
          email,
          password: "password123",
          skillsHave
        });

        showNotification(
          `✓ Application submitted for ${newUser.name}! Awaiting Admin Verification.`
        );
        setMode("signin");
        document.getElementById("auth-email").value = newUser.email;

        currentPendingUserId = newUser.id;
        document.getElementById("modal-pending-name").textContent =
          newUser.name;
        document.getElementById("modal-pending-email").textContent =
          newUser.email;
        setTimeout(() => {
          openModal("modal-pending-review");
        }, 400);
      } catch (err) {
        alert("Registration Error: " + err.message);
      }
      return;
    }

    // Sign in mode
    const existing =
      typeof store !== "undefined"
        ? store.users.find((u) => u.email.toLowerCase() === email)
        : null;
    const userId = existing ? existing.id : null;
    performLogin(userId, email, password);
  }

  // Event Listeners on load
  document.addEventListener("DOMContentLoaded", () => {
    if (tabSignIn) tabSignIn.addEventListener("click", () => setMode("signin"));
    if (tabSignUp) tabSignUp.addEventListener("click", () => setMode("signup"));

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("tab") === "signup") {
      setMode("signup");
    }
  });

  // Expose global methods needed for onclick handlers in HTML
  window.setMode = setMode;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.showNotification = showNotification;
  window.selectPayMethod = selectPayMethod;
  window.setUpiApp = setUpiApp;
  window.performLogin = performLogin;
  window.processOnboardingFeePayment = processOnboardingFeePayment;
  window.handleFormAuth = handleFormAuth;
})();
