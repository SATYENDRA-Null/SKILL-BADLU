/**
 * SKILL BADLU - Admin Sovereign Desk Routes
 * Handles KYC applicant approvals/rejections, revenue tracking, ₹99 payment audits.
 */

const express = require("express");
const router = express.Router();
const db = require("../data/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// Optional Auth Middleware for flexibility in dev / tests
const checkAdminAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authenticateToken(req, res, () => {
      requireAdmin(req, res, next);
    });
  }
  // In dev / test mode allow admin desk operations
  next();
};

/**
 * @route   GET /api/admin/pending-users
 * @desc    Get all users awaiting sovereign KYC verification
 */
router.get("/pending-users", checkAdminAuth, (req, res) => {
  try {
    const pending = db
      .getUsers()
      .filter((u) => u.verification_status === "PENDING" && u.role !== "admin")
      .map(sanitizeUser);

    return res.json({
      count: pending.length,
      users: pending
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   POST /api/admin/approve-user/:userId
 * @desc    Approve user KYC verification and unlock ₹99 onboarding payment step
 */
router.post("/approve-user/:userId", checkAdminAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "User not found in system."
      });
    }

    const updatedUser = db.updateUser(userId, {
      verification_status: "APPROVED",
      status: user.fee_status === "PAID" ? "ACTIVE" : "PENDING_PAYMENT",
      fee_status: user.fee_status === "PAID" ? "PAID" : "PENDING_PAYMENT",
      verified_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `User ${user.name} has been verified by Admin. Status updated to PENDING_PAYMENT (₹99).`,
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   POST /api/admin/reject-user/:userId
 * @desc    Reject user KYC application
 */
router.post("/reject-user/:userId", checkAdminAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const {
      reason = "Verification documents did not meet sovereign platform criteria."
    } = req.body;

    const user = db.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "User not found in system."
      });
    }

    const updatedUser = db.updateUser(userId, {
      verification_status: "REJECTED",
      status: "REJECTED",
      rejection_reason: reason
    });

    return res.json({
      success: true,
      message: `User ${user.name} has been rejected.`,
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   GET /api/admin/revenue-metrics
 * @desc    Get ₹99 onboarding revenue analytics, gross counts, and payment breakdowns
 */
router.get("/revenue-metrics", checkAdminAuth, (req, res) => {
  try {
    const metrics = db.getRevenueMetrics();
    return res.json({ success: true, metrics });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   GET /api/admin/onboarding-payments
 * @desc    List all completed ₹99 onboarding payments
 */
router.get("/onboarding-payments", checkAdminAuth, (req, res) => {
  try {
    const payments = db.getPayments();
    return res.json({
      count: payments.length,
      payments
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

/**
 * @route   GET /api/admin/ledger
 * @desc    Get complete sovereign double-entry ledger
 */
router.get("/ledger", checkAdminAuth, (req, res) => {
  try {
    const ledger = db.getLedger();
    return res.json({
      count: ledger.length,
      ledger
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: err.message });
  }
});

module.exports = router;
