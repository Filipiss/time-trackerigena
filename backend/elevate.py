from utils.database import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET is_admin = true WHERE username = 'fileezy'"))
    print("Elevated via VENV SQLAlchemy successfully")
    
    with engine.connect() as conn:
        res = conn.execute(text("SELECT username, is_admin FROM users WHERE username = 'fileezy'")).fetchall()
        print("VERIFICATION:", res)
except Exception as e:
    print("Error:", e)
