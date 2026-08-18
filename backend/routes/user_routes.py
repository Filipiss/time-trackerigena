from flask import Blueprint
from controllers.auth_controller import change_password, get_profile, update_profile

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

user_bp.route("/profile", methods=["GET"])(get_profile)
user_bp.route("/profile", methods=["PUT"])(update_profile)
user_bp.route("/change-password", methods=["PUT"])(change_password)
