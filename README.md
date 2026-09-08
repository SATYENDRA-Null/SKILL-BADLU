# 🚀 SKILL BADLU (स्किल बदलू)

> **Peer-to-Peer Zero-Commission Skill Barter Economy & Distributed Ledger Platform**

[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/version-4.4.0-blue.svg)]()
[![Tech Stack](https://img.shields.io/badge/stack-HTML5%20%7C%20CSS3%20%7C%20ES6%2B%20%7C%20Python-orange.svg)]()
[![Architecture](https://img.shields.io/badge/architecture-Double--Entry%20Ledger%20%2B%20Saga-purple.svg)]()

---

## 📖 Overview

**Skill Badlu** is an immutable, peer-to-peer (P2P) skill-exchange platform engineered to eliminate financial friction from lifelong continuous learning. The platform operates on a **zero-commission barter economy**: members exchange pedagogical time measured in platform **Credits** ($1 \text{ Hour} = 50 \text{ Credits}$) without platform cuts or intermediary commission fees.

Built on pure web standards (HTML5, Vanilla CSS Design System, Modular ES6 JavaScript) and backed by financial/cryptographic architectural patterns, Skill Badlu delivers a zero-dependency, ultra-fast web experience with enterprise-grade state integrity.

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| 🎯 **Multi-Factor Matchmaking** | 5-Factor scoring engine balancing skill relevance, rating trust, reciprocal barter symmetry, response latency, and time-zone overlap. |
| 📒 **Append-Only Double-Entry Ledger** | Dynamic balance derivation from immutable transaction journals with mathematical platform solvency proof ($\sum \text{Debits} = \sum \text{Credits}$). |
| 🤝 **Dual-Party Consensus Settlement** | Escrow-backed session lifecycle requiring mutual cryptographic-style confirmation from learner & teacher before credit transfer. |
| 💳 **Saga-Pattern Fiat Cashouts** | Multi-step outbound banking integration with automatic compensating reversals on network timeouts or banking rail rejections. |
| 🛡️ **3-Tier Role-Based Access Control** | Physical DOM isolation and authentication boundaries between **Guests**, **Verified Swappers**, and **System Administrators**. |
| ⚖️ **KYC & Dispute Arbitration** | Complete admin moderation pipeline for applicant onboarding, identity verification, welcome grants, and disputed session arbitration. |

---

## 🏛️ System Architecture

```mermaid
graph TD
    classDef client fill:#f8fafc,stroke:#334155,stroke-width:2px;
    classDef engine fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef ledger fill:#dcfce7,stroke:#16a34a,stroke-width:2px;
    classDef admin fill:#fef3c7,stroke:#d97706,stroke-width:2px;

    User[Member / Client Browser]:::client -->|Declares Skills Have & Want| Store[Reactive State Store (js/store.js)]:::engine
    Store -->|Provides User Profile & Candidate Pool| MM[Matchmaking Engine (js/matchmaker.js)]:::engine
    MM -->|Outputs Scored & Ranked Swaps| Marketplace[Marketplace UI View]:::client
    
    Marketplace -->|Initiates Booking| SM[Session Manager (js/sessions.js)]:::engine
    SM -->|Two-Way Confirmation A + B| Ledger[Double-Entry Ledger Engine (js/ledger.js)]:::ledger
    SM -->|Disputed Session Escalation| AdminDesk[Admin Arbitration Portal (js/admin.js)]:::admin
    
    AdminDesk -->|Mediated Settlement Resolution| Ledger
    AdminDesk -->|Approves KYC Application| Ledger
    
    User -->|Submits Cashout Request| Payout[Payout Engine (js/payouts.js)]:::engine
    Payout -->|Reserves Credits Debit| Ledger
```

---

## 📂 Project Structure

```bash
SKILL-BADLU/
├── assets/                  # High-resolution media and UI images
│   └── images/
│       ├── hero.jpg
│       ├── gold_coins.jpg
│       └── skill_badlu_ui_screenshot.jpg
├── css/
│   └── styles.css           # Vanilla CSS Design System with dark mode & variables
├── js/
│   ├── app.js               # Main application orchestration & UI controller
│   ├── store.js             # In-memory reactive state store & event bus
│   ├── ledger.js            # Double-entry transaction ledger & balance calculation
│   ├── matchmaker.js        # Multi-factor matchmaking & barter ranking algorithm
│   ├── sessions.js          # Dual-consensus session state machine
│   ├── payouts.js           # Distributed Saga pattern payout processor
│   └── admin.js             # Admin workspace (KYC moderation, disputes, system stats)
├── docs/                    # Deep-dive architecture specifications & runbooks
│   ├── SKILL_BADLU_COMPREHENSIVE_SPECIFICATION.md
│   ├── architecture/
│   │   ├── system-design.md
│   │   └── ALGORITHMS_AND_FLOWCHARTS.md
│   ├── adr/
│   │   └── 0001-firebase-auth-fastapi-postgresql.md
│   └── runbooks/
│       └── token-revocation-runbook.md
├── scripts/                 # Security, token revocation & isolation verification
│   ├── check_ids.py
│   ├── revoke_user_tokens.py
│   └── verify_isolation.py
├── index.html               # Main Swapper application portal & marketplace
├── login.html               # Authentication & role-selection gateway
├── admin.html               # Secure Administrative & Arbitration console
├── DOCUMENTATION.md         # Exhaustive mathematical & algorithmic manual
└── README.md                # Project README
```

---

## ⚡ Quick Start

Skill Badlu has **zero external package dependencies** for frontend runtime, meaning it runs directly in any modern browser!

### 1. Clone the Repository
```bash
git clone https://github.com/SATYENDRA-Null/SKILL-BADLU.git
cd SKILL-BADLU
```

### 2. Run with Any Local HTTP Server
You can launch a local development server using Python, Node.js, or any static file server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000
```

**Using Node / npx (optional):**
```bash
npx serve .
```

### 3. Open in Browser
- **Main App & Marketplace:** [http://localhost:8000/index.html](http://localhost:8000/index.html)
- **Login / Role Selector:** [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **Admin & Arbitration Portal:** [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

---

## 🧪 Verification & Security Scripts

The `scripts/` directory contains automated test and verification suites written in Python:

```bash
# Verify UI and DOM Role-Based Isolation Integrity
python scripts/verify_isolation.py

# Verify Token Revocation and Security Controls
python scripts/revoke_user_tokens.py

# Verify DOM Element IDs and Link Integrity
python scripts/check_ids.py
```

---

## 📚 In-Depth Documentation

For complete mathematical formulations, state machine transition tables, and sequence diagrams, refer to:
- 📑 [Comprehensive Technical Manual (DOCUMENTATION.md)](./DOCUMENTATION.md)
- 📐 [Algorithms & Flowcharts Specification](./docs/architecture/ALGORITHMS_AND_FLOWCHARTS.md)
- 🏗️ [Full System Design Specification](./docs/architecture/system-design.md)
- 🔐 [Architecture Decision Records (ADRs)](./docs/adr/0001-firebase-auth-fastapi-postgresql.md)

---

## 👨‍💻 Author & Contributions

- **Repository:** [SATYENDRA-Null/SKILL-BADLU](https://github.com/SATYENDRA-Null/SKILL-BADLU)
- **Engineered by:** Satyendra Yadav ([satyendra.y@somaiya.edu](mailto:satyendra.y@somaiya.edu))
- **Status:** Production-Ready Barter Economy Engine v4.4.0
