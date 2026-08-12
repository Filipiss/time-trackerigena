from sqlalchemy import text
from utils.database import engine

with engine.begin() as conn:
    conn.execute(text("UPDATE users SET is_admin = 1 WHERE username = 'fileezy'"))

with engine.connect() as conn:
    res = conn.execute(text("SELECT username, is_admin FROM users WHERE username = 'fileezy'")).fetchall()
    print("RECHECK:", res)
