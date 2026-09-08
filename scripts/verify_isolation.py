with open('admin.html', encoding='utf-8') as f:
    admin_content = f.read()
with open('index.html', encoding='utf-8') as f:
    index_content = f.read()

checks = [
    ('admin.html does NOT have tab-marketplace', 'tab-marketplace' not in admin_content),
    ('admin.html does NOT have tab-matchmaker', 'tab-matchmaker' not in admin_content),
    ('admin.html does NOT have tab-sessions', 'tab-sessions' not in admin_content),
    ('admin.html does NOT have tab-payouts', 'tab-payouts' not in admin_content),
    ('admin.html does NOT have MARKETPLACE button', 'MARKETPLACE' not in admin_content),
    ('admin.html does NOT have AI MATCHMAKER', 'AI MATCHMAKER' not in admin_content),
    ('admin.html does NOT have CASHOUT (FIAT)', 'CASHOUT (FIAT)' not in admin_content),
    ('admin.html does NOT have BALANCE: 0 CR', 'BALANCE:' not in admin_content),
    ('admin.html has ADMIN DESK', 'ADMIN DESK' in admin_content),
    ('admin.html has USER KYC QUEUE', 'USER KYC QUEUE' in admin_content),
    ('admin.html has DISPUTE ARBITRATION', 'DISPUTE ARBITRATION' in admin_content),
    ('admin.html has LEDGER AUDIT', 'LEDGER AUDIT' in admin_content),
    ('admin.html does NOT have LEDGER: VERIFIED badge', 'LEDGER: VERIFIED' not in admin_content and 'ledger-verified-badge' not in admin_content),
    ('index.html does NOT have tab-admin', 'tab-admin' not in index_content),
    ('index.html does NOT have header-integrity-badge', 'header-integrity-badge' not in index_content),
]
for desc, ok in checks:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {desc}")
