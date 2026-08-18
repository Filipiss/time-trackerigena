from flask import Blueprint
from controllers.support_controller import (
    create_ticket, get_my_tickets, get_ticket_messages, reply_ticket,
    get_all_tickets_admin, update_ticket_status_admin, delete_ticket_admin
)

support_bp = Blueprint("support", __name__, url_prefix="/api")

# --- User Routes ---
support_bp.route("/support", methods=["POST"])(create_ticket)
support_bp.route("/support", methods=["GET"])(get_my_tickets)
support_bp.route("/support/<int:ticket_id>/messages", methods=["GET"])(get_ticket_messages)
support_bp.route("/support/<int:ticket_id>/messages", methods=["POST"])(reply_ticket)

# --- Admin Routes ---
support_bp.route("/admin/support", methods=["GET"])(get_all_tickets_admin)
support_bp.route("/admin/support/<int:ticket_id>/status", methods=["PUT"])(update_ticket_status_admin)
support_bp.route("/admin/support/<int:ticket_id>", methods=["DELETE"])(delete_ticket_admin)
