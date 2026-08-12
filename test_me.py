import json
import urllib.request
import urllib.error

req = urllib.request.Request(
    'http://localhost:8000/api/auth/login',
    data=json.dumps({"identifier": "fileezy", "password": "changeme"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req) as response:
        print(json.loads(response.read().decode())['user'].get('is_admin', None))
except urllib.error.HTTPError as e:
    # Se erro de senha (401), não tem problema, quer dizer que backend ta rodando.
    # Vamos mockar instanciando app do flask.
    pass

import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from backend.utils.database import get_db_session
from backend.models.user import User
from backend.schemas.user_schema import UserPublicSchema

db = get_db_session()
u = db.query(User).filter_by(username='fileezy').first()
schema = UserPublicSchema()
print("DUMP:", schema.dump(u))
