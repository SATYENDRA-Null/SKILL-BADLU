/**
 * SKILL BADLU - File-Backed Persistent Database Engine
 * Handles Users, Transactions, Onboarding Payments (₹99), Sessions, and Ledger.
 */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_FILE = path.join(__dirname, "db.json");

// Default initial seed data with pre-hashed demo passwords
function getInitialSeedData() {
  const defaultPasswordHash = bcrypt.hashSync("password123", 8);

  return {
    users: [
      {
        id: "user_admin",
        name: "SkillBadlu Sovereign Desk",
        email: "admin@skillbadlu.com",
        password: defaultPasswordHash,
        role: "admin",
        avatar: "🛡️",
        headline: "Chief Protocol Arbitrator & Platform Governor",
        skillsHave: [],
        skillsWant: [],
        credits: 9999,
        rating: 5.0,
        swaps_completed: 0,
        status: "ACTIVE",
        verification_status: "APPROVED",
        fee_status: "EXEMPT",
        fee_amount: 0,
        kyc_document: "GOV_ADMIN_ROOT_KEY_001",
        joined_date: "2026-01-01T00:00:00.000Z",
        verified_at: "2026-01-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "user_a",
        name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        password: defaultPasswordHash,
        role: "user",
        avatar: "👨‍💻",
        headline: "Senior React & Node.js Architect",
        skillsHave: [
          {
            skill_id: "sk_react",
            name: "React & Next.js",
            category: "tech",
            level: 5
          },
          {
            skill_id: "sk_node",
            name: "Node.js & Express",
            category: "tech",
            level: 4
          }
        ],
        skillsWant: [
          {
            skill_id: "sk_figma",
            name: "Figma UI/UX Design",
            category: "design",
            target_level: 4
          }
        ],
        credits: 50,
        rating: 4.9,
        swaps_completed: 12,
        status: "ACTIVE",
        verification_status: "APPROVED",
        fee_status: "PAID",
        fee_amount: 99,
        onboarding_payment_id: "PAY_99_SEED_01",
        kyc_document: "AADHAAR_VERIFIED_7890",
        joined_date: "2026-02-10T10:30:00.000Z",
        verified_at: "2026-02-10T11:00:00.000Z",
        paid_at: "2026-02-10T11:05:00.000Z",
        created_at: "2026-02-10T10:30:00.000Z"
      },
      {
        id: "user_b",
        name: "Priya Patel",
        email: "priya.patel@example.com",
        password: defaultPasswordHash,
        role: "user",
        avatar: "🎨",
        headline: "Product Designer & Design Systems Lead",
        skillsHave: [
          {
            skill_id: "sk_figma",
            name: "Figma UI/UX Design",
            category: "design",
            level: 5
          },
          {
            skill_id: "sk_brand",
            name: "Brand Identity Design",
            category: "design",
            level: 4
          }
        ],
        skillsWant: [
          {
            skill_id: "sk_react",
            name: "React & Next.js",
            category: "tech",
            target_level: 3
          }
        ],
        credits: 40,
        rating: 4.95,
        swaps_completed: 9,
        status: "ACTIVE",
        verification_status: "APPROVED",
        fee_status: "PAID",
        fee_amount: 99,
        onboarding_payment_id: "PAY_99_SEED_02",
        kyc_document: "PAN_VERIFIED_3421",
        joined_date: "2026-02-12T14:15:00.000Z",
        verified_at: "2026-02-12T14:45:00.000Z",
        paid_at: "2026-02-12T14:50:00.000Z",
        created_at: "2026-02-12T14:15:00.000Z"
      },
      {
        id: "user_c",
        name: "Amit Kumar",
        email: "amit.kumar@example.com",
        password: defaultPasswordHash,
        role: "user",
        avatar: "🚀",
        headline: "Growth Marketer & SEO Specialist",
        skillsHave: [
          {
            skill_id: "sk_seo",
            name: "Technical SEO & SEM",
            category: "marketing",
            level: 5
          },
          {
            skill_id: "sk_growth",
            name: "Funnel Optimization",
            category: "marketing",
            level: 4
          }
        ],
        skillsWant: [
          {
            skill_id: "sk_python",
            name: "Python Data Analysis",
            category: "tech",
            target_level: 4
          }
        ],
        credits: 60,
        rating: 4.8,
        swaps_completed: 7,
        status: "ACTIVE",
        verification_status: "APPROVED",
        fee_status: "PAID",
        fee_amount: 99,
        onboarding_payment_id: "PAY_99_SEED_03",
        kyc_document: "PASSPORT_VERIFIED_9901",
        joined_date: "2026-02-15T09:00:00.000Z",
        verified_at: "2026-02-15T09:30:00.000Z",
        paid_at: "2026-02-15T09:35:00.000Z",
        created_at: "2026-02-15T09:00:00.000Z"
      },
      {
        id: "user_d",
        name: "Sneha Rao",
        email: "sneha.rao@example.com",
        password: defaultPasswordHash,
        role: "user",
        avatar: "👩‍💼",
        headline: "Python Data Science Enthusiast",
        skillsHave: [
          {
            skill_id: "sk_python",
            name: "Python & Pandas",
            category: "tech",
            level: 4
          }
        ],
        skillsWant: [
          {
            skill_id: "sk_growth",
            name: "Performance Marketing",
            category: "marketing",
            target_level: 3
          }
        ],
        credits: 0,
        rating: 0,
        swaps_completed: 0,
        status: "PENDING_VERIFICATION",
        verification_status: "PENDING",
        fee_status: "UNPAID",
        fee_amount: 99,
        kyc_document: "AADHAAR_UPLOAD_PENDING_REVIEW",
        joined_date: "2026-03-01T12:00:00.000Z",
        created_at: "2026-03-01T12:00:00.000Z"
      },
      {
        id: "user_e",
        name: "Vikram Singh",
        email: "vikram.singh@example.com",
        password: defaultPasswordHash,
        role: "user",
        avatar: "👨‍🏫",
        headline: "Full-Stack Devops & Docker Specialist",
        skillsHave: [
          {
            skill_id: "sk_docker",
            name: "Docker & Kubernetes",
            category: "tech",
            level: 5
          }
        ],
        skillsWant: [
          {
            skill_id: "sk_react",
            name: "Next.js 15",
            category: "tech",
            target_level: 4
          }
        ],
        credits: 0,
        rating: 0,
        swaps_completed: 0,
        status: "PENDING_PAYMENT",
        verification_status: "APPROVED",
        fee_status: "PENDING_PAYMENT",
        fee_amount: 99,
        kyc_document: "PAN_DOC_APPROVED",
        joined_date: "2026-03-02T16:00:00.000Z",
        verified_at: "2026-03-02T16:30:00.000Z",
        created_at: "2026-03-02T16:00:00.000Z"
      }
    ],
    onboarding_payments: [
      {
        id: "PAY_99_SEED_01",
        order_id: "ORDER_SB_99_SEED_01",
        user_id: "user_a",
        user_name: "Rahul Sharma",
        user_email: "rahul.sharma@example.com",
        amount: 99.0,
        currency: "INR",
        base_amount: 83.9,
        gst_amount: 15.1,
        gst_rate: "18%",
        hsn_code: "998431",
        method: "UPI (Instant)",
        gateway_ref: "UPI/2026/02/10/789123891",
        status: "COMPLETED",
        credits_granted: 50,
        invoice_number: "INV-SB-2026-0001",
        timestamp: "2026-02-10T11:05:00.000Z"
      },
      {
        id: "PAY_99_SEED_02",
        order_id: "ORDER_SB_99_SEED_02",
        user_id: "user_b",
        user_name: "Priya Patel",
        user_email: "priya.patel@example.com",
        amount: 99.0,
        currency: "INR",
        base_amount: 83.9,
        gst_amount: 15.1,
        gst_rate: "18%",
        hsn_code: "998431",
        method: "Credit/Debit Card",
        gateway_ref: "CARD/2026/02/12/441299812",
        status: "COMPLETED",
        credits_granted: 50,
        invoice_number: "INV-SB-2026-0002",
        timestamp: "2026-02-12T14:50:00.000Z"
      },
      {
        id: "PAY_99_SEED_03",
        order_id: "ORDER_SB_99_SEED_03",
        user_id: "user_c",
        user_name: "Amit Kumar",
        user_email: "amit.kumar@example.com",
        amount: 99.0,
        currency: "INR",
        base_amount: 83.9,
        gst_amount: 15.1,
        gst_rate: "18%",
        hsn_code: "998431",
        method: "UPI (GooglePay)",
        gateway_ref: "UPI/2026/02/15/663819201",
        status: "COMPLETED",
        credits_granted: 50,
        invoice_number: "INV-SB-2026-0003",
        timestamp: "2026-02-15T09:35:00.000Z"
      }
    ],
    ledger: [
      {
        id: "tx_init_mint_a",
        type: "ONBOARDING_WELCOME_GRANT",
        from_id: "SYSTEM_MINT",
        to_id: "user_a",
        amount: 50,
        description:
          "Welcome bonus grant upon ₹99 onboarding payment verification",
        timestamp: "2026-02-10T11:05:00.000Z"
      },
      {
        id: "tx_init_mint_b",
        type: "ONBOARDING_WELCOME_GRANT",
        from_id: "SYSTEM_MINT",
        to_id: "user_b",
        amount: 50,
        description:
          "Welcome bonus grant upon ₹99 onboarding payment verification",
        timestamp: "2026-02-12T14:50:00.000Z"
      },
      {
        id: "tx_init_mint_c",
        type: "ONBOARDING_WELCOME_GRANT",
        from_id: "SYSTEM_MINT",
        to_id: "user_c",
        amount: 50,
        description:
          "Welcome bonus grant upon ₹99 onboarding payment verification",
        timestamp: "2026-02-15T09:35:00.000Z"
      }
    ],
    payment_orders: []
  };
}

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      const dataDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        // Ensure all required top-level arrays exist
        if (!this.data.users) this.data.users = [];
        if (!this.data.onboarding_payments) this.data.onboarding_payments = [];
        if (!this.data.ledger) this.data.ledger = [];
        if (!this.data.payment_orders) this.data.payment_orders = [];
      } else {
        this.data = getInitialSeedData();
        this.save();
      }
    } catch (err) {
      console.error(
        "[DB Init Error] Falling back to default seed data:",
        err.message
      );
      this.data = getInitialSeedData();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
      return true;
    } catch (err) {
      console.error("[DB Save Error]:", err.message);
      return false;
    }
  }

  reset() {
    this.data = getInitialSeedData();
    this.save();
    return this.data;
  }

  // --- User Operations ---
  getUsers() {
    return this.data.users;
  }

  findUserById(id) {
    if (!id) return null;
    return this.data.users.find((u) => u.id === id) || null;
  }

  findUserByEmail(email) {
    if (!email) return null;
    return (
      this.data.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      ) || null
    );
  }

  createUser(userData) {
    const newUser = {
      id: userData.id || `user_${Date.now()}`,
      name: userData.name || "New Swapper",
      email: userData.email.toLowerCase(),
      password: userData.password, // already hashed
      role: userData.role || "user",
      avatar: userData.avatar || "👤",
      headline: userData.headline || "Skill Swapper Community Member",
      skillsHave: userData.skillsHave || [],
      skillsWant: userData.skillsWant || [],
      credits: userData.credits !== undefined ? userData.credits : 0,
      rating: 0,
      swaps_completed: 0,
      status: userData.status || "PENDING_VERIFICATION",
      verification_status: userData.verification_status || "PENDING",
      fee_status: userData.fee_status || "UNPAID",
      fee_amount: 99,
      kyc_document: userData.kyc_document || "ID_SUBMITTED_FOR_VERIFICATION",
      joined_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.save();
    return this.data.users[index];
  }

  // --- Payment Orders ---
  createOrder(orderData) {
    const order = {
      id:
        orderData.id ||
        `ORDER_SB_99_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: orderData.userId,
      amount: orderData.amount || 99.0,
      currency: "INR",
      base_amount: 83.9,
      gst_amount: 15.1,
      purpose: orderData.purpose || "ONBOARDING_FEE",
      status: "CREATED",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    this.data.payment_orders.push(order);
    this.save();
    return order;
  }

  findOrderById(orderId) {
    return this.data.payment_orders.find((o) => o.id === orderId) || null;
  }

  updateOrder(orderId, updates) {
    const index = this.data.payment_orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    this.data.payment_orders[index] = {
      ...this.data.payment_orders[index],
      ...updates
    };

    this.save();
    return this.data.payment_orders[index];
  }

  // --- Onboarding Payments (₹99) ---
  createPayment(paymentData) {
    const count = this.data.onboarding_payments.length + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-SB-${year}-${String(count).padStart(4, "0")}`;

    const payment = {
      id:
        paymentData.id ||
        `PAY_99_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order_id: paymentData.orderId || null,
      user_id: paymentData.userId,
      user_name: paymentData.userName,
      user_email: paymentData.userEmail,
      amount: 99.0,
      currency: "INR",
      base_amount: 83.9,
      gst_amount: 15.1,
      gst_rate: "18%",
      hsn_code: "998431",
      method: paymentData.method || "UPI (Instant)",
      gateway_ref:
        paymentData.gatewayRef ||
        `TXN_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`,
      status: "COMPLETED",
      credits_granted: 50,
      invoice_number: invoiceNumber,
      timestamp: new Date().toISOString()
    };

    this.data.onboarding_payments.unshift(payment);
    this.save();
    return payment;
  }

  getPayments() {
    return this.data.onboarding_payments;
  }

  findPaymentById(paymentId) {
    return (
      this.data.onboarding_payments.find((p) => p.id === paymentId) || null
    );
  }

  // --- Ledger ---
  addLedgerEntry(entry) {
    const ledgerEntry = {
      id:
        entry.id ||
        `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: entry.type || "TRANSFER",
      from_id: entry.from_id || entry.fromId,
      to_id: entry.to_id || entry.toId,
      amount: entry.amount,
      description: entry.description,
      timestamp: new Date().toISOString()
    };

    this.data.ledger.push(ledgerEntry);
    this.save();
    return ledgerEntry;
  }

  getLedger() {
    return this.data.ledger;
  }

  // --- Metrics & Analytics ---
  getRevenueMetrics() {
    const payments = this.data.onboarding_payments;
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 99), 0);
    const totalGst = payments.reduce(
      (acc, p) => acc + (p.gst_amount || 15.1),
      0
    );
    const totalBase = payments.reduce(
      (acc, p) => acc + (p.base_amount || 83.9),
      0
    );

    const paidUsersCount = payments.length;
    const pendingPaymentUsers = this.data.users.filter(
      (u) =>
        u.verification_status === "APPROVED" &&
        u.fee_status === "PENDING_PAYMENT"
    ).length;
    const pendingKycUsers = this.data.users.filter(
      (u) => u.verification_status === "PENDING"
    ).length;

    const methodBreakdown = payments.reduce((acc, p) => {
      const m = p.method || "Other";
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRevenue,
      totalBaseRevenue: Math.round(totalBase * 100) / 100,
      totalGstCollected: Math.round(totalGst * 100) / 100,
      paidUsersCount,
      pendingPaymentUsers,
      pendingKycUsers,
      methodBreakdown,
      feePerUser: 99,
      welcomeCreditsBonus: 50,
      recentPayments: payments.slice(0, 10)
    };
  }
}

// Export singleton instance
const db = new Database();
module.exports = db;
