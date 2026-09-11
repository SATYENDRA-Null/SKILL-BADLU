/**
 * SKILL BADLU - End-to-End Backend API Test Suite
 * Tests Auth, Pre-Login Admin Gate, Rs 99 Payment Gateway, Credits Minting, and Invoicing.
 */

const http = require("http");
const app = require("../server/server");
const db = require("../server/data/db");

let server;
const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// HTTP helper for tests
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            const data = raw ? JSON.parse(raw) : {};
            resolve({ status: res.statusCode, headers: res.headers, data });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw });
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Test Runner
async function runTests() {
  console.log(
    "=================================================================="
  );
  console.log("  ⚡ RUNNING SKILL BADLU BACKEND & PAYMENT GATEWAY TEST SUITE");
  console.log(
    "==================================================================\n"
  );

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✕ [FAIL] ${testName} ${details ? "- " + details : ""}`);
      failed++;
    }
  }

  try {
    // 1. Reset DB for pristine test run
    db.reset();

    // 2. Start Test Server
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`[Test Server running on port ${TEST_PORT}]`);
        resolve();
      });
    });

    // -------------------------------------------------------------
    // Test 1: Health Check
    // -------------------------------------------------------------
    const healthRes = await makeRequest("GET", "/api/health");
    assert(
      healthRes.status === 200,
      "Health Check Endpoint (200 OK)",
      `Got status ${healthRes.status}`
    );
    assert(healthRes.data.status === "ONLINE", "Health status is ONLINE");
    assert(
      healthRes.data.service === "SKILL_BADLU_BACKEND",
      "Service identifier matches"
    );

    // -------------------------------------------------------------
    // Test 2: Admin Login Bypass
    // -------------------------------------------------------------
    const adminLoginRes = await makeRequest("POST", "/api/auth/login", {
      email: "admin@skillbadlu.com",
      password: "password123"
    });
    assert(
      adminLoginRes.status === 200,
      "Admin Login succeeds (200 OK)",
      `Got status ${adminLoginRes.status}`
    );
    assert(
      adminLoginRes.data.token && adminLoginRes.data.user.role === "admin",
      "Admin receives valid JWT token and admin role"
    );
    const adminToken = adminLoginRes.data.token;

    // -------------------------------------------------------------
    // Test 3: User Registration (Defaults to PENDING_VERIFICATION & UNPAID)
    // -------------------------------------------------------------
    const testUserEmail = `kunal.test.${Date.now()}@example.com`;
    const regRes = await makeRequest("POST", "/api/auth/register", {
      name: "Kunal Verma",
      email: testUserEmail,
      password: "password123",
      skillsHave: [{ name: "Python", category: "tech", level: 4 }]
    });

    assert(
      regRes.status === 201,
      "User Registration (201 Created)",
      `Got status ${regRes.status}`
    );
    assert(
      regRes.data.status === "PENDING_VERIFICATION",
      "Registered user status is PENDING_VERIFICATION"
    );
    assert(
      regRes.data.user.fee_status === "UNPAID",
      "Registered user fee_status is UNPAID"
    );
    const testUserId = regRes.data.user.id;

    // -------------------------------------------------------------
    // Test 4: Pre-Login Admin Gate - Block Login Before Admin Verification (403)
    // -------------------------------------------------------------
    const unapprovedLoginRes = await makeRequest("POST", "/api/auth/login", {
      email: testUserEmail,
      password: "password123"
    });

    assert(
      unapprovedLoginRes.status === 403,
      "Login Blocked Before Admin Approval (403 Forbidden)",
      `Got ${unapprovedLoginRes.status}`
    );
    assert(
      unapprovedLoginRes.data.error === "ADMIN_VERIFICATION_PENDING",
      "Error code is ADMIN_VERIFICATION_PENDING"
    );

    // Check Eligibility Endpoint
    const eligRes1 = await makeRequest(
      "GET",
      `/api/auth/eligibility/${encodeURIComponent(testUserEmail)}`
    );
    assert(
      eligRes1.data.eligible === false &&
        eligRes1.data.reason === "PENDING_VERIFICATION",
      "Eligibility API reports PENDING_VERIFICATION"
    );

    // -------------------------------------------------------------
    // Test 5: Admin Approves Applicant
    // -------------------------------------------------------------
    const approveRes = await makeRequest(
      "POST",
      `/api/admin/approve-user/${testUserId}`,
      null,
      adminToken
    );
    assert(
      approveRes.status === 200,
      "Admin approves applicant (200 OK)",
      `Got ${approveRes.status}`
    );
    assert(
      approveRes.data.user.verification_status === "APPROVED",
      "User verification_status updated to APPROVED"
    );
    assert(
      approveRes.data.user.fee_status === "PENDING_PAYMENT",
      "User fee_status updated to PENDING_PAYMENT"
    );

    // -------------------------------------------------------------
    // Test 6: Gate 2 - Block Direct Login When ₹99 Payment Pending (402)
    // -------------------------------------------------------------
    const unpaidLoginRes = await makeRequest("POST", "/api/auth/login", {
      email: testUserEmail,
      password: "password123"
    });

    assert(
      unpaidLoginRes.status === 402,
      "Login Blocked Before ₹99 Payment (402 Payment Required)",
      `Got ${unpaidLoginRes.status}`
    );
    assert(
      unpaidLoginRes.data.error === "PAYMENT_REQUIRED",
      "Error code is PAYMENT_REQUIRED"
    );
    assert(unpaidLoginRes.data.feeAmount === 99, "Fee amount is ₹99");

    const eligRes2 = await makeRequest(
      "GET",
      `/api/auth/eligibility/${encodeURIComponent(testUserEmail)}`
    );
    assert(
      eligRes2.data.eligible === false &&
        eligRes2.data.reason === "PAYMENT_REQUIRED",
      "Eligibility API reports PAYMENT_REQUIRED with feeAmount=99"
    );

    // -------------------------------------------------------------
    // Test 7: Payment Gateway - Create ₹99 Order
    // -------------------------------------------------------------
    const orderRes = await makeRequest("POST", "/api/payments/create-order", {
      userId: testUserId,
      amount: 99
    });

    assert(
      orderRes.status === 201,
      "Payment Gateway Order Created (201 Created)",
      `Got ${orderRes.status}`
    );
    assert(
      orderRes.data.orderId && orderRes.data.orderId.startsWith("ORDER_SB_99"),
      "Order ID has correct prefix"
    );
    assert(
      orderRes.data.amount === 99 &&
        orderRes.data.baseAmount === 83.9 &&
        orderRes.data.gstAmount === 15.1,
      "Tax calculation ₹83.90 + ₹15.10 GST (18%) = ₹99.00"
    );
    const orderId = orderRes.data.orderId;

    // -------------------------------------------------------------
    // Test 8: Payment Gateway - Verify Payment & Mint 50 Welcome Credits
    // -------------------------------------------------------------
    const payRes = await makeRequest("POST", "/api/payments/verify-and-pay", {
      orderId: orderId,
      userId: testUserId,
      method: "UPI (Google Pay)",
      gatewayRef: "UPI_SB_TEST_991823"
    });

    assert(
      payRes.status === 200,
      "₹99 Payment Verified Successfully (200 OK)",
      `Got ${payRes.status}`
    );
    assert(
      payRes.data.payment.amount === 99,
      "Payment amount recorded as ₹99.00"
    );
    assert(
      payRes.data.payment.credits_granted === 50,
      "50 Welcome Credits granted in payment receipt"
    );
    assert(
      payRes.data.user.credits === 50,
      "User credit balance updated to 50 CR"
    );
    assert(
      payRes.data.user.fee_status === "PAID",
      "User fee_status updated to PAID"
    );
    assert(
      payRes.data.token,
      "JWT session token returned upon payment for immediate login"
    );
    const paymentId = payRes.data.payment.id;
    const userSessionToken = payRes.data.token;

    // -------------------------------------------------------------
    // Test 9: Login Succeeded Post-Payment
    // -------------------------------------------------------------
    const postPayLoginRes = await makeRequest("POST", "/api/auth/login", {
      email: testUserEmail,
      password: "password123"
    });

    assert(
      postPayLoginRes.status === 200,
      "User Logged In Successfully After ₹99 Payment (200 OK)",
      `Got ${postPayLoginRes.status}`
    );
    assert(
      postPayLoginRes.data.user.status === "ACTIVE",
      "User status is ACTIVE"
    );
    assert(
      postPayLoginRes.data.user.credits === 50,
      "User credit balance is 50 CR"
    );

    // Profile me check with JWT token
    const meRes = await makeRequest(
      "GET",
      "/api/auth/me",
      null,
      userSessionToken
    );
    assert(
      meRes.status === 200,
      "Authenticated Profile Endpoint GET /api/auth/me (200 OK)",
      `Got ${meRes.status}`
    );
    assert(
      meRes.data.user.email === testUserEmail,
      "Profile data matches authenticated user"
    );

    // -------------------------------------------------------------
    // Test 10: Official Tax Invoice / Receipt Endpoint
    // -------------------------------------------------------------
    const receiptRes = await makeRequest(
      "GET",
      `/api/payments/receipt/${encodeURIComponent(paymentId)}`
    );
    assert(
      receiptRes.status === 200,
      "Itemized Tax Invoice Receipt Generated (200 OK)",
      `Got ${receiptRes.status}`
    );
    assert(
      receiptRes.data.receipt.summary.grandTotal === 99.0,
      "Invoice grand total is ₹99.00"
    );
    assert(
      receiptRes.data.receipt.items[0].sac === "998431",
      "SAC code 998431 verified on invoice"
    );
    assert(
      receiptRes.data.receipt.summary.totalGst === 15.1,
      "GST 18% breakdown present on invoice"
    );

    // -------------------------------------------------------------
    // Test 11: Admin Revenue Metrics & Ledger Audit
    // -------------------------------------------------------------
    const revRes = await makeRequest(
      "GET",
      "/api/admin/revenue-metrics",
      null,
      adminToken
    );
    assert(
      revRes.status === 200,
      "Admin Revenue Metrics (200 OK)",
      `Got ${revRes.status}`
    );
    assert(
      revRes.data.metrics.totalRevenue >= 396,
      "Total revenue includes all ₹99 payments"
    );
    assert(
      revRes.data.metrics.feePerUser === 99,
      "Fee per user configured as ₹99"
    );

    const ledgerRes = await makeRequest(
      "GET",
      "/api/admin/ledger",
      null,
      adminToken
    );
    assert(
      ledgerRes.status === 200,
      "Admin Ledger Audit (200 OK)",
      `Got ${ledgerRes.status}`
    );
    const hasMint = ledgerRes.data.ledger.some(
      (tx) => tx.type === "ONBOARDING_WELCOME_GRANT" && tx.to_id === testUserId
    );
    assert(
      hasMint,
      "Ledger contains immutable ONBOARDING_WELCOME_GRANT record (+50 CR)"
    );
  } catch (err) {
    console.error("Test runner encountered error:", err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }

    console.log(
      "\n=================================================================="
    );
    console.log(
      `  TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`
    );
    console.log(
      "==================================================================\n"
    );

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
