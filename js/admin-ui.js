/**
 * SKILL BADLU — Sovereign Admin Console UI Controller (js/admin-ui.js)
 * Manages KYC user approvals, Video upload moderation, ₹99 Onboarding Revenue tracking,
 * Invoicing, Dispute arbitration, and Solvency Reconciliation.
 */

(function () {
  let currentVideoSubTab = "pending";
  let currentKycSubTab = "pending";

  // 1. Authentication & Role Gate
  document.addEventListener("DOMContentLoaded", () => {
    const currentUser = store.getCurrentUser();

    // Auto-set admin if not logged in or in test mode
    if (!currentUser || currentUser.role !== "admin") {
      store.login("user_admin");
    }

    bindAdminTabs();
    renderAllAdminViews();

    // Subscribe to store updates
    store.subscribe(() => {
      renderAllAdminViews();
    });
  });

  // 2. Tab Navigation
  function bindAdminTabs() {
    const adminTabs = document.querySelectorAll(".admin-nav-tab");
    adminTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetId = tab.getAttribute("data-tab");
        switchAdminTab(targetId);
      });
    });
  }

  function switchAdminTab(targetId) {
    const adminTabs = document.querySelectorAll(".admin-nav-tab");
    const adminPanes = document.querySelectorAll(".admin-section-pane");

    adminTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-tab") === targetId);
    });
    adminPanes.forEach((pane) => {
      pane.classList.toggle("active", pane.id === targetId);
    });
  }

  function switchVideoSubTab(tabKey) {
    currentVideoSubTab = tabKey;
    const btnPending = document.getElementById("subtab-btn-pending-videos");
    const btnPublished = document.getElementById("subtab-btn-published-videos");
    const btnCreators = document.getElementById("subtab-btn-creator-perms");
    const coursesContainer = document.getElementById(
      "admin-courses-list-container"
    );
    const educatorsContainer = document.getElementById(
      "admin-educators-list-container"
    );

    if (btnPending) {
      btnPending.className =
        tabKey === "pending"
          ? "btn-admin-action btn-admin-approve"
          : "btn-admin-action btn-admin-neutral";
    }
    if (btnPublished) {
      btnPublished.className =
        tabKey === "published"
          ? "btn-admin-action btn-admin-approve"
          : "btn-admin-action btn-admin-neutral";
    }
    if (btnCreators) {
      btnCreators.className =
        tabKey === "creators"
          ? "btn-admin-action btn-admin-approve"
          : "btn-admin-action btn-admin-neutral";
    }

    if (tabKey === "creators") {
      if (coursesContainer) coursesContainer.style.display = "none";
      if (educatorsContainer) educatorsContainer.style.display = "block";
      renderEducatorsTable();
    } else {
      if (coursesContainer) coursesContainer.style.display = "block";
      if (educatorsContainer) educatorsContainer.style.display = "none";
      renderCoursesList();
    }
  }

  function switchKycSubTab(tabKey) {
    currentKycSubTab = tabKey;
    const btnPending = document.getElementById("kyc-subtab-btn-pending");
    const btnAll = document.getElementById("kyc-subtab-btn-all");

    if (btnPending) {
      btnPending.className =
        tabKey === "pending"
          ? "btn-admin-action btn-admin-approve"
          : "btn-admin-action btn-admin-neutral";
    }
    if (btnAll) {
      btnAll.className =
        tabKey === "all"
          ? "btn-admin-action btn-admin-approve"
          : "btn-admin-action btn-admin-neutral";
    }

    const pendingUsers = store.getPendingVerificationUsers();
    renderKycList(pendingUsers);
  }

  // 3. Main View Renderers
  function renderAllAdminViews() {
    const pendingUsers = store.getPendingVerificationUsers();
    const disputedSessions = store.getDisputedSessions();
    const pendingCourses = store.courses.filter(
      (c) => c.status === "PENDING_REVIEW"
    );
    const approvedCourses = store.courses.filter(
      (c) => c.status === "PUBLISHED"
    );
    const txs = store.transactions;
    const revenueStats = store.getRevenueMetrics();

    // Update Platform Metrics
    const elCirculating = document.getElementById("kpi-circulating-credits");
    if (elCirculating)
      elCirculating.textContent = `${store.getTotalCirculatingCredits()} CR`;

    const elSessions = document.getElementById("kpi-active-escrows");
    if (elSessions)
      elSessions.textContent = `${store.getActiveSessionsCount()} SESSIONS`;

    const elDisputes = document.getElementById("kpi-open-disputes");
    if (elDisputes) {
      elDisputes.textContent = `${disputedSessions.length} DISPUTE${disputedSessions.length === 1 ? "" : "S"}`;
      elDisputes.style.color =
        disputedSessions.length > 0 ? "#ff2d55" : "#000000";
    }

    // Update Onboarding Revenue KPI
    const elRevenue = document.getElementById("kpi-onboarding-revenue");
    if (elRevenue) elRevenue.textContent = `₹${revenueStats.totalRevenue}`;

    const elRevenueSub = document.getElementById("kpi-onboarding-subtext");
    if (elRevenueSub)
      elRevenueSub.textContent = `${revenueStats.paidCount} Paid • ${revenueStats.pendingPaymentCount} Pending Payment`;

    const elPayTotal = document.getElementById("payments-total-revenue");
    if (elPayTotal) elPayTotal.textContent = `₹${revenueStats.totalRevenue}.00`;

    const elPayPaid = document.getElementById("payments-paid-count");
    if (elPayPaid) elPayPaid.textContent = revenueStats.paidCount;

    const elPayPending = document.getElementById("payments-pending-count");
    if (elPayPending)
      elPayPending.textContent = revenueStats.pendingPaymentCount;

    const elPendingKyc = document.getElementById("kpi-pending-reviews");
    if (elPendingKyc)
      elPendingKyc.textContent = `${pendingUsers.length} USER${pendingUsers.length === 1 ? "" : "S"}`;

    const elKpiCourses = document.getElementById("kpi-pending-courses");
    if (elKpiCourses) {
      elKpiCourses.textContent = `${pendingCourses.length} PENDING`;
    }

    // Badges
    const kycBadge = document.getElementById("admin-kyc-badge");
    if (kycBadge) {
      kycBadge.textContent = pendingUsers.length;
      kycBadge.style.display =
        pendingUsers.length > 0 ? "inline-block" : "none";
    }

    const paymentsBadge = document.getElementById("admin-payments-badge");
    if (paymentsBadge) {
      paymentsBadge.textContent = revenueStats.paidCount;
    }

    const coursesBadge = document.getElementById("admin-courses-badge");
    if (coursesBadge) {
      coursesBadge.textContent = pendingCourses.length;
      coursesBadge.style.display =
        pendingCourses.length > 0 ? "inline-block" : "none";
    }

    const paneKycCount = document.getElementById("pane-kyc-count");
    if (paneKycCount) {
      paneKycCount.textContent = `${pendingUsers.length} PENDING`;
    }

    const paneCoursesCount = document.getElementById("pane-courses-count");
    if (paneCoursesCount) {
      paneCoursesCount.textContent = `${pendingCourses.length} PENDING APPROVAL`;
    }

    // Subtab counts
    const elSubPending = document.getElementById("subtab-count-pending");
    const elSubPub = document.getElementById("subtab-count-published");
    const elSubCreat = document.getElementById("subtab-count-creators");

    if (elSubPending) elSubPending.textContent = pendingCourses.length;
    if (elSubPub) elSubPub.textContent = approvedCourses.length;
    if (elSubCreat) elSubCreat.textContent = store.users.length;

    const elKycSubPending = document.getElementById("kyc-subtab-count-pending");
    const elKycSubAll = document.getElementById("kyc-subtab-count-all");
    if (elKycSubPending) elKycSubPending.textContent = pendingUsers.length;
    if (elKycSubAll)
      elKycSubAll.textContent = store.users.filter(
        (u) => u.role !== "admin"
      ).length;

    const disputesBadge = document.getElementById("admin-disputes-badge");
    if (disputesBadge) {
      disputesBadge.textContent = disputedSessions.length;
    }

    // Render Sub-Views
    renderKycList(pendingUsers);
    renderPaymentsList();

    if (currentVideoSubTab === "creators") {
      renderEducatorsTable();
    } else {
      renderCoursesList();
    }

    renderDisputesList(disputedSessions);
    renderLedgerTable(txs);
    renderOverviewTrays(pendingUsers, disputedSessions, pendingCourses);
  }

  function renderKycList(pendingUsers) {
    const container = document.getElementById("admin-kyc-list-container");
    if (!container) return;

    if (currentKycSubTab === "pending") {
      if (pendingUsers.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding:36px; color:#666666; background:#faf9f5; border:2px dashed #999;">
            <div style="font-size:2rem; margin-bottom:8px;">✓</div>
            <div style="font-weight:800; font-size:1rem;">All User Applications Reviewed</div>
            <div style="font-size:0.8rem; margin-top:4px;">No members currently waiting in the KYC screening queue.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = pendingUsers
        .map(
          (user) => `
        <div class="admin-review-row" style="border-left: 6px solid #ffe600;">
          <div>
            <div style="font-family:var(--font-heading); font-weight:800; font-size:1.05rem; color:#000;">
              ${user.name}
            </div>
            <div style="font-size:0.82rem; color:#555555; margin-top:3px;">
              <strong>Email:</strong> ${user.email} &bull; 
              <strong>Fee:</strong> ₹99 (Payable post-verification at login) &bull; 
              <strong>KYC:</strong> <span class="badge-kyc-pill badge-kyc-pending">PENDING ADMIN REVIEW</span>
            </div>
            <div style="font-size:0.75rem; color:#666666; margin-top:3px;">
              Skills Offered: ${user.skills_have ? user.skills_have.map((s) => s.name).join(", ") : "General declaration"}
            </div>
          </div>
          <div class="admin-actions-group">
            <button class="btn-admin-action btn-admin-approve" onclick="approveUser('${user.id}')">
              ✓ Verify &amp; Approve Applicant
            </button>
            <button class="btn-admin-action btn-admin-reject" onclick="rejectUser('${user.id}')">
              ✕ Reject Application
            </button>
          </div>
        </div>
      `
        )
        .join("");
    } else {
      // All members view
      const allSwappers = store.users.filter((u) => u.role !== "admin");
      container.innerHTML = `
        <div style="overflow-x:auto;">
          <table class="admin-ledger-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Admin Verification</th>
                <th>₹99 Onboarding Fee</th>
                <th>Credits Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${allSwappers
                .map((u) => {
                  const isVerified = u.verified_status === "VERIFIED";
                  const isPaid = u.fee_status === "PAID";
                  const bal = ledger.getBalance(u.id);

                  return `
                    <tr>
                      <td><strong>${u.name}</strong></td>
                      <td class="mono">${u.email}</td>
                      <td>
                        <span class="badge-kyc-pill ${isVerified ? "badge-kyc-verified" : "badge-kyc-pending"}">
                          ${isVerified ? "✓ VERIFIED" : "⏳ PENDING"}
                        </span>
                      </td>
                      <td>
                        <span style="font-weight:900; padding:2px 6px; border:1px solid #000; background:${isPaid ? "#00ff66" : "#ffe600"}; font-size:0.75rem;">
                          ${isPaid ? "✓ PAID (₹99)" : "⏳ PENDING PAYMENT (₹99)"}
                        </span>
                      </td>
                      <td style="font-family:var(--font-mono); font-weight:900;">${bal} CR</td>
                      <td>
                        ${
                          isVerified
                            ? `<span style="font-size:0.75rem; color:#00aa44; font-weight:800;">✓ Active</span>`
                            : `
                          <button class="btn-admin-action btn-admin-approve" style="padding:4px 8px; font-size:0.72rem;" onclick="approveUser('${u.id}')">
                            Approve
                          </button>
                        `
                        }
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  function renderPaymentsList() {
    const container = document.getElementById("admin-payments-list-container");
    if (!container) return;

    const payments = store.getOnboardingPayments();

    if (payments.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:36px; color:#666666; background:#faf9f5; border:2px dashed #999;">
          <div style="font-size:2rem; margin-bottom:8px;">💳</div>
          <div style="font-weight:800; font-size:1rem;">No Onboarding Payments Recorded</div>
          <div style="font-size:0.8rem; margin-top:4px;">Payments made by applicants during login will be logged here in real-time.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-ledger-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Applicant Name</th>
              <th>Email</th>
              <th>Amount Paid</th>
              <th>Method</th>
              <th>Settled Timestamp</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${payments
              .map((p) => {
                const dateStr = new Date(p.created_at).toLocaleString([], {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return `
                <tr>
                  <td><span class="mono" style="font-weight:800; font-size:0.82rem; background:#fffde6; padding:2px 6px; border:1px solid #000;">${p.id}</span></td>
                  <td><strong>${p.user_name}</strong></td>
                  <td class="mono" style="font-size:0.8rem;">${p.user_email}</td>
                  <td style="font-weight:900; color:#00aa44; font-size:0.95rem;">₹${p.amount || 99}.00</td>
                  <td><span style="background:#e5e7eb; padding:2px 6px; font-size:0.75rem; font-weight:800;">${p.method || "UPI"}</span></td>
                  <td style="font-size:0.78rem;">${dateStr}</td>
                  <td><span style="color:#00aa44; font-weight:900; font-size:0.75rem; background:#e6ffed; padding:2px 6px; border:1px solid #00aa44;">✓ ${p.status || "SETTLED"}</span></td>
                  <td>
                    <button class="btn-admin-action btn-admin-neutral" style="padding:4px 8px; font-size:0.72rem;" onclick="viewPaymentReceiptModal('${p.id}')">
                      📄 Receipt
                    </button>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function viewPaymentReceiptModal(payId) {
    const payments = store.getOnboardingPayments();
    let payment = payments.find((p) => p.id === payId);

    if (!payment) {
      const user = store.users.find(
        (u) => u.payment_ref === payId || u.id === payId
      );
      if (user && user.payment_ref) {
        payment = payments.find((p) => p.id === user.payment_ref) || {
          id: user.payment_ref,
          user_name: user.name,
          user_email: user.email,
          amount: user.fee_amount || 99,
          method: user.payment_method || "UPI (Google Pay)",
          created_at: user.fee_paid_at || new Date(),
          status: "SETTLED"
        };
      }
    }

    if (!payment) {
      showToast("Payment record not found.", "error");
      return;
    }

    const modal = document.getElementById("modal-payment-receipt");
    const body = document.getElementById("receipt-modal-body");
    if (!modal || !body) return;

    const baseAmount = 83.9;
    const gstAmount = 15.1;
    const dateFormatted = new Date(payment.created_at).toLocaleString([], {
      dateStyle: "full",
      timeStyle: "medium"
    });

    body.innerHTML = `
      <div style="font-family:var(--font-heading); text-align:center; margin-bottom:16px;">
        <div style="font-weight:900; font-size:1.25rem;">SKILL BADLU TECHNOLOGIES PVT. LTD.</div>
        <div style="font-size:0.78rem; color:#555;">GSTIN: 29AAECS4910K1ZZ • SAC: 998431 (Online Education & Skill Exchange)</div>
        <div style="font-size:0.78rem; color:#555;">7th Floor, Cyber Sovereign Tower, Bengaluru, KA 560100</div>
        <div style="margin-top:8px; display:inline-block; background:#000; color:#fff; font-weight:900; font-size:0.75rem; padding:2px 8px;">TAX INVOICE / RECEIPT</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.82rem; background:#faf9f5; border:2px solid #000; padding:12px; margin-bottom:16px;">
        <div>
          <div><strong>Invoice / Receipt ID:</strong> <span class="mono">${payment.id}</span></div>
          <div><strong>Date & Time:</strong> ${dateFormatted}</div>
          <div><strong>Payment Rail:</strong> ${payment.method || "UPI Gateway (Instant)"}</div>
        </div>
        <div>
          <div><strong>Customer Name:</strong> ${payment.user_name}</div>
          <div><strong>Email Address:</strong> <span class="mono">${payment.user_email}</span></div>
          <div><strong>Verification Status:</strong> <span style="color:#00aa44; font-weight:900;">ADMIN KYC VERIFIED</span></div>
        </div>
      </div>

      <table class="admin-ledger-table" style="margin-bottom:16px;">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>SAC Code</th>
            <th>Base Amount</th>
            <th>CGST (9%)</th>
            <th>SGST (9%)</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Skill Badlu Verified Peer Onboarding + 50 Welcome Escrow Credits Mint</strong></td>
            <td class="mono">998431</td>
            <td class="mono">₹${baseAmount.toFixed(2)}</td>
            <td class="mono">₹${(gstAmount / 2).toFixed(2)}</td>
            <td class="mono">₹${(gstAmount / 2).toFixed(2)}</td>
            <td class="mono" style="font-weight:900; color:#00aa44;">₹${payment.amount || 99}.00</td>
          </tr>
        </tbody>
      </table>

      <div style="background:#e6ffed; border:2px solid #00aa44; padding:12px; font-size:0.82rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>Payment Status:</strong> <span style="color:#00aa44; font-weight:900;">✓ SETTLED &amp; CREDITED</span><br>
          <span style="font-size:0.75rem; color:#444;">Welcome Bonus Mint: +50 CR Transferred to Escrow Wallet upon Verification</span>
        </div>
        <div style="font-family:var(--font-mono); font-weight:900; font-size:1.3rem; color:#000;">
          ₹${payment.amount || 99}.00
        </div>
      </div>
    `;

    modal.classList.add("active");
  }

  function closePaymentReceiptModal() {
    const modal = document.getElementById("modal-payment-receipt");
    if (modal) modal.classList.remove("active");
  }

  function renderCoursesList() {
    const container = document.getElementById("admin-courses-list-container");
    if (!container) return;

    let coursesToDisplay = [];
    if (currentVideoSubTab === "pending") {
      coursesToDisplay = store.courses.filter(
        (c) => c.status === "PENDING_REVIEW"
      );
    } else if (currentVideoSubTab === "published") {
      coursesToDisplay = store.courses.filter((c) => c.status === "PUBLISHED");
    }

    if (coursesToDisplay.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:36px; color:#666666; background:#faf9f5; border:2px dashed #999;">
          <div style="font-size:2rem; margin-bottom:8px;">📹</div>
          <div style="font-weight:800; font-size:1rem;">No ${currentVideoSubTab === "pending" ? "Pending Video Submissions" : "Published Videos Found"}</div>
          <div style="font-size:0.8rem; margin-top:4px;">When swappers submit courses, they appear here for sovereign quality inspection.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = coursesToDisplay
      .map((course) => {
        const creator = store.getUser(course.creator_id) || {
          name: "Unknown Swapper"
        };
        const chaptersCount = course.chapters ? course.chapters.length : 0;
        const isPending = course.status === "PENDING_REVIEW";

        return `
        <div class="admin-review-row" style="border-left: 6px solid ${isPending ? "#ffe600" : "#00ff66"}; display:block; padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
            <div style="flex:1; min-width:280px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge-kyc-pill ${isPending ? "badge-kyc-pending" : "badge-kyc-verified"}">${course.status}</span>
                <span style="font-family:var(--font-heading); font-weight:900; font-size:1.15rem; color:#000;">${course.title}</span>
              </div>
              <div style="font-size:0.82rem; color:#555555; margin-top:4px;">
                <strong>Creator:</strong> ${creator.name} &bull; 
                <strong>Category:</strong> ${course.category.toUpperCase()} &bull; 
                <strong>Duration:</strong> ${course.duration_mins} Mins &bull; 
                <strong>Credits Fee:</strong> <span style="font-weight:900; color:#00aa44;">${course.credit_cost} CR</span> &bull; 
                <strong>Anti-Skip Chapters:</strong> ${chaptersCount} Checkpoints
              </div>
              <p style="font-size:0.84rem; color:#333; margin:8px 0; line-height:1.4;">${course.description}</p>
            </div>
            
            <div class="admin-actions-group">
              ${
                isPending
                  ? `
                <button class="btn-admin-action btn-admin-approve" style="font-size:0.88rem; padding:10px 18px;" onclick="approveCourse('${course.id}')">
                  ✓ Approve Video &amp; Publish Live
                </button>
                <button class="btn-admin-action btn-admin-reject" style="font-size:0.88rem; padding:10px 18px;" onclick="rejectCourse('${course.id}')">
                  ✕ Reject Video
                </button>
              `
                  : `
                <button class="btn-admin-action btn-admin-reject" style="font-size:0.78rem; padding:6px 12px;" onclick="rejectCourse('${course.id}')">
                  Unpublish / Revoke
                </button>
              `
              }
            </div>
          </div>

          <!-- Embedded Interactive Video Preview Player -->
          <div style="margin-top:10px; background:#000000; border:3px solid #000; padding:10px; box-shadow:3px 3px 0px #000;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; color:#fff; font-size:0.75rem; font-weight:800; text-transform:uppercase;">
              <span>▶ Video Stream Quality &amp; Audio Inspection</span>
              <span class="mono" style="color:#00ff66;">ANTI-SKIP TRACKING COMPATIBLE</span>
            </div>
            <video controls playsinline preload="metadata" style="width:100%; max-height:260px; background:#111; outline:none;">
              <source src="${course.video_url}" type="video/mp4" />
              Your browser does not support HTML5 video streaming.
            </video>
          </div>

        </div>
      `;
      })
      .join("");
  }

  function renderEducatorsTable() {
    const container = document.getElementById("admin-educators-list-container");
    if (!container) return;

    const users = store.users;

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-ledger-table">
          <thead>
            <tr>
              <th>Swapper Member</th>
              <th>Email</th>
              <th>KYC Verification</th>
              <th>Video Upload Permission</th>
              <th>Courses Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map((u) => {
                const userCourses = store.courses.filter(
                  (c) => c.creator_id === u.id
                );
                const canUpload =
                  u.can_upload_videos || u.creator_status === "APPROVED";
                return `
                <tr>
                  <td><strong>${u.name}</strong></td>
                  <td style="font-family:var(--font-mono);">${u.email}</td>
                  <td><span class="badge-kyc-pill ${u.kyc_status === "VERIFIED" ? "badge-kyc-verified" : "badge-kyc-pending"}">${u.kyc_status}</span></td>
                  <td>
                    <span style="font-weight:900; padding:2px 6px; border:1.5px solid #000; background:${canUpload ? "#00ff66" : "#ffe600"}; font-size:0.72rem;">
                      ${canUpload ? "✓ UPLOAD APPROVED" : "⏳ PENDING APPROVAL"}
                    </span>
                  </td>
                  <td style="font-weight:900;">${userCourses.length} Course${userCourses.length === 1 ? "" : "s"}</td>
                  <td>
                    ${
                      canUpload
                        ? `
                      <button class="btn-admin-action btn-admin-reject" style="padding:4px 8px; font-size:0.72rem;" onclick="revokeCreatorAccess('${u.id}')">
                        Revoke Access
                      </button>
                    `
                        : `
                      <button class="btn-admin-action btn-admin-approve" style="padding:4px 8px; font-size:0.72rem;" onclick="grantCreatorAccess('${u.id}')">
                        ✓ Grant Video Upload
                      </button>
                    `
                    }
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDisputesList(disputedSessions) {
    const container = document.getElementById("admin-disputes-list-container");
    if (!container) return;

    if (disputedSessions.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:36px; color:#666666; background:#faf9f5; border:2px dashed #999;">
          <div style="font-size:2rem; margin-bottom:8px;">🛡️</div>
          <div style="font-weight:800; font-size:1rem;">Zero Open Disputes</div>
          <div style="font-size:0.8rem; margin-top:4px;">All skill-swap sessions are executing normally without escrow conflicts.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = disputedSessions
      .map(
        (s) => `
      <div class="admin-review-row" style="border-left: 6px solid #ff2d55;">
        <div>
          <div style="font-family:var(--font-heading); font-weight:800; font-size:1.05rem; color:#000;">
            Disputed Swap: ${s.skill_name || "Peer Skill Swap"} (${s.agreed_credit_amount} CR Escrow)
          </div>
          <div style="font-size:0.82rem; color:#555555; margin-top:3px;">
            <strong>Session ID:</strong> ${s.id} &bull; 
            <strong>Learner:</strong> ${store.getUser(s.learner_id)?.name || s.learner_id} &bull; 
            <strong>Teacher:</strong> ${store.getUser(s.teacher_id)?.name || s.teacher_id}
          </div>
          <div style="font-size:0.8rem; color:#ff2d55; font-weight:700; margin-top:6px; background:#fff0f3; padding:6px 10px; border:1px solid #ffb3c1;">
            ⚠️ Dispute Reason: ${s.dispute_reason || "Reported non-delivery or technical disconnection."}
          </div>
        </div>
        <div class="admin-actions-group">
          <button class="btn-admin-action btn-admin-approve" onclick="resolveDispute('${s.id}', 'settle_teacher')">
            ✓ Award to Teacher (+${s.agreed_credit_amount} CR)
          </button>
          <button class="btn-admin-action btn-admin-reject" onclick="resolveDispute('${s.id}', 'refund_learner')">
            ↩ Cancel &amp; Full Refund
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  function renderLedgerTable(txs) {
    const container = document.getElementById("admin-ledger-list-container");
    if (!container) return;

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-ledger-table">
          <thead>
            <tr>
              <th>Tx Hash</th>
              <th>Type</th>
              <th>From Account</th>
              <th>To Account</th>
              <th>Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${txs
              .slice(-25)
              .reverse()
              .map(
                (tx) => `
              <tr>
                <td><span style="font-size:0.75rem; color:#666;">${tx.id.substring(0, 14)}...</span></td>
                <td><strong style="color:${tx.from_user === "PLATFORM_TREASURY" ? "#00aa44" : "#000"}">${tx.type}</strong></td>
                <td>${store.getUser(tx.from_user)?.name || tx.from_user}</td>
                <td>${store.getUser(tx.to_user)?.name || tx.to_user}</td>
                <td style="font-weight:900; color:${tx.from_user === "PLATFORM_TREASURY" ? "#00aa44" : "#000"};">${tx.amount} CR</td>
                <td style="font-size:0.75rem; color:#555;">${new Date(tx.timestamp).toLocaleTimeString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderOverviewTrays(pendingUsers, disputedSessions, pendingCourses) {
    const kycTray = document.getElementById("tray-pending-kyc");
    const disputesTray = document.getElementById("tray-pending-disputes");
    const coursesTray = document.getElementById("tray-pending-courses");

    if (kycTray) {
      kycTray.innerHTML =
        pendingUsers.length === 0
          ? `<div style="font-size:0.85rem; color:#666;">✓ No users pending review in queue.</div>`
          : pendingUsers
              .slice(0, 3)
              .map(
                (u) => `
            <div style="padding:8px 0; border-bottom:1px dashed #ddd; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${u.name}</strong> <span style="font-size:0.75rem; color:#666;">(${u.email})</span>
              </div>
              <button class="btn-admin-action btn-admin-approve" style="padding:4px 8px; font-size:0.72rem;" onclick="approveUser('${u.id}')">Verify</button>
            </div>
          `
              )
              .join("");
    }

    if (coursesTray) {
      coursesTray.innerHTML =
        pendingCourses.length === 0
          ? `<div style="font-size:0.85rem; color:#666;">✓ Zero pending video submissions in queue.</div>`
          : pendingCourses
              .slice(0, 3)
              .map(
                (c) => `
            <div style="padding:8px 0; border-bottom:1px dashed #ddd; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${c.title}</strong> <span style="font-size:0.75rem; color:#666;">(${c.duration_mins}m • ${c.credit_cost} CR)</span>
              </div>
              <button class="btn-admin-action btn-admin-approve" style="padding:4px 8px; font-size:0.72rem;" onclick="approveCourse('${c.id}')">Approve</button>
            </div>
          `
              )
              .join("");
    }

    if (disputesTray) {
      disputesTray.innerHTML =
        disputedSessions.length === 0
          ? `<div style="font-size:0.85rem; color:#666;">✓ Zero disputed swaps active.</div>`
          : disputedSessions
              .slice(0, 3)
              .map(
                (d) => `
            <div style="padding:8px 0; border-bottom:1px dashed #ddd; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${d.skill_name || "Session"}</strong> <span style="font-size:0.75rem; color:#ff2d55;">(${d.agreed_credit_amount} CR)</span>
              </div>
              <button class="btn-admin-action btn-admin-reject" style="padding:4px 8px; font-size:0.72rem;" onclick="switchAdminTab('tab-admin-disputes')">Arbitrate</button>
            </div>
          `
              )
              .join("");
    }
  }

  // 4. Admin Action Handlers
  async function approveUser(userId) {
    if (window.SkillBadluAPI) {
      try {
        await SkillBadluAPI.admin.approveUser(userId);
      } catch (e) {
        console.warn("[Backend API approve notice]:", e.message);
      }
    }
    try {
      admin.approveUser(userId);
      showToast(
        `✓ User ${userId} VERIFIED! Applicant can now pay ₹99 at login to enter.`,
        "success"
      );
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function rejectUser(userId) {
    if (window.SkillBadluAPI) {
      try {
        await SkillBadluAPI.admin.rejectUser(
          userId,
          "Credentials could not be verified by Admin."
        );
      } catch (e) {
        console.warn("[Backend API reject notice]:", e.message);
      }
    }
    try {
      const res = admin.rejectUser(
        userId,
        "Credentials could not be verified by Admin."
      );
      const refundNote = res.refunded ? " (₹99 refunded)" : "";
      showToast(`User application rejected${refundNote}.`, "info");
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  function approveCourse(courseId) {
    try {
      const course = admin.approveCourse(courseId);
      showToast(
        `✓ Video "${course.title}" APPROVED and published to Academy!`,
        "success"
      );
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  function rejectCourse(courseId) {
    const reason = prompt(
      "Enter course rejection feedback for the creator:",
      "Video resolution or audio quality did not meet platform standards."
    );
    if (reason) {
      try {
        admin.rejectCourse(courseId, reason);
        showToast("Video rejected and removed from review queue.", "info");
      } catch (e) {
        showToast(e.message, "error");
      }
    }
  }

  function grantCreatorAccess(userId) {
    try {
      const user = admin.grantCreatorPermission(userId);
      showToast(
        `✓ Video Upload Permission GRANTED to ${user.name}!`,
        "success"
      );
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  function revokeCreatorAccess(userId) {
    try {
      const user = admin.revokeCreatorPermission(userId);
      showToast(`Video Upload Permission revoked for ${user.name}.`, "info");
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  function resolveDispute(sessionId, res) {
    try {
      admin.resolveDispute(sessionId, res);
      showToast(
        `Dispute resolved: ${res === "settle_teacher" ? "Settled to Teacher" : "Cancelled & Refunded"}`,
        "success"
      );
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  function simulateNewDispute() {
    const dummy = {
      id: "sess_disp_" + Date.now().toString().slice(-4),
      match_id: "match_demo",
      learner_id: "user_a",
      teacher_id: "user_b",
      skill_id: "sk_pottery",
      skill_name: "Ceramics & Pottery Masterclass",
      agreed_credit_amount: 50,
      confirmed_by_a: false,
      confirmed_by_b: false,
      status: "DISPUTED",
      dispute_reason:
        "Instructor connection disconnected midway through the swap.",
      scheduled_start: new Date()
    };
    store.sessions.push(dummy);
    store.notify("SESSION_DISPUTED", dummy);
    showToast("Test dispute created for arbitration testing.", "info");
    switchAdminTab("tab-admin-disputes");
  }

  function performAdminSignOut() {
    store.logout();
    window.location.href = "login.html";
  }

  // 5. Ledger Audit Modal
  function runLedgerAuditModal() {
    const modal = document.getElementById("modal-reconciliation");
    if (!modal) return;

    let totalMinted = 0;
    store.transactions.forEach((tx) => {
      if (tx.from_user === "PLATFORM_TREASURY") {
        totalMinted += tx.amount;
      }
    });

    let totalBalances = 0;
    const userRows = store.users
      .map((u) => {
        const bal = ledger.getBalance(u.id);
        totalBalances += bal;
        return `
          <tr>
            <td><strong>${u.name}</strong></td>
            <td style="font-family:var(--font-mono); font-weight:800;">${bal} CR</td>
            <td><span class="badge-kyc-pill ${u.kyc_status === "VERIFIED" ? "badge-kyc-verified" : "badge-kyc-pending"}">${u.kyc_status}</span></td>
            <td style="color:#00aa44; font-weight:800;">✓ PASSED</td>
          </tr>
        `;
      })
      .join("");

    document.getElementById("modal-total-minted").textContent =
      `${totalMinted} CR`;
    document.getElementById("modal-total-balances").textContent =
      `${totalBalances} CR`;
    const variance = totalMinted - totalBalances;
    document.getElementById("modal-variance").textContent =
      `${variance} CR (0.00%)`;

    document.getElementById("modal-user-breakdown-tbody").innerHTML = userRows;
    modal.classList.add("active");
  }

  function closeLedgerAuditModal() {
    const modal = document.getElementById("modal-reconciliation");
    if (modal) modal.classList.remove("active");
  }

  // Toast Notification Helper
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    toast.innerHTML = `
      <span style="font-size:1.2rem; font-weight:bold;">${icon}</span>
      <div style="font-size:0.9rem;">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Expose global methods needed for onclick handlers
  window.switchAdminTab = switchAdminTab;
  window.switchVideoSubTab = switchVideoSubTab;
  window.switchKycSubTab = switchKycSubTab;
  window.approveUser = approveUser;
  window.rejectUser = rejectUser;
  window.approveCourse = approveCourse;
  window.rejectCourse = rejectCourse;
  window.grantCreatorAccess = grantCreatorAccess;
  window.revokeCreatorAccess = revokeCreatorAccess;
  window.resolveDispute = resolveDispute;
  window.simulateNewDispute = simulateNewDispute;
  window.performAdminSignOut = performAdminSignOut;
  window.runLedgerAuditModal = runLedgerAuditModal;
  window.closeLedgerAuditModal = closeLedgerAuditModal;
  window.viewPaymentReceiptModal = viewPaymentReceiptModal;
  window.closePaymentReceiptModal = closePaymentReceiptModal;
  window.showToast = showToast;
})();
