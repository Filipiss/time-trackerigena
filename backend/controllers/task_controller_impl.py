from flask import request
from marshmallow import ValidationError
from utils.database import get_db_session
from utils.responses import success_response, error_response
from services.task_service import TaskService
from schemas.task_schema import TaskSchema, TaskUpdateSchema
from routes.task_routes import task_bp

task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_update_schema = TaskUpdateSchema()

@task_bp.route("/", methods=["GET"])
def list_tasks():
    category = request.args.get("category")
    project_id = request.args.get("project_id", type=int)
    
    if category and category not in ("Loco", "Freelas"):
        return error_response("Categoria deve ser 'Loco' ou 'Freelas'", 400)
        
    db = get_db_session()
    try:
        tasks = TaskService.get_all_tasks(db, category, project_id)
        return success_response(tasks_schema.dump(tasks))
    finally:
        db.close()

@task_bp.route("/", methods=["POST"])
def create_task():
    try:
        data = task_schema.load(request.json)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        task = TaskService.create_task(db, data)
        return success_response(task_schema.dump(task), 201)
    except ValueError as e:
        return error_response(str(e), 404)
    finally:
        db.close()

@task_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    try:
        data = task_update_schema.load(request.json, partial=True)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        task = TaskService.update_task(db, task_id, data)
        if not task:
            return error_response("Tarefa não encontrada", 404)
        return success_response(task_schema.dump(task))
    except ValueError as e:
        return error_response(str(e), 404)
    finally:
        db.close()

@task_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    db = get_db_session()
    try:
        success = TaskService.delete_task(db, task_id)
        if not success:
            return error_response("Tarefa não encontrada", 404)
        return "", 204
    finally:
        db.close()
