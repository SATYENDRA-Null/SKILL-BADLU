/**
 * SKILL BADLU - JWT Authentication & Authorization Middleware
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "skillbadlu_neo_brutalist_jwt_secret_2026_ledger_super_key";

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      verification_status: user.verification_status,
      fee_status: user.fee_status
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Access token required. Please log in."
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Invalid or expired session token."
      });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "ADMIN_ACCESS_REQUIRED",
      message:
        "Access denied: Admin role required for this sovereign operation."
    });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  requireAdmin
};
