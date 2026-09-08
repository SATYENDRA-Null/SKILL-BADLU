/**
 * Skill Badlu — Central Reactive State Store & Seed Database
 * References: docs/architecture/system-design.md
 */

const PLATFORM_CASHOUT_UID = "00000000-0000-0000-0000-000000000001";

const INITIAL_SKILLS = [
  { id: "sk_python", name: "Python & FastAPI", category: "tech", description: "Backend development, async APIs, and data engineering." },
  { id: "sk_french", name: "Conversational French", category: "lang", description: "Everyday dialogues, pronunciation, and Parisian culture." },
  { id: "sk_uiux", name: "UI/UX & Figma", category: "art", description: "Design systems, auto-layout, wireframing, and micro-interactions." },
  { id: "sk_growth", name: "Growth Marketing", category: "biz", description: "SEO, conversion rate optimization, and user acquisition funnels." },
  { id: "sk_docker", name: "Docker & Kubernetes", category: "tech", description: "Containerization, microservice orchestration, and CI/CD." },
  { id: "sk_japanese", name: "Japanese (JLPT N4)", category: "lang", description: "Grammar, kanji fundamentals, and natural conversational cadence." },
  { id: "sk_pottery", name: "Ceramics & Pottery", category: "art", description: "Hand-building, wheel-throwing techniques, and glaze chemistry." },
  { id: "sk_finance", name: "Startup Valuation & VC", category: "biz", description: "Financial modeling, cap table management, and fundraising." },
  { id: "sk_react", name: "React & Next.js", category: "tech", description: "Server components, hooks, Tailwind, and fullstack TypeScript." }
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
    avg_rating: 5.00,
    last_active: new Date(),
    skills_have: [
      { skill_id: "sk_python", name: "Python & FastAPI", category: "tech", level: 4 }
    ],
    skills_want: [],
    bank_details: { bank: "Platform Treasury", ifsc: "TREASURY01", account: "•••• 0001" }
  },
  {
    id: "user_a",
    name: "Leo Vance (You)",
    email: "leo.vance@example.com",
    role: "swapper",
    avatar: "LV",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    avg_rating: 4.95,
    last_active: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    skills_have: [
      { skill_id: "sk_python", name: "Python & FastAPI", category: "tech", level: 4 }, // Expert
      { skill_id: "sk_docker", name: "Docker & Kubernetes", category: "tech", level: 3 } // Advanced
    ],
    skills_want: [
      { skill_id: "sk_french", name: "Conversational French", category: "lang", level: 2 }, // Intermediate
      { skill_id: "sk_uiux", name: "UI/UX & Figma", category: "art", level: 3 }
    ],
    bank_details: { bank: "HDFC Bank", ifsc: "HDFC0001234", account: "•••• 9042" }
  },
  {
    id: "user_b",
    name: "Camille Dubois",
    email: "camille.dubois@paris.fr",
    avatar: "CD",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    avg_rating: 4.90,
    last_active: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    skills_have: [
      { skill_id: "sk_french", name: "Conversational French", category: "lang", level: 4 },
      { skill_id: "sk_pottery", name: "Ceramics & Pottery", category: "art", level: 3 }
    ],
    skills_want: [
      { skill_id: "sk_python", name: "Python & FastAPI", category: "tech", level: 2 }, // Perfect mutual swap!
      { skill_id: "sk_growth", name: "Growth Marketing", category: "biz", level: 1 }
    ],
    bank_details: { bank: "BNP Paribas", ifsc: "BNPA0009988", account: "•••• 4410" }
  },
  {
    id: "user_c",
    name: "Aarav Sharma",
    email: "aarav.sharma@design.io",
    avatar: "AS",
    verified_status: "VERIFIED",
    kyc_status: "VERIFIED",
    avg_rating: 4.80,
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hrs ago
    skills_have: [
      { skill_id: "sk_uiux", name: "UI/UX & Figma", category: "art", level: 4 },
      { skill_id: "sk_react", name: "React & Next.js", category: "tech", level: 3 }
    ],
    skills_want: [
      { skill_id: "sk_docker", name: "Docker & Kubernetes", category: "tech", level: 2 } // Another mutual swap!
    ],
    bank_details: { bank: "ICICI Bank", ifsc: "ICIC0005511", account: "•••• 7821" }
  },
  {
    id: "user_d",
    name: "Kaito Tanaka",
    email: "kaito.tanaka@tokyo.jp",
    avatar: "KT",
    verified_status: "VERIFIED",
    kyc_status: "UNSUBMITTED",
    avg_rating: 4.70,
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    skills_have: [
      { skill_id: "sk_japanese", name: "Japanese (JLPT N4)", category: "lang", level: 4 }
    ],
    skills_want: [
      { skill_id: "sk_python", name: "Python & FastAPI", category: "tech", level: 3 }
    ],
    bank_details: null
  },
  {
    id: "user_e",
    name: "Zara Chen",
    email: "zara.chen@ventures.co",
    avatar: "ZC",
    verified_status: "PENDING_REVIEW", // In admin review queue
    kyc_status: "PENDING",
    avg_rating: 5.00,
    last_active: new Date(Date.now() - 1000 * 60 * 15),
    skills_have: [
      { skill_id: "sk_finance", name: "Startup Valuation & VC", category: "biz", level: 4 }
    ],
    skills_want: [
      { skill_id: "sk_python", name: "Python & FastAPI", category: "tech", level: 1 }
    ],
    bank_details: { bank: "Axis Bank", ifsc: "UTIB0001099", account: "•••• 3190" }
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
    confirmed_by_a: true,  // Aarav confirmed
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
    id: "tx_sess_000",
    session_id: "sess_000",
    from_user: "user_b",
    to_user: "user_a",
    amount: 50,
    transaction_type: "SESSION_SETTLEMENT",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 3600000)
  }
];

class StateStore {
  constructor() {
    this.currentUserId = localStorage.getItem("sb_current_user_id") || null;
    this.skills = [...INITIAL_SKILLS];
    this.users = [...INITIAL_USERS];
    this.sessions = [...INITIAL_SESSIONS];
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.payouts = [];
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify(event, data) {
    this.subscribers.forEach(cb => cb(event, data));
  }

  isAuthenticated() {
    return !!this.currentUserId && !!this.getCurrentUser();
  }

  login(userId) {
    const user = this.getUser(userId);
    if (!user) throw new Error("User not found");
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
    return this.users.find(u => u.id === this.currentUserId) || null;
  }

  getUser(userId) {
    return this.users.find(u => u.id === userId);
  }

  getSkill(skillId) {
    return this.skills.find(s => s.id === skillId);
  }
}

window.store = new StateStore();
