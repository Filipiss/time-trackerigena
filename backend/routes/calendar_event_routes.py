from flask import Blueprint
from flask_jwt_extended import jwt_required
from controllers.calendar_event_controller_impl import list_events, create_event, update_event, delete_event

calendar_event_bp = Blueprint('calendar_events', __name__, url_prefix='/api/calendar_events')

@calendar_event_bp.route('/', methods=['GET'])
@jwt_required()
def get_all():
    return list_events()

@calendar_event_bp.route('/', methods=['POST'])
@jwt_required()
def post_event():
    return create_event()

@calendar_event_bp.route('/<int:event_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def put_event(event_id):
    return update_event(event_id)

@calendar_event_bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
def del_event(event_id):
    return delete_event(event_id)
