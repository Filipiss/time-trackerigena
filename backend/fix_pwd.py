import psycopg2
from dotenv import load_dotenv
import os
import bcrypt

load_dotenv('.env')
url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(url)
cur = conn.cursor()

new_hash = bcrypt.hashpw(b"123456", bcrypt.gensalt()).decode("utf-8")
cur.execute("UPDATE users SET password_hash = %s WHERE id = 3", (new_hash,))
conn.commit()

print("User ID 3 ('chico') forcefully updated to 123456")
conn.close()
