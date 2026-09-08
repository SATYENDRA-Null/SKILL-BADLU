# 1. Firebase Auth + FastAPI + PostgreSQL Architecture Decision

**Status:** Accepted  
**Date:** 2026-09-06  
**Deciders:** Backend Lead, Frontend Lead  
**Technical Area:** Authentication & Authorization  

---

## 1. Overview

This document describes the login and authentication architecture for the application and records the decision to use Firebase-issued JSON Web Tokens (JWTs) verified per request by the FastAPI backend, rather than a traditional server-managed session and cookie model.

---

## 2. Current Workflow

```
[ Frontend (Browser) ]
       |
       | 1. signInWithEmailAndPassword(auth, email, password)
       v
[ Firebase Auth ] --------------------------+
       |                                    |
       | 2. Validates credentials           |
       v                                    |
  Signs ID Token (JWT, 1h expiry)           |
       |                                    |
       v                                    |
[ Frontend (Browser) ]                      |
       |  Stores token in localStorage      |
       |                                    |
       | 3. API Request: Authorization: Bearer <token>
       v                                    |
[ FastAPI Backend ]                         |
       |                                    |
       | 4. verify_id_token(token) ---------+ (Public key / revocation verification)
       v
  Extracts `uid` claim
       |
       | 5. Query WHERE user_id = :uid
       v
[ PostgreSQL Database ]
       |
       | 6. Returns user data / resources
       v
[ FastAPI Backend ]
       |
       | 7. 200 OK (JSON Response)
       v
[ Frontend (Browser) ]
```

### 2.1 Login and Token Issuance
1. **Credential Submission:** The user submits their email and password into the frontend login form.
2. **Direct Authentication:** The frontend calls `signInWithEmailAndPassword(auth, email, password)`. Credentials are sent directly from the client browser to Firebase Authentication over TLS; credentials **never touch our application backend**.
3. **Validation & Issuance:**
   - **Invalid:** An error code/message is returned to the client and presented to the user. No token is issued.
   - **Valid:** Firebase signs a cryptographically secure ID Token (JWT) with a 1-hour lifespan and returns it to the frontend client alongside a long-lived refresh token managed by the Firebase SDK.
4. **Client-Side Persistence:** The frontend stores the ID Token in `localStorage` or `sessionStorage` for subsequent API dispatch.

### 2.2 Authenticated API Requests
1. **Bearer Attachment:** On every request to protected FastAPI endpoints, the frontend client attaches the ID token in the standard HTTP header:
   ```http
   Authorization: Bearer <token>
   ```
2. **Token Verification:**
   - FastAPI intercepts the request via a dependency (`Depends(get_current_user)`).
   - The token is verified using the Firebase Admin SDK (`firebase_admin.auth.verify_id_token`).
   - If invalid, expired, or tampered with: FastAPI returns `401 Unauthorized` (`WWW-Authenticate: Bearer error="invalid_token"`), and the frontend redirects the user to the login screen or initiates a silent token refresh.
   - If valid: FastAPI extracts the claims payload, specifically the unique `uid` (Firebase User ID).
3. **Database Scoping:** The backend queries PostgreSQL for requested resources, always scoping by the authenticated `uid` (`WHERE user_id = :uid`).
4. **Response:** FastAPI serializes the response into JSON; the frontend consumes the payload and updates the UI.

**Key Property:** The backend is completely stateless with respect to authentication. It does not maintain a server-side session table, in-memory session cache, or sticky load balancer sessions. It validates self-contained cryptographic tokens on every request.

---

## 3. ADR: JWT-Based Auth (Firebase) vs. Server-Side Session Cookies

### Context
The system requires secure authentication across a client-side JavaScript Single-Page Application (SPA) and a Python FastAPI REST/GraphQL backend, with persistent user records and relational business data stored in PostgreSQL.

Two primary architectural patterns were considered:
1. **Stateless Bearer Token (Option A):** The client obtains an ID token from an external identity provider (Firebase) and sends it as an `Authorization: Bearer` header on each request. The backend verifies signature and claims per request.
2. **Stateful Session Cookie (Option B):** The client authenticates against our backend, which generates an opaque session ID, persists it in a central data store (Redis/PostgreSQL), and sets a signed `httpOnly`, `Secure`, `SameSite` cookie in the browser.

---

### Options Evaluated

#### Option A: Firebase JWT Bearer Token (Current & Selected)

| Dimension | Assessment |
| :--- | :--- |
| **Complexity** | **Low** — Firebase handles credential management, rotation, password hashing, and OAuth; Admin SDK handles token verification. |
| **Cost** | **Low** — Free tier covers up to 50k MAUs; no session store (Redis cluster) infrastructure or maintenance cost. |
| **Scalability** | **High** — Backend is stateless. Any FastAPI instance behind a load balancer can independently verify any token. |
| **Team Familiarity** | **High** — Pre-existing implementation and experience with Firebase client SDKs. |

##### Pros
- **Stateless Verification:** Backend instances require zero inter-node communication or shared session databases to authenticate incoming traffic.
- **Zero Credential Custody:** Passwords, hash algorithms (scrypt), salt generation, email verification, password reset flows, MFA, and social logins (Google, Apple, GitHub) are fully managed by Google Cloud/Firebase security infrastructure.
- **Natural Microservice Readiness:** Additional downstream services can independently verify the same Firebase token using Google's public keys without querying a centralized session service.
- **Short Token Lifetime:** The 1-hour token expiration limits the blast radius of an intercepted or leaked token.

##### Cons
- **XSS Exposure:** Because the token is stored in browser storage (`localStorage` / `sessionStorage`), any Cross-Site Scripting (XSS) vulnerability allows malicious scripts to extract the token.
- **Revocation Complexity:** Revoking a token before its natural 1-hour expiration requires querying Firebase's revocation endpoint (`check_revoked=True`), which introduces an external network roundtrip or requires caching revocation timestamps.
- **Vendor Coupling:** Authentication and identity management are coupled to Firebase Authentication APIs.

---

#### Option B: Server-Side Session + httpOnly Cookie

| Dimension | Assessment |
| :--- | :--- |
| **Complexity** | **Medium to High** — Requires custom session lifecycle management, Redis cluster operations, CSRF mitigation tokens, and session purge jobs. |
| **Cost** | **Medium** — Requires provisioning, monitoring, and backing up dedicated session storage (Redis / PostgreSQL). |
| **Scalability** | **Medium** — Introduces a single point of failure (session cache) and network I/O per API request to look up session keys. |
| **Team Familiarity** | **Lower** — Would require building session middleware, CSRF protections, and session invalidation flows from scratch in FastAPI. |

##### Pros
- **XSS Immunity for Token Theft:** Cookies configured with `httpOnly` cannot be read or exfiltrated by JavaScript, significantly reducing the severity of XSS vulnerabilities.
- **Immediate Server-Side Revocation:** Deleting a session key from the session store terminates the user's session instantaneously across all devices.
- **No Third-Party Token Dependency:** The backend controls session lifetimes, serialization, and renewal logic completely in-house.

##### Cons
- **Operational Burden:** Adds an infrastructure dependency (high-availability Redis cluster) that must be scaled, monitored, and kept fail-safe.
- **CSRF Risk:** Browsers send cookies automatically with cross-site requests, necessitating robust CSRF token generation, header verification, and SameSite configuration.
- **Stateful Bottleneck:** Horizontally scaling the backend requires high-throughput session lookups, which adds 1–3 ms latency to every incoming request.

---

### Trade-off Analysis & Rationale

The primary tension is between **architectural simplicity / stateless scalability (Option A)** and **XSS token-theft defense / instant revocation (Option B)**.

Given that:
1. Firebase already handles credential validation, enterprise-grade password protection, and automated token rotation securely.
2. The engineering overhead of operating an HA Redis session tier is currently unjustified.
3. The XSS risk of `localStorage` can be effectively mitigated through strict browser security policies (Content-Security-Policy headers, trusted types, output encoding).
4. Immediate revocation can still be enforced when necessary using Firebase's `revoke_refresh_tokens` API and `check_revoked=True` checks on sensitive operations.

The decision is to **retain Option A (Firebase JWT Bearer Token)**.

---

## 4. Consequences

### Positive Consequences (Easier)
- **Horizontal Scaling:** Backend instances can be added or removed without session synchronization or cache warming.
- **Ops Simplicity:** No session store infrastructure to maintain, monitor, backup, or scale under load spikes.
- **Developer Velocity:** Identity flows (social login, password reset, account verification) are handled out-of-the-box by Firebase SDKs.

### Negative Consequences & Risks (Harder)
- **XSS is Critical:** XSS vulnerabilities directly threaten authentication credentials. Mitigations (CSP, sanitization) are non-negotiable prerequisites.
- **Revocation Latency:** Standard `verify_id_token` does not query Firebase for revocation unless explicitly instructed via `check_revoked=True`.
- **Vendor Lock-in:** Migrating away from Firebase in the future would require exporting user records (password hashes require Firebase CLI tools) and rewriting client auth logic.

### Revisit Triggers
This decision must be formally re-evaluated if:
1. The application experiences a verified XSS incident that compromises user tokens.
2. Compliance requirements (e.g., FedRAMP, HIPAA, PCI-DSS Level 1) mandate server-side session termination within seconds of administrative action.
3. Pricing or licensing changes make Firebase Auth economically unviable.

---

## 5. Action Items & Implementation Roadmap

- [ ] **Action 1: Content Security Policy (CSP)**  
  Implement strict Content-Security-Policy HTTP headers (`default-src 'self'`, restricting script sources, disallowing `unsafe-inline` and `eval`) to harden the frontend against XSS-based token exfiltration.
- [ ] **Action 2: PostgreSQL UID Indexing**  
  Ensure an explicit unique B-Tree index exists on `users(firebase_uid)` or declare `firebase_uid VARCHAR(128) PRIMARY KEY` to optimize query performance on every authenticated request.
- [ ] **Action 3: Frontend Silent Token Refresh**  
  Implement `onIdTokenChanged` / `getIdToken(true)` listeners in the frontend authentication provider to automatically renew the JWT prior to its 1-hour expiration.
- [x] **Action 4: Token Revocation Runbook & Administrative Tooling**  
  Document operational runbooks and implement Python CLI tooling for emergency account invalidation via Firebase Admin's `revoke_refresh_tokens`.  
  👉 **Reference Document:** [Token Revocation Runbook](../runbooks/token-revocation-runbook.md)
