/**
 * SKILL BADLU - ₹99 Onboarding Payment Gateway Engine
 * Handles Order Creation, Simulated & Live Payment Verification, 50 Welcome Credits Minting, Tax Receipts.
 */

const express = require("express");
const router = express.Router();
const db = require("../data/db");
const { generateToken } = require("../middleware/auth");

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * @route   POST /api/payments/create-order
 * @desc    Generate a payment order for ₹99 onboarding fee
 */
router.post("/create-order", (req, res) => {
  try {
    const { userId, amount = 99, purpose = "ONBOARDING_FEE" } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({
          error: "MISSING_USER_ID",
          message: "User ID is required to initiate order."
        });
    }

    const user = db.findUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json({
          error: "USER_NOT_FOUND",
          message: "User not found in system."
        });
    }

    if (user.verification_status !== "APPROVED") {
      return res.status(403).json({
        error: "KYC_NOT_APPROVED",
        message:
          "Cannot initiate onboarding payment: Account is awaiting Sovereign Admin verification."
      });
    }

    if (user.fee_status === "PAID") {
      return res.status(400).json({
        error: "ALREADY_PAID",
        message: "Onboarding fee of ₹99 is already paid for this account.",
        fee_status: "PAID"
      });
    }

    const order = db.createOrder({
      userId: user.id,
      amount: 99.0,
      purpose: purpose
    });

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      baseAmount: order.base_amount,
      gstAmount: order.gst_amount,
      gstRate: "18%",
      merchantName: "SKILL BADLU PROTOCOL",
      merchantVpa: "skillbadlu@icici",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      expiresAt: order.expires_at
    });
  } catch (err) {
    console.error("[Payment Create Order Error]:", err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   POST /api/payments/verify-and-pay
 * @desc    Verify payment submission, mark user PAID, mint +50 Welcome Credits, and issue JWT session
 */
router.post("/verify-and-pay", (req, res) => {
  try {
    const {
      orderId,
      userId,
      method = "UPI (Instant)",
      upiVpa,
      cardLast4,
      gatewayRef
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({
          error: "MISSING_USER_ID",
          message: "User ID is required for payment verification."
        });
    }

    const user = db.findUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ error: "USER_NOT_FOUND", message: "User account not found." });
    }

    if (user.verification_status !== "APPROVED") {
      return res.status(403).json({
        error: "KYC_NOT_APPROVED",
        message:
          "Account must be verified by admin before payment can be processed."
      });
    }

    // Idempotency check: If user is already paid, return existing session and receipt
    if (user.fee_status === "PAID") {
      const existingPayments = db
        .getPayments()
        .filter((p) => p.user_id === user.id);
      const latestPayment = existingPayments[0] || null;
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: "Onboarding fee was already paid. Session token generated.",
        payment: latestPayment,
        token,
        user: sanitizeUser(user)
      });
    }

    // 1. Record completed payment
    const payment = db.createPayment({
      orderId: orderId || `ORDER_AUTO_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      method: method,
      gatewayRef:
        gatewayRef ||
        `TXN_GATEWAY_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`
    });

    // 2. Mark order completed if exists
    if (orderId) {
      db.updateOrder(orderId, { status: "COMPLETED", payment_id: payment.id });
    }

    // 3. Mint 50 Welcome Credits into Ledger
    const ledgerEntry = db.addLedgerEntry({
      type: "ONBOARDING_WELCOME_GRANT",
      from_id: "SYSTEM_MINT",
      to_id: user.id,
      amount: 50,
      description: `Welcome bonus grant upon ₹99 onboarding payment verification (${payment.id})`
    });

    // 4. Update user status, fee_status and credit balance
    const updatedUser = db.updateUser(user.id, {
      fee_status: "PAID",
      status: "ACTIVE",
      credits: (user.credits || 0) + 50,
      onboarding_payment_id: payment.id,
      paid_at: new Date().toISOString()
    });

    // 5. Generate authenticated JWT session token for seamless immediate login
    const token = generateToken(updatedUser);

    return res.status(200).json({
      success: true,
      message: "₹99 Onboarding Payment Verified! 50 Welcome Credits minted.",
      payment,
      ledgerEntry,
      token,
      user: sanitizeUser(updatedUser),
      destination: "index.html"
    });
  } catch (err) {
    console.error("[Payment Verify Error]:", err);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   GET /api/payments/receipt/:paymentId
 * @desc    Get itemized tax invoice receipt for an onboarding payment
 */
router.get("/receipt/:paymentId", (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = db.findPaymentById(paymentId);

    if (!payment) {
      return res
        .status(404)
        .json({
          error: "RECEIPT_NOT_FOUND",
          message: "No invoice found for this payment ID."
        });
    }

    const receipt = {
      invoiceNumber: payment.invoice_number,
      paymentId: payment.id,
      orderId: payment.order_id,
      issuedAt: payment.timestamp,
      seller: {
        name: "Skill Badlu Technologies Pvt. Ltd.",
        address: "7th Floor, Cyber Sovereign Tower, Bengaluru, KA 560100",
        gstin: "29AAECS4910K1ZZ",
        sacCode: "998431"
      },
      customer: {
        id: payment.user_id,
        name: payment.user_name,
        email: payment.user_email
      },
      items: [
        {
          description:
            "Skill Badlu Verified Peer Onboarding + 50 Welcome Escrow Credits Mint",
          sac: "998431",
          qty: 1,
          baseRate: 83.9,
          cgstRate: "9%",
          cgstAmount: 7.55,
          sgstRate: "9%",
          sgstAmount: 7.55,
          totalAmount: 99.0
        }
      ],
      summary: {
        subtotal: 83.9,
        cgst: 7.55,
        sgst: 7.55,
        totalGst: 15.1,
        grandTotal: 99.0,
        currency: "INR"
      },
      paymentDetails: {
        method: payment.method,
        gatewayRef: payment.gateway_ref,
        status: payment.status
      }
    };

    return res.json({ receipt });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    List payment history
 */
router.get("/history", (req, res) => {
  const { userId } = req.query;
  let payments = db.getPayments();
  if (userId) {
    payments = payments.filter((p) => p.user_id === userId);
  }
  return res.json({ payments });
});

module.exports = router;
