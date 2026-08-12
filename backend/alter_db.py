from sqlalchemy import text
from utils.database import engine

def apply_migration():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;"))
            print("Migration successful: added is_admin column")
    except Exception as e:
        print(f"Error (maybe column already exists): {e}")

if __name__ == "__main__":
    apply_migration()
