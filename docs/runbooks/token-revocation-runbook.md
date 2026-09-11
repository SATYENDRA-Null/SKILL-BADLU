# Token Revocation Runbook: Firebase Auth + FastAPI

**Document ID:** RUNBOOK-AUTH-001  
**Target Audience:** On-Call Engineers, Security Incident Responders, Backend Engineers  
**Severity Scope:** P1 / P2 Security Incidents (Compromised Accounts, Leaked JWTs, Offboarding)  
**Related Architecture Decision:** [ADR 0001: Firebase Auth + FastAPI + PostgreSQL](../adr/0001-firebase-auth-fastapi-postgresql.md)  
**Last Updated:** 2026-09-06

---

## 1. Overview & Objectives

In our architecture, the client stores a 1-hour Firebase ID token (JWT) and uses it as a bearer token for FastAPI API requests. Under normal operation, the backend verifies tokens statelessly using public cryptographic keys.

However, in scenarios where:

- A user's device or credentials are compromised,
- An ID token has been leaked (e.g., via XSS, log exfiltration, or commit leak),
- An employee or privileged user is terminated or suspended,
- Suspicious brute force or credential-stuffing activity is detected,

engineers must execute an immediate **token revocation** to prevent further unauthorized API access before the natural 1-hour JWT expiration window closes.

This runbook outlines:

1. The technical mechanism of Firebase token revocation.
2. Step-by-step incident response procedures.
3. Administrative CLI and API execution options.
4. FastAPI backend configuration requirements (`check_revoked=True`).
5. Post-incident audit and verification steps.

---

## 2. Technical Mechanism & Architecture

### 2.1 The Two Token Classes

Firebase Authentication uses two distinct tokens:

1. **ID Token (JWT):** Short-lived (1 hour). Stored on the client, passed to FastAPI in `Authorization: Bearer <token>`. Contains user claims and the issuance timestamp (`auth_time` / `iat`).
2. **Refresh Token:** Long-lived. Managed securely by the Firebase client SDK. Exchanged silently by the client for new ID tokens without prompting the user.

### 2.2 How `revokeRefreshTokens` Works

When `admin.auth().revoke_refresh_tokens(uid)` is invoked:

1. Firebase updates the user's metadata record with a `validSince` / `tokensValidAfterTime` timestamp (in UTC seconds).
2. The user's long-lived refresh token is invalidated across all devices immediately.
3. The Firebase client SDK can **no longer exchange the refresh token** for new ID tokens.

### 2.3 Critical Backend Implication: `check_revoked=True`

> [!WARNING]
> **Stateless verification does NOT detect revocation by default.**  
> Standard `auth.verify_id_token(token)` only verifies cryptographic signatures and expiry dates locally using Google's cached public certificates.  
> To actively reject an ID token before its 1-hour lifespan expires, FastAPI must call:
>
> ```python
> auth.verify_id_token(token, check_revoked=True)
> ```
>
> When `check_revoked=True` is supplied, the Firebase Admin SDK validates whether the token's issuance timestamp (`iat`) is earlier than the user's `tokensValidAfterTime`. If it was issued prior to the revocation event, the SDK raises `firebase_admin.auth.RevokedIdTokenError`.

```
[ Compromise Detected ]
          |
          v
[ Trigger: auth.revoke_refresh_tokens(uid) ]
          |
          +---> Firebase sets `tokensValidAfterTime = now()`
          +---> Refresh tokens invalidated on all client devices
          |
[ Incoming Request with Leaked ID Token ]
          |
          v
[ FastAPI Dependency: verify_id_token(token, check_revoked=True) ]
          |
          +---> Checks token iat < tokensValidAfterTime
          v
[ RevokedIdTokenError Raised ] ---> HTTP 401 Unauthorized (Access Denied)
```

---

## 3. Incident Response Procedures (Step-by-Step)

### Phase 1: Identification & Triage (Time: 0 - 5 Minutes)

1. **Identify the Target Account:**
   - Obtain the user's email address or Firebase `uid`.
   - If only an IP address or log trace is available, query PostgreSQL or access logs to correlate with `users.firebase_uid`.
2. **Determine Severity:**
   - **P1 (Critical):** Compromised Admin / Superuser account or wide credential exposure.
   - **P2 (High):** Standard user reporting device theft, phishing, or leaked session token.
3. **Open Incident Channel:**
   - Post incident identifier in the incident Slack/Teams channel.

---

### Phase 2: Execute Immediate Revocation (Time: 5 - 10 Minutes)

Choose one of the following execution methods based on your access level:

#### Method A: Administrative CLI Script (Recommended)

Run the provided workspace administrative script [`scripts/revoke_user_tokens.py`](../../scripts/revoke_user_tokens.py):

```bash
# Revoke by Firebase UID
python scripts/revoke_user_tokens.py --uid "FIREBASE_UID_HERE"

# OR Revoke by User Email
python scripts/revoke_user_tokens.py --email "target-user@example.com"

# Optional: Also disable the user in Firebase Auth entirely
python scripts/revoke_user_tokens.py --email "target-user@example.com" --disable
```

Expected output:

```text
[INFO] Looking up user by email: target-user@example.com
[SUCCESS] Located user: uid=abc123xyz456, email=target-user@example.com
[INFO] Revoking all refresh tokens for uid=abc123xyz456...
[SUCCESS] Tokens successfully revoked. tokens_valid_after_time: 2026-09-06 07:15:22 UTC
[INFO] Account state: Disabled=False, EmailVerified=True
```

#### Method B: Firebase Web Console

If CLI access is unavailable:

1. Log in to the [Firebase Console](https://console.firebase.google.com/).
2. Select the project environment (`production` or `staging`).
3. Navigate to **Authentication** > **Users**.
4. Search for the user by email or UID.
5. Click the three dots `...` next to the user row:
   - Click **Reset password** (triggers revocation upon password update).
   - If immediate lockout is required, click **Disable account**.

#### Method C: Direct Python Interactive Shell / One-Liner

If on a production container or bastion host:

```bash
python -c '
import firebase_admin
from firebase_admin import auth

firebase_admin.initialize_app()
user = auth.get_user_by_email("target-user@example.com")
auth.revoke_refresh_tokens(user.uid)
print(f"Revoked tokens for {user.uid}. Valid after: {auth.get_user(user.uid).tokens_valid_after_time}")
'
```

---

### Phase 3: Database & Local Session Cleanup (Time: 10 - 15 Minutes)

Firebase revocation stops future token issuance and bearer token validation in FastAPI. However, active state in PostgreSQL must also be addressed:

1. **Disable User in PostgreSQL:**

   ```sql
   -- Connect to production PostgreSQL database
   UPDATE users
   SET is_active = FALSE,
       updated_at = NOW()
   WHERE firebase_uid = 'FIREBASE_UID_HERE';
   ```

2. **Purge Cached Permissions / Application Sessions:**
   If using Redis or memory caching for user roles or permissions:
   ```bash
   # Invalidate cached user permission keys in Redis
   redis-cli DEL "cache:user:FIREBASE_UID_HERE:permissions"
   redis-cli DEL "cache:user:FIREBASE_UID_HERE:profile"
   ```

---

### Phase 4: User Remediation & Account Recovery (Time: 15 - 30 Minutes)

1. **Trigger Password Reset:**
   Generate and dispatch a password reset link to ensure the compromised password cannot be reused:
   ```bash
   python scripts/revoke_user_tokens.py --email "target-user@example.com" --send-reset-email
   ```
2. **Inspect Activity Logs:**
   - Query FastAPI access logs for requests originating from the `firebase_uid` during the suspected breach window.
   - Verify if unauthorized resources or data were created, modified, or exported.
3. **Re-enabling the User:**
   Once credentials have been secured and confirmed with the account owner:
   ```sql
   UPDATE users SET is_active = TRUE WHERE firebase_uid = 'FIREBASE_UID_HERE';
   ```

---

## 4. FastAPI Backend Implementation Pattern

To guarantee that revoked tokens are rejected immediately, FastAPI endpoints must integrate `check_revoked=True` into authentication dependencies.

### 4.1 Recommended Dual-Tier Verification Strategy

Checking revocation with Firebase on every trivial read request introduces an outbound network call (or cache lookup). We recommend a two-tiered model:

- **Tier 1 (High Security / Mutation Endpoints):** `check_revoked=True` is enforced on state-changing operations (`POST`, `PUT`, `DELETE`, `/billing`, `/admin`, `/auth/change-password`).
- **Tier 2 (General Read Endpoints):** Fast stateless verification (`check_revoked=False`) or checking a local revocation cache in Redis/PostgreSQL.

### 4.2 FastAPI Dependency Implementation

```python
# app/auth/dependencies.py
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import firebase_admin
from firebase_admin import auth
from firebase_admin.auth import (
    ExpiredIdTokenError,
    InvalidIdTokenError,
    RevokedIdTokenError,
    UserDisabledError,
)

security = HTTPBearer(auto_error=True)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    check_revoked: bool = False,
) -> dict:
    """
    Validates Firebase JWT.
    Pass check_revoked=True on sensitive / state-modifying endpoints.
    """
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token, check_revoked=check_revoked)
        return decoded_token
    except RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked. Please re-authenticate.",
            headers={"WWW-Authenticate": 'Bearer error="token_revoked"'},
        )
    except UserDisabledError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been disabled.",
        )
    except ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": 'Bearer error="token_expired"'},
        )
    except (InvalidIdTokenError, Exception) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(err)}",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'},
        )

# Explicit dependency for mutation and sensitive endpoints
async def get_current_verified_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    return await get_current_user(credentials=credentials, check_revoked=True)
```

---

## 5. Verification & Testing Checklist

After running the revocation, verify the following:

- [ ] **Verification 1: Old ID Token Rejection**  
      Attempt an API request using the old token. The backend must return:
  ```http
  HTTP/1.1 401 Unauthorized
  WWW-Authenticate: Bearer error="token_revoked"
  {"detail": "Authentication token has been revoked. Please re-authenticate."}
  ```
- [ ] **Verification 2: Refresh Token Failure**  
      Verify the client cannot obtain a new token using the existing refresh token.
- [ ] **Verification 3: Database Status Confirmed**  
      Verify `users.is_active` reflects the desired quarantine status in PostgreSQL.
- [ ] **Verification 4: Audit Trail Logged**  
      Log incident details, timestamp of revocation, ticket number, and engineer name in the security incident log.

---

## 6. Escalation Matrix

| Role                              | Contact                                  | Escalation Condition                                                     |
| :-------------------------------- | :--------------------------------------- | :----------------------------------------------------------------------- |
| **Primary On-Call**               | PagerDuty / Slack `#oncall-backend`      | Initial account compromise or single-user token leak                     |
| **Security Lead**                 | `@security-lead` / `#security-incidents` | Mass credential stuffing, confirmed DB leak, or Admin account compromise |
| **Data Protection Officer (DPO)** | `privacy@company.com`                    | Confirmed PII or sensitive customer data exfiltration                    |
