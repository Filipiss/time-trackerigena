from models.user import User
from utils.database import get_db_session


class UserRepository:
    def __init__(self, db=None):
        self.db = db or get_db_session()

    def find_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email.lower()).first()

    def find_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username.lower()).first()

    def find_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def find_by_activation_token(self, token: str) -> User | None:
        return self.db.query(User).filter(User.activation_token == token).first()

    def find_by_reset_token(self, token: str) -> User | None:
        return self.db.query(User).filter(User.reset_token == token).first()

    def create(self, username: str, email: str, password_hash: str, activation_token: str = None, is_active: bool = True) -> User:
        user = User(
            username=username.lower(),
            email=email.lower(),
            password_hash=password_hash,
            activation_token=activation_token,
            is_active=is_active,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, **fields) -> User:
        for key, value in fields.items():
            if hasattr(user, key):
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def close(self):
        self.db.close()
