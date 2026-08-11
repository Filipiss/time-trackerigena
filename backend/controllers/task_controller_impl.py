from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from utils.database import get_db_session
from utils.responses import success_response, error_response
from services.task_service import TaskService
from services.project_service import ProjectService
from schemas.task_schema import TaskSchema, TaskUpdateSchema, TaskDeadlineHistorySchema
from routes.task_routes import task_bp

task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_update_schema = TaskUpdateSchema()
task_deadline_history_schema = TaskDeadlineHistorySchema(many=True)


@task_bp.route("/", methods=["GET"])
@jwt_required()
def list_tasks():
    category = request.args.get("category")
    project_id = request.args.get("project_id", type=int)
    user_id = int(get_jwt_identity())

    if category and category not in ("Loco", "Freelas"):
        return error_response("Categoria deve ser 'Loco' ou 'Freelas'", 400)

    db = get_db_session()
    try:
        tasks = TaskService.get_all_tasks(db, category, project_id, user_id=user_id)
        return success_response(tasks_schema.dump(tasks))
    finally:
        db.close()


@task_bp.route("/", methods=["POST"])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    try:
        data = task_schema.load(request.json)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        # Verifica que o projeto pertence ao user
        project = ProjectService.get_project(db, data.get("project_id"))
        if not project or project.user_id != user_id:
            return error_response("Projeto não encontrado", 404)
        task = TaskService.create_task(db, data)
        return success_response(task_schema.dump(task), 201)
    except ValueError as e:
        return error_response(str(e), 404)
    finally:
        db.close()


@task_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    try:
        data = task_update_schema.load(request.json, partial=True)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        task = TaskService.get_task(db, task_id)
        if not task:
            return error_response("Tarefa não encontrada", 404)
        # Verifica ownership via project
        project = ProjectService.get_project(db, task.project_id)
        if not project or project.user_id != user_id:
            return error_response("Tarefa não encontrada", 404)
        task = TaskService.update_task(db, task_id, data)
        return success_response(task_schema.dump(task))
    except ValueError as e:
        return error_response(str(e), 404)
    finally:
        db.close()


@task_bp.route("/<int:task_id>/deadline-history", methods=["GET"])
@jwt_required()
def get_task_deadline_history(task_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        task = TaskService.get_task(db, task_id)
        if not task:
            return error_response("Tarefa não encontrada", 404)
        project = ProjectService.get_project(db, task.project_id)
        if not project or project.user_id != user_id:
            return error_response("Tarefa não encontrada", 404)
        history = TaskService.get_deadline_history(db, task_id)
        return success_response(task_deadline_history_schema.dump(history))
    finally:
        db.close()


@task_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        task = TaskService.get_task(db, task_id)
        if not task:
            return error_response("Tarefa não encontrada", 404)
        project = ProjectService.get_project(db, task.project_id)
        if not project or project.user_id != user_id:
            return error_response("Tarefa não encontrada", 404)
        TaskService.delete_task(db, task_id)
        return "", 204
    finally:
        db.close()
