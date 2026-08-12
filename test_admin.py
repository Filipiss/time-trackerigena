import json
import urllib.request

# Test login
req = urllib.request.Request(
    'http://localhost:8000/api/auth/login',
    data=json.dumps({"identifier": "fileezy", "password": "changeme"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("LOGIN RESPONSE:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Login fails, going directly to /me if possible or skipping: {e}")

# If we can't login because we don't know the password, we can bypass by creating a valid token locally
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
try:
    from backend.utils.database import get_db_session
    from backend.models.user import User
    
    db = get_db_session()
    u = db.query(User).filter_by(username="fileezy").first()
    print(f"\nDB CHECK: username={u.username}, is_admin={getattr(u, 'is_admin', None)}")
except Exception as e:
    print(f"DB check failed: {e}")
