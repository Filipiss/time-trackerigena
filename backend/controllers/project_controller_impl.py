from flask import request
from marshmallow import ValidationError
from utils.database import get_db_session
from utils.responses import success_response, error_response
from services.project_service import ProjectService
from schemas.project_schema import ProjectSchema, ProjectUpdateSchema
from routes.project_routes import project_bp

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
project_update_schema = ProjectUpdateSchema()

@project_bp.route("/", methods=["GET"])
def list_projects():
    category = request.args.get("category")
        
    db = get_db_session()
    try:
        projects = ProjectService.get_all_projects(db, category)
        return success_response(projects_schema.dump(projects))
    finally:
        db.close()

@project_bp.route("/", methods=["POST"])
def create_project():
    try:
        data = project_schema.load(request.json)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        project = ProjectService.create_project(db, data)
        return success_response(project_schema.dump(project), 201)
    finally:
        db.close()

@project_bp.route("/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    try:
        data = project_update_schema.load(request.json)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        project = ProjectService.update_project(db, project_id, data)
        if not project:
            return error_response("Projeto não encontrado", 404)
        return success_response(project_schema.dump(project))
    finally:
        db.close()

@project_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    db = get_db_session()
    try:
        success = ProjectService.delete_project(db, project_id)
        if not success:
            return error_response("Projeto não encontrado", 404)
        return "", 204
    finally:
        db.close()
