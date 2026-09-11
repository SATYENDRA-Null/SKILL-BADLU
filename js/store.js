/**
 * Skill Badlu — Central Reactive State Store & Seed Database
 * References: docs/architecture/system-design.md
 */

const INITIAL_SKILLS = [
  {
    id: "sk_python",
    name: "Python & FastAPI",
    category: "tech",
    description: "Backend development, async APIs, and data engineering."
  },
  {
    id: "sk_french",
    name: "Conversational French",
    category: "lang",
    description: "Everyday dialogues, pronunciation, and Parisian culture."
  },
  {
    id: "sk_uiux",
    name: "UI/UX & Figma",
    category: "art",
    description:
      "Design systems, auto-layout, wireframing, and micro-interactions."
  },
  {
    id: "sk_growth",
    name: "Growth Marketing",
    category: "biz",
    description:
      "SEO, conversion rate optimization, and user acquisition funnels."
  },
  {
    id: "sk_docker",
    name: "Docker & Kubernetes",
    category: "tech",
    description: "Containerization, microservice orchestration, and CI/CD."
  },
  {
    id: "sk_japanese",
    name: "Japanese (JLPT N4)",
    category: "lang",
    description:
      "Grammar, kanji fundamentals, and natural conversational cadence."
  },
  {
    id: "sk_pottery",
    name: "Ceramics & Pottery",
    category: "art",
    description:
      "Hand-building, wheel-throwing techniques, and glaze chemistry."
  },
  {
    id: "sk_finance",
    name: "Startup Valuation & VC",
    category: "biz",
    description: "Financial modeling, cap table management, and fundraising."
  },
  {
    id: "sk_react",
    name: "React & Next.js",
    category: "tech",
    description: "Server components, hooks, Tailwind, and fullstack TypeScript."
  }
];

const INITIAL_USERS = [
  {
    id: "user_admin",
    name: "System Admin (Curator)",
    email: "admin@skillbadlu.com",
    role: "admin",
    avatar: "AD",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    fee_status: "PAID",
    fee_amount: 0,
    payment_ref: "SYSTEM_EXEMPT",
    creator_status: "APPROVED",
    can_upload_videos: true,
    avg_rating: 5.0,
    last_active: new Date(),
    skills_have: [
      {
        skill_id: "sk_python",
        name: "Python & FastAPI",
        category: "tech",
        level: 4
      }
    ],
    skills_want: [],
    bank_details: {
      bank: "Platform Treasury",
      ifsc: "TREASURY01",
      account: "•••• 0001"
    }
  },
  {
    id: "user_a",
    name: "Leo Vance (You)",
    email: "leo.vance@example.com",
    role: "swapper",
    avatar: "LV",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    fee_status: "PAID",
    fee_amount: 99,
    fee_paid_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    payment_ref: "PAY_99_LV8921",
    payment_method: "UPI (Google Pay)",
    creator_status: "APPROVED",
    can_upload_videos: true,
    avg_rating: 4.95,
    last_active: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    skills_have: [
      {
        skill_id: "sk_python",
        name: "Python & FastAPI",
        category: "tech",
        level: 4
      }, // Expert
      {
        skill_id: "sk_docker",
        name: "Docker & Kubernetes",
        category: "tech",
        level: 3
      } // Advanced
    ],
    skills_want: [
      {
        skill_id: "sk_french",
        name: "Conversational French",
        category: "lang",
        level: 2
      }, // Intermediate
      { skill_id: "sk_uiux", name: "UI/UX & Figma", category: "art", level: 3 }
    ],
    bank_details: {
      bank: "HDFC Bank",
      ifsc: "HDFC0001234",
      account: "•••• 9042"
    }
  },
  {
    id: "user_b",
    name: "Camille Dubois",
    email: "camille.dubois@paris.fr",
    role: "swapper",
    avatar: "CD",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    fee_status: "PAID",
    fee_amount: 99,
    fee_paid_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    payment_ref: "PAY_99_CD4312",
    payment_method: "Credit Card",
    creator_status: "APPROVED",
    can_upload_videos: true,
    avg_rating: 4.9,
    last_active: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    skills_have: [
      {
        skill_id: "sk_french",
        name: "Conversational French",
        category: "lang",
        level: 4
      },
      {
        skill_id: "sk_pottery",
        name: "Ceramics & Pottery",
        category: "art",
        level: 3
      }
    ],
    skills_want: [
      {
        skill_id: "sk_python",
        name: "Python & FastAPI",
        category: "tech",
        level: 2
      }, // Perfect mutual swap!
      {
        skill_id: "sk_growth",
        name: "Growth Marketing",
        category: "biz",
        level: 1
      }
    ],
    bank_details: {
      bank: "BNP Paribas",
      ifsc: "BNPA0009988",
      account: "•••• 4410"
    }
  },
  {
    id: "user_c",
    name: "Aarav Sharma",
    email: "aarav.sharma@design.io",
    role: "swapper",
    avatar: "AS",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    fee_status: "PAID",
    fee_amount: 99,
    fee_paid_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    payment_ref: "PAY_99_AS2209",
    payment_method: "UPI (PhonePe)",
    creator_status: "APPROVED",
    can_upload_videos: true,
    avg_rating: 4.8,
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hrs ago
    skills_have: [
      { skill_id: "sk_uiux", name: "UI/UX & Figma", category: "art", level: 4 },
      {
        skill_id: "sk_react",
        name: "React & Next.js",
        category: "tech",
        level: 3
      }
    ],
    skills_want: [
      {
        skill_id: "sk_docker",
        name: "Docker & Kubernetes",
        category: "tech",
        level: 2
      } // Another mutual swap!
    ],
    bank_details: {
      bank: "ICICI Bank",
      ifsc: "ICIC0005511",
      account: "•••• 7821"
    }
  },
  {
    id: "user_d",
    name: "Kaito Tanaka",
    email: "kaito.tanaka@tokyo.jp",
    role: "swapper",
    avatar: "KT",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    fee_status: "PAID",
    fee_amount: 99,
    fee_paid_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    payment_ref: "PAY_99_KT1094",
    payment_method: "Net Banking",
    creator_status: "NOT_REQUESTED",
    can_upload_videos: false,
    avg_rating: 4.7,
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    skills_have: [
      {
        skill_id: "sk_japanese",
        name: "Japanese (JLPT N4)",
        category: "lang",
        level: 4
      }
    ],
    skills_want: [
      {
        skill_id: "sk_python",
        name: "Python & FastAPI",
        category: "tech",
        level: 3
      }
    ],
    bank_details: null
  },
  {
    id: "user_e",
    name: "Zara Chen",
    email: "zara.chen@ventures.co",
    role: "swapper",
    avatar: "ZC",
    verified_status: "PENDING_REVIEW", // In admin review queue
    kyc_status: "PENDING",
    fee_status: "UNPAID",
    fee_amount: 0,
    payment_ref: null,
    payment_method: null,
    creator_status: "PENDING_APPROVAL",
    can_upload_videos: false,
    avg_rating: 5.0,
    last_active: new Date(Date.now() - 1000 * 60 * 15),
    skills_have: [
      {
        skill_id: "sk_finance",
        name: "Startup Valuation & VC",
        category: "biz",
        level: 4
      }
    ],
    skills_want: [
      {
        skill_id: "sk_python",
        name: "Python & FastAPI",
        category: "tech",
        level: 1
      }
    ],
    bank_details: {
      bank: "Axis Bank",
      ifsc: "UTIB0001099",
      account: "•••• 3190"
    }
  },
  {
    id: "user_f",
    name: "Priya Patel",
    email: "priya.patel@ai.in",
    role: "swapper",
    avatar: "PP",
    verified_status: "VERIFIED", // Admin-Verified, Ready for ₹99 login payment
    kyc_status: "VERIFIED",
    fee_status: "PENDING_PAYMENT",
    fee_amount: 0,
    payment_ref: null,
    payment_method: null,
    creator_status: "NOT_REQUESTED",
    can_upload_videos: false,
    avg_rating: 5.0,
    last_active: new Date(),
    skills_have: [
      {
        skill_id: "sk_growth",
        name: "Growth Marketing",
        category: "biz",
        level: 4
      }
    ],
    skills_want: [
      {
        skill_id: "sk_react",
        name: "React & Next.js",
        category: "tech",
        level: 2
      }
    ],
    bank_details: null
  }
];

const INITIAL_ONBOARDING_PAYMENTS = [
  {
    id: "PAY_99_LV8921",
    user_id: "user_a",
    user_name: "Leo Vance",
    user_email: "leo.vance@example.com",
    amount: 99,
    currency: "INR",
    method: "UPI (Google Pay)",
    status: "SETTLED",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6)
  },
  {
    id: "PAY_99_CD4312",
    user_id: "user_b",
    user_name: "Camille Dubois",
    user_email: "camille.dubois@paris.fr",
    amount: 99,
    currency: "INR",
    method: "Credit Card",
    status: "SETTLED",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
  },
  {
    id: "PAY_99_AS2209",
    user_id: "user_c",
    user_name: "Aarav Sharma",
    user_email: "aarav.sharma@design.io",
    amount: 99,
    currency: "INR",
    method: "UPI (PhonePe)",
    status: "SETTLED",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
  },
  {
    id: "PAY_99_KT1094",
    user_id: "user_d",
    user_name: "Kaito Tanaka",
    user_email: "kaito.tanaka@tokyo.jp",
    amount: 99,
    currency: "INR",
    method: "Net Banking",
    status: "SETTLED",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
  }
];

const INITIAL_SESSIONS = [
  {
    id: "sess_001",
    match_id: "match_ab",
    learner_id: "user_a", // Leo
    teacher_id: "user_b", // Camille
    skill_id: "sk_french",
    skill_name: "Conversational French (Pronunciation & Travel)",
    agreed_credit_amount: 50,
    confirmed_by_a: false,
    confirmed_by_b: false,
    status: "SCHEDULED", // REQUESTED -> SCHEDULED -> IN_PROGRESS -> PENDING_CONFIRMATION -> SETTLED
    scheduled_start: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours from now
    settled_at: null
  },
  {
    id: "sess_002",
    match_id: "match_ac",
    learner_id: "user_c", // Aarav
    teacher_id: "user_a", // Leo
    skill_id: "sk_docker",
    skill_name: "Docker & Kubernetes Deployment Architecture",
    agreed_credit_amount: 50,
    confirmed_by_a: true, // Aarav confirmed
    confirmed_by_b: false, // Waiting on Leo to confirm
    status: "PENDING_CONFIRMATION",
    scheduled_start: new Date(Date.now() - 1000 * 60 * 120),
    settled_at: null
  },
  {
    id: "sess_000",
    match_id: "match_hist",
    learner_id: "user_b",
    teacher_id: "user_a",
    skill_id: "sk_python",
    skill_name: "FastAPI REST Architecture & Async SQLAlchemy",
    agreed_credit_amount: 50,
    confirmed_by_a: true,
    confirmed_by_b: true,
    status: "SETTLED",
    scheduled_start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    settled_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 3600000)
  }
];

// Initial Append-Only Double-Entry Ledger Transactions
const INITIAL_TRANSACTIONS = [
  {
    id: "tx_init_grant_a",
    session_id: null,
    from_user: "PLATFORM_TREASURY",
    to_user: "user_a",
    amount: 100,
    transaction_type: "ONBOARDING_WELCOME_GRANT",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  },
  {
    id: "tx_init_grant_b",
    session_id: null,
    from_user: "PLATFORM_TREASURY",
    to_user: "user_b",
    amount: 100,
    transaction_type: "ONBOARDING_WELCOME_GRANT",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  },
  {
    id: "tx_init_grant_c",
    session_id: null,
    from_user: "PLATFORM_TREASURY",
    to_user: "user_c",
    amount: 100,
    transaction_type: "ONBOARDING_WELCOME_GRANT",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  },
  {
    id: "tx_init_grant_d",
    session_id: null,
    from_user: "PLATFORM_TREASURY",
    to_user: "user_d",
    amount: 100,
    transaction_type: "ONBOARDING_WELCOME_GRANT",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  },
  {
    id: "tx_sess_000",
    session_id: "sess_000",
    from_user: "user_b",
    to_user: "user_a",
    amount: 50,
    transaction_type: "SESSION_SETTLEMENT",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 3600000)
  }
];

const INITIAL_COURSES = [
  {
    id: "course_fastapi",
    title: "FastAPI REST Architecture & Async Microservices",
    category: "tech",
    creator_id: "user_a",
    credit_cost: 30,
    duration: "15 mins",
    duration_seconds: 45,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description:
      "Learn production async Python patterns, dependency injection, and Pydantic v2 schemas for high-concurrency APIs.",
    status: "APPROVED", // APPROVED, PENDING_REVIEW, REJECTED
    rating: 4.95,
    enrolled_count: 14,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
  },
  {
    id: "course_docker",
    title: "Docker & Kubernetes Deployment Architecture",
    category: "tech",
    creator_id: "user_a",
    credit_cost: 40,
    duration: "20 mins",
    duration_seconds: 60,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description:
      "Container orchestration, Helm charts, ingress controllers, and zero-downtime rolling updates in production.",
    status: "APPROVED",
    rating: 4.88,
    enrolled_count: 9,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
  },
  {
    id: "course_french",
    title: "Conversational French: Accent & Travel Mastery",
    category: "lang",
    creator_id: "user_b",
    credit_cost: 25,
    duration: "12 mins",
    duration_seconds: 30,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    description:
      "Master Parisian cadence, slang, and everyday conversational confidence without memorizing rigid grammar tables.",
    status: "APPROVED",
    rating: 4.92,
    enrolled_count: 22,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6)
  },
  {
    id: "course_uiux",
    title: "Design Systems & Figma Auto-Layout Pro",
    category: "art",
    creator_id: "user_c",
    credit_cost: 35,
    duration: "18 mins",
    duration_seconds: 50,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    description:
      "Build scalable tokens, responsive auto-layout components, and neo-brutalist micro-interactions with Figma.",
    status: "APPROVED",
    rating: 4.85,
    enrolled_count: 17,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
  },
  {
    id: "course_finance_pending",
    title: "Startup Valuation & Cap Table Engineering",
    category: "biz",
    creator_id: "user_e",
    credit_cost: 50,
    duration: "25 mins",
    duration_seconds: 60,
    video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    description:
      "DCF models, convertible notes, SAFE agreements, and seed round term sheet negotiations for founders.",
    status: "PENDING_REVIEW", // In admin review queue
    rating: 5.0,
    enrolled_count: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2)
  }
];

const INITIAL_ENROLLMENTS = [
  // Leo Vance is pre-enrolled in Camille's French course for instant testing
  {
    id: "enr_leo_french",
    user_id: "user_a",
    course_id: "course_french",
    enrolled_at: new Date(Date.now() - 1000 * 60 * 60 * 12),
    completed: false,
    watched_seconds: 0,
    certificate_id: null
  }
];

const INITIAL_CERTIFICATES = [];

class StateStore {
  constructor() {
    this.currentUserId = localStorage.getItem("sb_current_user_id") || null;
    this.skills = [...INITIAL_SKILLS];

    // Load persisted users or fallback to initial seed
    const savedUsers = localStorage.getItem("sb_users_v3");
    this.users = savedUsers
      ? JSON.parse(savedUsers)
      : JSON.parse(JSON.stringify(INITIAL_USERS));

    const savedPayments = localStorage.getItem("sb_onboarding_payments_v3");
    this.onboarding_payments = savedPayments
      ? JSON.parse(savedPayments)
      : JSON.parse(JSON.stringify(INITIAL_ONBOARDING_PAYMENTS));

    const savedTx = localStorage.getItem("sb_transactions_v3");
    this.transactions = savedTx
      ? JSON.parse(savedTx)
      : JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));

    this.sessions = [...INITIAL_SESSIONS];
    this.courses = [...INITIAL_COURSES];
    this.enrollments = [...INITIAL_ENROLLMENTS];
    this.certificates = [...INITIAL_CERTIFICATES];
    this.payouts = [];
    this.subscribers = [];
  }

  saveState() {
    try {
      localStorage.setItem("sb_users_v3", JSON.stringify(this.users));
      localStorage.setItem(
        "sb_onboarding_payments_v3",
        JSON.stringify(this.onboarding_payments)
      );
      localStorage.setItem(
        "sb_transactions_v3",
        JSON.stringify(this.transactions)
      );
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  notify(event, data) {
    this.subscribers.forEach((cb) => cb(event, data));
  }

  isAuthenticated() {
    return !!this.currentUserId && !!this.getCurrentUser();
  }

  /**
   * Evaluates if a user is eligible to login or requires admin verification / ₹99 payment
   */
  checkLoginEligibility(userId) {
    const user = this.getUser(userId);
    if (!user) {
      return {
        eligible: false,
        reason: "NOT_FOUND",
        message: "User account not found."
      };
    }

    if (user.role === "admin") {
      return { eligible: true, user };
    }

    // Step 1: Pre-login Admin Verification check
    if (user.verified_status === "PENDING_REVIEW") {
      return {
        eligible: false,
        reason: "PENDING_VERIFICATION",
        user,
        message:
          "Your application is currently pending Admin Verification. Please wait for administrator review."
      };
    }

    if (user.verified_status === "REJECTED") {
      return {
        eligible: false,
        reason: "REJECTED",
        user,
        message:
          user.rejection_reason ||
          "Your application was rejected by the platform administrator."
      };
    }

    // Step 2: Post-verification ₹99 payment check
    if (user.verified_status === "VERIFIED" && user.fee_status !== "PAID") {
      return {
        eligible: false,
        reason: "PAYMENT_REQUIRED",
        user,
        feeAmount: 99,
        message:
          "Admin Verification Successful! Complete your one-time ₹99 Onboarding & Ledger Activation Fee to enter."
      };
    }

    return { eligible: true, user };
  }

  login(userId, { bypassChecks = false } = {}) {
    const user = this.getUser(userId);
    if (!user) throw new Error("User not found.");

    if (!bypassChecks) {
      const eligibility = this.checkLoginEligibility(userId);
      if (!eligibility.eligible) {
        const err = new Error(eligibility.message);
        err.reason = eligibility.reason;
        err.user = eligibility.user;
        err.feeAmount = eligibility.feeAmount || 99;
        throw err;
      }
    }

    this.currentUserId = userId;
    localStorage.setItem("sb_current_user_id", userId);
    this.notify("AUTH_STATE_CHANGED", { user });
    return user;
  }

  logout() {
    this.currentUserId = null;
    localStorage.removeItem("sb_current_user_id");
    this.notify("AUTH_STATE_CHANGED", { user: null });
  }

  getCurrentUser() {
    if (!this.currentUserId) return null;
    return this.users.find((u) => u.id === this.currentUserId) || null;
  }

  getUser(userId) {
    return this.users.find((u) => u.id === userId);
  }

  getSkill(skillId) {
    return this.skills.find((s) => s.id === skillId);
  }

  /**
   * Registers a new applicant in the PENDING_REVIEW state
   */
  registerUser({ name, email, password, skillsHave = [], skillsWant = [] }) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const userId = "user_" + Math.random().toString(36).substring(2, 8);
    const initials =
      name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "NW";

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role: "swapper",
      avatar: initials,
      verified_status: "PENDING_REVIEW", // Pre-login admin review required
      kyc_status: "PENDING",
      fee_status: "UNPAID",
      fee_amount: 0,
      payment_ref: null,
      payment_method: null,
      creator_status: "NOT_REQUESTED",
      can_upload_videos: false,
      avg_rating: 5.0,
      last_active: new Date(),
      skills_have:
        skillsHave.length > 0
          ? skillsHave
          : [
              {
                skill_id: "sk_python",
                name: "Python / General Dev",
                category: "tech",
                level: 3
              }
            ],
      skills_want:
        skillsWant.length > 0
          ? skillsWant
          : [
              {
                skill_id: "sk_uiux",
                name: "UI/UX & Figma",
                category: "art",
                level: 2
              }
            ],
      bank_details: null
    };

    this.users.unshift(newUser);
    this.saveState();
    this.notify("USER_REGISTERED", { user: newUser });
    return newUser;
  }

  /**
   * Records the post-verification ₹99 onboarding payment and mints 50 Welcome Credits
   */
  recordOnboardingPayment(
    userId,
    { method = "UPI (Instant)", transactionRef = null } = {}
  ) {
    const user = this.getUser(userId);
    if (!user) throw new Error("User not found.");

    if (user.verified_status !== "VERIFIED") {
      throw new Error(
        "Admin verification required before completing onboarding payment."
      );
    }

    const payId =
      transactionRef ||
      "PAY_99_" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date();

    user.fee_status = "PAID";
    user.fee_amount = 99;
    user.fee_paid_at = now;
    user.payment_ref = payId;
    user.payment_method = method;

    const paymentRecord = {
      id: payId,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      amount: 99,
      currency: "INR",
      method: method,
      status: "SETTLED",
      created_at: now
    };

    this.onboarding_payments.unshift(paymentRecord);

    // Mint 50 Welcome Platform Credits in ledger if not already minted
    const existingGrant = this.transactions.find(
      (tx) =>
        tx.to_user === user.id &&
        tx.transaction_type === "ONBOARDING_WELCOME_GRANT"
    );
    if (!existingGrant) {
      this.transactions.unshift({
        id: "tx_grant_" + user.id + "_" + Date.now().toString().slice(-4),
        session_id: null,
        from_user: "PLATFORM_TREASURY",
        to_user: user.id,
        amount: 50,
        transaction_type: "ONBOARDING_WELCOME_GRANT",
        created_at: now
      });
    }

    this.saveState();
    this.notify("PAYMENT_RECORDED", { user, payment: paymentRecord });
    return { user, payment: paymentRecord };
  }

  getOnboardingPayments() {
    return this.onboarding_payments || [];
  }

  getRevenueMetrics() {
    const payments = this.getOnboardingPayments();
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 99), 0);
    const paidCount = this.users.filter(
      (u) => u.role !== "admin" && u.fee_status === "PAID"
    ).length;
    const pendingVerificationCount = this.users.filter(
      (u) => u.verified_status === "PENDING_REVIEW"
    ).length;
    const pendingPaymentCount = this.users.filter(
      (u) =>
        u.verified_status === "VERIFIED" &&
        u.fee_status !== "PAID" &&
        u.role !== "admin"
    ).length;

    return {
      totalRevenue,
      paidCount,
      pendingVerificationCount,
      pendingPaymentCount,
      totalUsers: this.users.length
    };
  }

  // Course & Education State Accessors
  getCourses() {
    return this.courses;
  }

  getApprovedCourses() {
    return this.courses.filter((c) => c.status === "APPROVED");
  }

  getPendingCourses() {
    return this.courses.filter((c) => c.status === "PENDING_REVIEW");
  }

  getCourse(courseId) {
    return this.courses.find((c) => c.id === courseId);
  }

  getUserEnrollment(userId, courseId) {
    return (
      this.enrollments.find(
        (e) => e.user_id === userId && e.course_id === courseId
      ) || null
    );
  }

  getUserEnrollments(userId) {
    return this.enrollments.filter((e) => e.user_id === userId);
  }

  getUserCertificates(userId) {
    return this.certificates.filter((c) => c.user_id === userId);
  }

  getCertificate(certId) {
    return this.certificates.find((c) => c.id === certId);
  }

  submitCourse({
    title,
    category,
    creditCost,
    duration,
    durationSeconds,
    videoUrl,
    description
  }) {
    const currentUser = this.getCurrentUser();
    if (!currentUser)
      throw new Error("User must be authenticated to submit a course.");

    const newCourse = {
      id: "course_" + Math.random().toString(36).substring(2, 9),
      title,
      category,
      creator_id: currentUser.id,
      credit_cost: parseInt(creditCost, 10) || 10,
      duration: duration || "10 mins",
      duration_seconds: durationSeconds || 45,
      video_url:
        videoUrl ||
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      description,
      status: "PENDING_REVIEW", // Always starts in review queue for admin approval
      rating: 5.0,
      enrolled_count: 0,
      created_at: new Date()
    };

    this.courses.unshift(newCourse);
    this.notify("COURSE_SUBMITTED", { course: newCourse });
    return newCourse;
  }
}

window.store = new StateStore();
