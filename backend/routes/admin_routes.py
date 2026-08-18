from flask import Blueprint
from controllers.admin_controller import get_all_users, toggle_admin_role, delete_user, get_metrics, update_user_profile, create_user_admin, get_audit_logs

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

admin_bp.route("/users", methods=["GET"])(get_all_users)
admin_bp.route("/users", methods=["POST"])(create_user_admin)
admin_bp.route("/users/<int:user_id>", methods=["PUT"])(update_user_profile)
admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])(toggle_admin_role)
admin_bp.route("/users/<int:user_id>", methods=["DELETE"])(delete_user)
admin_bp.route("/metrics", methods=["GET"])(get_metrics)
admin_bp.route("/logs", methods=["GET"])(get_audit_logs)
