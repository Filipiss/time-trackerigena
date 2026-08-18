from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from utils.database import get_db_session
from utils.responses import success_response, error_response
from utils.audit_logger import log_action
from services.time_entry_service import TimeEntryService
from services.task_service import TaskService
from services.project_service import ProjectService
from schemas.time_entry_schema import TimeEntrySchema, StatsResponseSchema
from routes.time_entry_routes import time_entry_bp

time_entry_schema = TimeEntrySchema()
time_entries_schema = TimeEntrySchema(many=True)
stats_response_schema = StatsResponseSchema()


@time_entry_bp.route("/", methods=["GET"])
@jwt_required()
def list_time_entries():
    user_id = int(get_jwt_identity())
    task_id = request.args.get("task_id", type=int)
    category = request.args.get("category")
    limit = request.args.get("limit", default=50, type=int)
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if limit < 1 or limit > 500:
        return error_response("Limite deve estar entre 1 e 500", 422)

    db = get_db_session()
    try:
        entries = TimeEntryService.get_all_entries(db, task_id, category, limit, start_date, end_date, user_id=user_id)
        return success_response(time_entries_schema.dump(entries))
    finally:
        db.close()


@time_entry_bp.route("/", methods=["POST"])
@jwt_required()
def create_time_entry():
    user_id = int(get_jwt_identity())
    try:
        data = time_entry_schema.load(request.json)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        # Verifica ownership da task via project
        task = TaskService.get_task(db, data.get("task_id"))
        if not task:
            return error_response("Tarefa não encontrada", 404)
        project = ProjectService.get_project(db, task.project_id)
        if not project or project.user_id != user_id:
            return error_response("Tarefa não encontrada", 404)

        entry = TimeEntryService.create_entry(db, data)
        log_action(db, "CREATE_TIME_ENTRY", "TIME_ENTRY", entry.id, f"Logged session of duration {entry.duration_seconds}s for task '{task.name}'.")
        return success_response(time_entry_schema.dump(entry), 201)
    except ValueError as e:
        return error_response(str(e), 404)
    finally:
        db.close()


@time_entry_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    user_id = int(get_jwt_identity())
    period = request.args.get("period", "week")
    if period not in ("week", "month", "year", "day", "total"):
        return error_response("Período inválido", 422)
    db = get_db_session()
    try:
        stats = TimeEntryService.get_dashboard_stats(
            db, period,
            request.args.get("start_date"),
            request.args.get("end_date"),
            request.args.get("category"),
            user_id=user_id,
        )
        return success_response(stats_response_schema.dump(stats))
    finally:
        db.close()


@time_entry_bp.route("/<int:entry_id>", methods=["DELETE"])
@jwt_required()
def delete_time_entry(entry_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        from models.time_entry import TimeEntry
        from models.task import Task
        entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
        task_name = "unknown"
        if entry:
            t_obj = db.query(Task).filter(Task.id == entry.task_id).first()
            if t_obj:
                task_name = t_obj.name
        success = TimeEntryService.delete_entry(db, entry_id, user_id=user_id)
        if not success:
            return error_response("Registro não encontrado", 404)
        log_action(db, "DELETE_TIME_ENTRY", "TIME_ENTRY", entry_id, f"Deleted session entry (ID {entry_id}) for task '{task_name}'.")
        return "", 204
    finally:
        db.close()

@time_entry_bp.route("/<int:entry_id>", methods=["PUT"])
@jwt_required()
def update_time_entry(entry_id):
    user_id = int(get_jwt_identity())
    try:
        data = request.json
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        entry = TimeEntryService.update_entry(db, entry_id, data, user_id=user_id)
        from models.task import Task
        t_obj = db.query(Task).filter(Task.id == entry.task_id).first()
        task_name = t_obj.name if t_obj else "unknown"
        log_action(db, "UPDATE_TIME_ENTRY", "TIME_ENTRY", entry.id, f"Updated session entry (ID {entry_id}) for task '{task_name}'.")
        return success_response(time_entry_schema.dump(entry))
    except ValueError as e:
        return error_response(str(e), 404)
    finally:
        db.close()
