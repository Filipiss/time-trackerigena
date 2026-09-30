import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from utils.database import Base


class User(Base):
    """Modelo de usuário do sistema."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    full_name = Column(String(150), nullable=True)
    country = Column(String(100), nullable=True)
    avatar_url = Column(Text, nullable=True)

    is_active = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    activation_token = Column(String(100), nullable=True)

    reset_token = Column(String(100), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    phone = Column(String(30), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', active={self.is_active})>"

    @staticmethod
    def generate_activation_token() -> str:
        return str(uuid.uuid4())
