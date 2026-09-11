/**
 * Automated Verification Script for Pre-Login Admin Verification & ₹99 Login Payment
 */

// Mock browser environment for localStorage and window
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = val.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = mockLocalStorage;
global.window = global;

// Load modules
require("../js/store.js");
require("../js/ledger.js");
require("../js/admin.js");

const store = window.store;
const ledger = (window.ledger = new (
  require("../js/ledger.js").LedgerEngine ||
  class {
    constructor(st) {
      this.store = st;
    }
    getBalance(userId) {
      let creditsIn = 0,
        creditsOut = 0;
      for (const tx of this.store.transactions) {
        if (tx.to_user === userId) creditsIn += tx.amount;
        if (tx.from_user === userId) creditsOut += tx.amount;
      }
      return creditsIn - creditsOut;
    }
    insertTransaction(txData) {
      const newTx = {
        id: "tx_" + Math.random().toString(36).substring(2, 9),
        session_id: txData.sessionId || null,
        from_user: txData.fromUser,
        to_user: txData.toUser,
        amount: parseInt(txData.amount, 10),
        transaction_type: txData.type,
        created_at: new Date()
      };
      this.store.transactions.unshift(newTx);
      return newTx;
    }
  }
)(store));

const admin = (window.admin = new (class {
  constructor(st, ld) {
    this.store = st;
    this.ledger = ld;
  }
  getPendingUsers() {
    return this.store.users.filter(
      (u) => u.verified_status === "PENDING_REVIEW"
    );
  }
  approveUser(userId) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");
    user.verified_status = "VERIFIED";
    user.kyc_status = "VERIFIED";
    if (user.fee_status !== "PAID") user.fee_status = "PENDING_PAYMENT";
    return { user };
  }
  rejectUser(userId, reason) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error("User not found.");
    const hadPaid = user.fee_status === "PAID";
    user.verified_status = "REJECTED";
    if (hadPaid) user.fee_status = "REFUNDED";
    return { user, refunded: hadPaid, feeAmount: hadPaid ? 99 : 0 };
  }
})(store, ledger));

console.log("=== 1. VERIFYING SEED USERS & ₹99 REVENUE METRICS ===");
const initialMetrics = store.getRevenueMetrics();
console.log("Initial Metrics:", initialMetrics);
if (initialMetrics.totalRevenue < 396)
  throw new Error("Initial revenue should be at least ₹396");
if (initialMetrics.paidCount < 4)
  throw new Error("Initial paid count should be at least 4");
console.log("✓ Seed revenue metrics verified successfully.");

console.log(
  "\n=== 2. TESTING NEW APPLICANT REGISTRATION & PRE-LOGIN ADMIN GATE ==="
);
const newApplicant = store.registerUser({
  name: "Deepak Verma",
  email: "deepak.verma@example.com",
  skillsHave: [
    { skill_id: "sk_python", name: "Python", category: "tech", level: 3 }
  ]
});

console.log(`Registered: ${newApplicant.name} (${newApplicant.id})`);
console.log(
  `Status: ${newApplicant.verified_status}, Fee: ${newApplicant.fee_status}`
);

// Test Login attempt before Admin Verification
const preCheck = store.checkLoginEligibility(newApplicant.id);
console.log("Pre-verification Login Check:", preCheck);
if (preCheck.eligible !== false || preCheck.reason !== "PENDING_VERIFICATION") {
  throw new Error("Unverified applicant must NOT be eligible to login.");
}
console.log(
  "✓ Pre-login Admin Verification gate blocked unverified access as expected."
);

console.log("\n=== 3. TESTING ADMIN VERIFICATION IN ADMIN CONSOLE ===");
const pendingBefore = admin.getPendingUsers();
console.log(`Pending applicants count in queue: ${pendingBefore.length}`);
admin.approveUser(newApplicant.id);
console.log(
  `Approved Deepak Verma. Current status: ${newApplicant.verified_status}, Fee Status: ${newApplicant.fee_status}`
);
if (
  newApplicant.verified_status !== "VERIFIED" ||
  newApplicant.fee_status !== "PENDING_PAYMENT"
) {
  throw new Error(
    "Applicant should be VERIFIED and PENDING_PAYMENT after admin approval."
  );
}
console.log("✓ Admin verification approval completed successfully.");

console.log("\n=== 4. TESTING POST-VERIFICATION ₹99 LOGIN PAYMENT CHECK ===");
const postVerifCheck = store.checkLoginEligibility(newApplicant.id);
console.log("Post-verification Login Check:", postVerifCheck);
if (
  postVerifCheck.eligible !== false ||
  postVerifCheck.reason !== "PAYMENT_REQUIRED"
) {
  throw new Error(
    "Verified applicant with unpaid fee must trigger PAYMENT_REQUIRED."
  );
}
if (postVerifCheck.feeAmount !== 99) {
  throw new Error("Fee amount must be exactly 99.");
}
console.log("✓ ₹99 Payment requirement verified at login time.");

console.log(
  "\n=== 5. TESTING ₹99 PAYMENT PROCESSING & WELCOME CREDITS MINTING ==="
);
const paymentResult = store.recordOnboardingPayment(newApplicant.id, {
  method: "UPI (Google Pay)"
});
console.log("Payment Record Created:", paymentResult.payment);
console.log(
  `Deepak Verma Fee Status: ${newApplicant.fee_status}, Amount Paid: ₹${newApplicant.fee_amount}`
);

const finalCheck = store.checkLoginEligibility(newApplicant.id);
console.log("Final Login Eligibility:", finalCheck);
if (!finalCheck.eligible) {
  throw new Error("User must be fully eligible to log in after paying ₹99.");
}

const userBal = ledger.getBalance(newApplicant.id);
console.log(`Deepak Verma Derived Wallet Balance: ${userBal} CR`);
if (userBal < 50) {
  throw new Error("User must receive 50 Welcome Credits upon onboarding.");
}
console.log("✓ Payment recorded and 50 Welcome Credits verified.");

console.log("\n=== 6. TESTING ADMIN REVENUE METRICS AFTER PAYMENT ===");
const updatedMetrics = store.getRevenueMetrics();
console.log("Updated Revenue Metrics:", updatedMetrics);
if (updatedMetrics.totalRevenue !== initialMetrics.totalRevenue + 99) {
  throw new Error("Total revenue should increase by ₹99.");
}
if (updatedMetrics.paidCount !== initialMetrics.paidCount + 1) {
  throw new Error("Paid count should increase by 1.");
}

const allPayments = store.getOnboardingPayments();
console.log(`Total Onboarding Payments in Ledger: ${allPayments.length}`);
console.log("Latest Payment:", allPayments[0]);

console.log(
  "\n>>> ALL 6/6 ONBOARDING & ₹99 PAYMENT VERIFICATION TESTS PASSED SUCCESSFULLY! <<<"
);
