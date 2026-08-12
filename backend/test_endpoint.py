import warnings
warnings.filterwarnings('ignore')

from main import create_app
app = create_app()

with app.test_client() as client:
    response = client.post('/api/auth/login', json={
        "identifier": "fileezy",
        "password": "changeme"  # Pode falhar se for a senha errada, mas se retornar 'changeme' como erro, verificamos outro caminho
    })
    
    if response.status_code == 200:
        print("LOGIN RESPONSE:")
        print(response.get_json())
    else:
        # Se a senha estiver incorreta (401), tentamos puxar o dump do schema direto.
        from utils.database import get_db_session
        from models.user import User
        from schemas.user_schema import UserPublicSchema
        db = get_db_session()
        u = db.query(User).filter_by(username='fileezy').first()
        schema = UserPublicSchema()
        print("SCHEMA DUMP:", schema.dump(u))
