"""
One-time migration: rename @stockpilot.com → @abibas.com for all seed users.
Run with: uv run python -m app.db.migrate_emails
"""
from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User

RENAMES = {
    "admin@stockpilot.com":       "admin@abibas.com",
    "operator@stockpilot.com":    "operator@abibas.com",
    "procurement@stockpilot.com": "procurement@abibas.com",
    "qc@stockpilot.com":          "qc@abibas.com",
    "manager@stockpilot.com":     "manager@abibas.com",
}

def migrate():
    with Session(engine) as s:
        updated = 0
        for old_email, new_email in RENAMES.items():
            user = s.exec(select(User).where(User.email == old_email)).first()
            if user:
                user.email = new_email
                s.add(user)
                updated += 1
                print(f"  {old_email} -> {new_email}")
            else:
                print(f"  skipped (not found): {old_email}")
        s.commit()
        print(f"\nDone — {updated} email(s) updated.")

if __name__ == "__main__":
    migrate()
