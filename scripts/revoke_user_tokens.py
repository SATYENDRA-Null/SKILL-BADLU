#!/usr/bin/env python3
"""
Emergency Token Revocation and User Quarantine CLI Script
Part of the Firebase Auth + FastAPI incident response tooling.
Reference: docs/runbooks/token-revocation-runbook.md
"""

import argparse
import datetime
import os
import sys



def get_firebase():
    """Lazily import and return firebase_admin modules."""
    try:
        import firebase_admin
        from firebase_admin import auth, credentials
        return firebase_admin, auth, credentials
    except ImportError:
        print(
            "[ERROR] firebase-admin package is not installed.\n"
            "Install it using: pip install firebase-admin",
            file=sys.stderr,
        )
        sys.exit(1)


def init_firebase(cred_path: str = None):
    """Initialize Firebase Admin SDK if not already initialized."""
    firebase_admin, auth, credentials = get_firebase()
    if firebase_admin._apps:
        return auth

    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        firebase_admin.initialize_app()
    else:
        # Fallback to default application credentials
        try:
            firebase_admin.initialize_app()
        except Exception as e:
            print(
                f"[ERROR] Failed to initialize Firebase Admin SDK: {e}\n"
                "Please specify --credentials or set GOOGLE_APPLICATION_CREDENTIALS.",
                file=sys.stderr,
            )
            sys.exit(1)
    return auth



def format_timestamp(ts: int | float | None) -> str:
    """Convert Unix timestamp (seconds or ms) to readable UTC string."""
    if not ts:
        return "Never / Not Set"
    # Firebase tokens_valid_after_time is in milliseconds
    if ts > 1e11:
        ts = ts / 1000.0
    dt = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M:%S UTC")


def get_user_record(auth_module, uid: str = None, email: str = None):
    """Retrieve Firebase user by UID or Email."""
    if uid:
        print(f"[INFO] Looking up user by UID: {uid}")
        return auth_module.get_user(uid)
    elif email:
        print(f"[INFO] Looking up user by Email: {email}")
        return auth_module.get_user_by_email(email)
    else:
        raise ValueError("Either --uid or --email must be specified.")


def main():
    parser = argparse.ArgumentParser(
        description="Firebase Token Revocation and Incident Response Utility."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--uid", help="Firebase User ID (UID)")
    group.add_argument("--email", help="User Email Address")

    parser.add_argument(
        "--credentials",
        help="Path to Firebase Service Account JSON credentials file",
        default=os.getenv("FIREBASE_CREDENTIALS_PATH"),
    )
    parser.add_argument(
        "--status-only",
        action="store_true",
        help="Inspect account and token status without modifying anything",
    )
    parser.add_argument(
        "--disable",
        action="store_true",
        help="Disable the account in Firebase Auth to prevent new logins",
    )
    parser.add_argument(
        "--enable",
        action="store_true",
        help="Re-enable a previously disabled account",
    )
    parser.add_argument(
        "--generate-reset-link",
        action="store_true",
        help="Generate a secure password reset link for the user",
    )

    args = parser.parse_args()

    auth = init_firebase(args.credentials)

    try:
        user = get_user_record(auth, uid=args.uid, email=args.email)
    except auth.UserNotFoundError:
        print("[ERROR] Target user not found in Firebase Authentication.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Failed to query user: {e}", file=sys.stderr)
        sys.exit(1)

    print("-" * 60)
    print(f"UID:                  {user.uid}")
    print(f"Email:                {user.email}")
    print(f"Display Name:         {user.display_name or 'N/A'}")
    print(f"Disabled:             {user.disabled}")
    print(f"Email Verified:       {user.email_verified}")
    print(f"Tokens Valid After:   {format_timestamp(user.tokens_valid_after_time)}")
    print("-" * 60)

    if args.status_only:
        print("[INFO] Status-only mode requested. No actions taken.")
        return

    # 1. Revoke Refresh Tokens
    print(f"[ACTION] Revoking all refresh tokens for UID: {user.uid}...")
    try:
        auth.revoke_refresh_tokens(user.uid)
        print("[SUCCESS] Refresh tokens revoked successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to revoke refresh tokens: {e}", file=sys.stderr)
        sys.exit(1)

    # 2. Disable or Enable account if requested
    if args.disable:
        print(f"[ACTION] Disabling user account: {user.uid}...")
        auth.update_user(user.uid, disabled=True)
        print("[SUCCESS] Account disabled in Firebase Auth.")
    elif args.enable:
        print(f"[ACTION] Enabling user account: {user.uid}...")
        auth.update_user(user.uid, disabled=False)
        print("[SUCCESS] Account enabled in Firebase Auth.")

    # 3. Generate password reset link if requested
    if args.generate_reset_link:
        if user.email:
            print(f"[ACTION] Generating password reset link for {user.email}...")
            link = auth.generate_password_reset_link(user.email)
            print(f"[SUCCESS] Password Reset URL:\n{link}")
        else:
            print("[WARN] Cannot generate password reset link: user has no registered email.")

    # Re-fetch user to display updated timestamp
    updated_user = auth.get_user(user.uid)
    print("\n" + "=" * 60)
    print("[FINAL STATUS]")
    print(f"UID:                  {updated_user.uid}")
    print(f"Disabled:             {updated_user.disabled}")
    print(f"Tokens Valid After:   {format_timestamp(updated_user.tokens_valid_after_time)}")
    print("=" * 60)
    print(
        "\n[NEXT STEPS]\n"
        "1. Update PostgreSQL user table: UPDATE users SET is_active = FALSE WHERE firebase_uid = :uid\n"
        "2. Invalidate any local Redis / in-memory permission caches.\n"
        "3. Verify old bearer token is rejected with HTTP 401 on endpoints checking revocation.\n"
    )


if __name__ == "__main__":
    main()
