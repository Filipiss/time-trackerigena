import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import dotenv
dotenv.load_dotenv()

from utils.database import engine, get_db_session
from models.user import User

print("DATABASE_URL from env:", os.getenv("DATABASE_URL"))
print("Engine URL resolved:", engine.url)

db = get_db_session()
try:
    users = db.query(User).all()
    for u in users:
        print(f"User: {u.username}, Email: {u.email}, Admin: {u.is_admin}")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
