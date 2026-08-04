from flask import request
from marshmallow import ValidationError
from utils.database import get_db_session
from utils.responses import success_response, error_response
from services.time_entry_service import TimeEntryService
from schemas.time_entry_schema import TimeEntrySchema, StatsResponseSchema
from routes.time_entry_routes import time_entry_bp

time_entry_schema = TimeEntrySchema()
time_entries_schema = TimeEntrySchema(many=True)
stats_response_schema = StatsResponseSchema()

@time_entry_bp.route("/", methods=["GET"])
def list_time_entries():
    task_id = request.args.get("task_id", type=int)
    category = request.args.get("category")
    limit = request.args.get("limit", default=50, type=int)
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    
    if category and category not in ("Loco", "Freelas"):
        return error_response("Categoria deve ser 'Loco' ou 'Freelas'", 400)
    
    if limit < 1 or limit > 500:
        return error_response("Limite deve estar entre 1 e 500", 422)

    db = get_db_session()
    try:
        entries = TimeEntryService.get_all_entries(db, task_id, category, limit, start_date, end_date)
        return success_response(time_entries_schema.dump(entries))
    finally:
        db.close()

@time_entry_bp.route("/", methods=["POST"])
def create_time_entry():
    try:
        data = time_entry_schema.load(request.json)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        entry = TimeEntryService.create_entry(db, data)
        return success_response(time_entry_schema.dump(entry), 201)
    except ValueError as e:
        return error_response(str(e), 404)
    finally:
        db.close()

@time_entry_bp.route("/stats", methods=["GET"])
def get_stats():
    period = request.args.get("period", "week")
    if period not in ("week", "month", "year", "day", "total"):
        return error_response("Período inválido", 422)
    db = get_db_session()
    try:
        stats = TimeEntryService.get_dashboard_stats(db, period, request.args.get("start_date"), request.args.get("end_date"), request.args.get("category"))
        return success_response(stats_response_schema.dump(stats))
    finally:
        db.close()
