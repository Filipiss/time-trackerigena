import threading
import uuid
from datetime import datetime, timedelta

import bcrypt

from models.user import User
from repositories.user_repository import UserRepository
from utils.password import validate_password_strength


class AuthService:
    def __init__(self, db=None):
        self.repo = UserRepository(db)

    def register(self, username: str, email: str, password: str, app=None) -> dict:
        """Registra novo usuário. Retorna dict com 'user' ou lança exceção."""
        # Valida força da senha
        pwd_errors = validate_password_strength(password)
        if pwd_errors:
            raise ValueError(f"Senha inválida: {'; '.join(pwd_errors)}")

        # Verifica duplicatas
        if self.repo.find_by_email(email):
            raise ValueError("Este e-mail já está cadastrado")
        if self.repo.find_by_username(username):
            raise ValueError("Este username já está em uso")

        # Hash da senha
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Gera token de ativação
        token = User.generate_activation_token()

        # Cria usuário já ativo para permitir login imediato
        user = self.repo.create(
            username=username,
            email=email,
            password_hash=password_hash,
            activation_token=token,
            is_active=True,
        )

        # Dispara e-mail em background (não bloqueia a resposta)
        if app:
            from utils.mail import send_activation_email
            thread = threading.Thread(
                target=send_activation_email,
                args=(app, user.email, user.username, token),
                daemon=True,
            )
            thread.start()

        return {"user": user, "activation_token": token}

    def activate(self, token: str) -> User:
        """Ativa conta via token. Retorna o usuário ativado."""
        user = self.repo.find_by_activation_token(token)
        if not user:
            raise ValueError("Token de ativação inválido ou já utilizado")
        if user.is_active:
            raise ValueError("Conta já está ativa")
        user = self.repo.update(user, is_active=True, activation_token=None)
        return user

    def login(self, identifier: str, password: str) -> User:
        """Autentica usuário por e-mail ou username. Retorna o User ou lança exceção."""
        if "@" in identifier:
            user = self.repo.find_by_email(identifier)
        else:
            user = self.repo.find_by_username(identifier)

        if not user:
            raise ValueError("Credenciais inválidas")
        if not user.is_active:
            raise ValueError("Conta não ativada. Verifique seu e-mail")

        password_ok = bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
        if not password_ok:
            raise ValueError("Credenciais inválidas")

        return user

    def change_password(self, user_id: int, current_password: str, new_password: str) -> User:
        """Troca a senha do usuário autenticado."""
        user = self.repo.find_by_id(user_id)
        if not user:
            raise ValueError("Usuário não encontrado")

        if not bcrypt.checkpw(current_password.encode("utf-8"), user.password_hash.encode("utf-8")):
            raise ValueError("Senha atual incorreta")

        pwd_errors = validate_password_strength(new_password)
        if pwd_errors:
            raise ValueError(f"Senha inválida: {'; '.join(pwd_errors)}")

        new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        return self.repo.update(user, password_hash=new_hash)

    def request_password_reset(self, identifier: str, app=None) -> None:
        """Gera token de reset e envia email. Silencioso se usuário não encontrado (segurança)."""
        if "@" in identifier:
            user = self.repo.find_by_email(identifier)
        else:
            user = self.repo.find_by_username(identifier)

        if not user or not user.is_active:
            return  # não revela se o usuário existe

        token = str(uuid.uuid4())
        expires = datetime.utcnow() + timedelta(hours=1)
        self.repo.update(user, reset_token=token, reset_token_expires=expires)

        if app:
            from utils.mail import send_reset_password_email
            thread = threading.Thread(
                target=send_reset_password_email,
                args=(app, user.email, user.username, token),
                daemon=True,
            )
            thread.start()

    def reset_password(self, token: str, new_password: str) -> User:
        """Valida token de reset e salva nova senha."""
        user = self.repo.find_by_reset_token(token)
        if not user:
            raise ValueError("Token inválido ou já utilizado")
        if not user.reset_token_expires or datetime.utcnow() > user.reset_token_expires:
            raise ValueError("Token expirado. Solicite um novo link.")

        pwd_errors = validate_password_strength(new_password)
        if pwd_errors:
            raise ValueError(f"Senha inválida: {'; '.join(pwd_errors)}")

        new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        return self.repo.update(user, password_hash=new_hash, reset_token=None, reset_token_expires=None)

    def close(self):
        self.repo.close()
