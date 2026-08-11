from flask import current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from marshmallow import ValidationError

from schemas.user_schema import (
    ChangePasswordSchema,
    ForgotPasswordSchema,
    LoginSchema,
    ProfileUpdateSchema,
    RegisterSchema,
    ResetPasswordSchema,
    UserPublicSchema,
)
from services.auth_service import AuthService
from services.user_service import UserService
from utils.database import get_db_session

register_schema = RegisterSchema()
login_schema = LoginSchema()
forgot_password_schema = ForgotPasswordSchema()
reset_password_schema = ResetPasswordSchema()
profile_update_schema = ProfileUpdateSchema()
change_password_schema = ChangePasswordSchema()
user_public_schema = UserPublicSchema()


def register():
    """POST /api/auth/register"""
    data = request.get_json() or {}
    try:
        validated = register_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 422

    db = get_db_session()
    service = AuthService(db)
    try:
        result = service.register(
            username=validated["username"],
            email=validated["email"],
            password=validated["password"],
            app=current_app._get_current_object(),
        )
        return jsonify({
            "message": "Cadastro realizado! Verifique seu e-mail para ativar a conta.",
            "username": result["user"].username,
        }), 201
    except ValueError as err:
        return jsonify({"error": str(err)}), 409
    finally:
        service.close()


def activate():
    """GET /api/auth/activate?token=..."""
    token = request.args.get("token", "")
    if not token:
        return jsonify({"error": "Token não informado"}), 400

    db = get_db_session()
    service = AuthService(db)
    try:
        service.activate(token)
        return jsonify({"message": "Conta ativada com sucesso! Você já pode fazer login."}), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    finally:
        service.close()


def login():
    """POST /api/auth/login"""
    data = request.get_json() or {}
    try:
        validated = login_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 422

    db = get_db_session()
    service = AuthService(db)
    try:
        user = service.login(validated["identifier"], validated["password"])
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token,
            "user": user_public_schema.dump(user),
        }), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 401
    finally:
        service.close()


def forgot_password():
    """POST /api/auth/forgot-password"""
    data = request.get_json() or {}
    try:
        validated = forgot_password_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 422

    db = get_db_session()
    service = AuthService(db)
    try:
        service.request_password_reset(
            identifier=validated["identifier"],
            app=current_app._get_current_object(),
        )
        # Resposta genérica para não revelar se o usuário existe
        return jsonify({"message": "Se o e-mail/usuário existir, um link de recuperação foi enviado."}), 200
    finally:
        service.close()


def reset_password():
    """POST /api/auth/reset-password"""
    data = request.get_json() or {}
    try:
        validated = reset_password_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 422

    db = get_db_session()
    service = AuthService(db)
    try:
        service.reset_password(validated["token"], validated["new_password"])
        return jsonify({"message": "Senha redefinida com sucesso! Você já pode fazer login."}), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    finally:
        service.close()


@jwt_required()
def me():
    """GET /api/auth/me"""
    user_id = int(get_jwt_identity())
    db = get_db_session()
    service = UserService(db)
    try:
        user = service.get_profile(user_id)
        return jsonify(user_public_schema.dump(user)), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 404
    finally:
        service.close()


@jwt_required()
def get_profile():
    """GET /api/users/profile"""
    user_id = int(get_jwt_identity())
    db = get_db_session()
    service = UserService(db)
    try:
        user = service.get_profile(user_id)
        return jsonify(user_public_schema.dump(user)), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 404
    finally:
        service.close()


@jwt_required()
def update_profile():
    """PUT /api/users/profile"""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    try:
        validated = profile_update_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 422

    db = get_db_session()
    service = UserService(db)
    try:
        user = service.update_profile(user_id, **validated)
        return jsonify(user_public_schema.dump(user)), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 404
    finally:
        service.close()


@jwt_required()
def change_password():
    """PUT /api/users/change-password"""
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    try:
        validated = change_password_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 422

    db = get_db_session()
    service = AuthService(db)
    try:
        service.change_password(user_id, validated["current_password"], validated["new_password"])
        return jsonify({"message": "Senha alterada com sucesso"}), 200
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    finally:
        service.close()
