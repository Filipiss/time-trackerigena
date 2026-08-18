from flask import Blueprint
from controllers.auth_controller import activate, forgot_password, login, me, register, reset_password

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

auth_bp.route("/register", methods=["POST"])(register)
auth_bp.route("/activate", methods=["GET"])(activate)
auth_bp.route("/login", methods=["POST"])(login)
auth_bp.route("/me", methods=["GET"])(me)
auth_bp.route("/forgot-password", methods=["POST"])(forgot_password)
auth_bp.route("/reset-password", methods=["POST"])(reset_password)
