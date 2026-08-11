from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from utils.database import get_db_session
from utils.responses import success_response, error_response
from services.project_service import ProjectService
from schemas.project_schema import ProjectSchema, ProjectUpdateSchema, ProjectDeadlineHistorySchema
from routes.project_routes import project_bp

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
project_update_schema = ProjectUpdateSchema()
project_deadline_history_schema = ProjectDeadlineHistorySchema(many=True)


@project_bp.route("/", methods=["GET"])
@jwt_required()
def list_projects():
    category = request.args.get("category")
    user_id = int(get_jwt_identity())

    db = get_db_session()
    try:
        projects = ProjectService.get_all_projects(db, category, user_id=user_id)
        return success_response(projects_schema.dump(projects))
    finally:
        db.close()


@project_bp.route("/", methods=["POST"])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    try:
        data = project_schema.load(request.json)
    except ValidationError as err:
        return error_response(err.messages, 422)

    data["user_id"] = user_id
    db = get_db_session()
    try:
        project = ProjectService.create_project(db, data)
        return success_response(project_schema.dump(project), 201)
    finally:
        db.close()


@project_bp.route("/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    try:
        data = project_update_schema.load(request.json, partial=True)
    except ValidationError as err:
        return error_response(err.messages, 422)

    db = get_db_session()
    try:
        project = ProjectService.get_project(db, project_id)
        if not project or project.user_id != user_id:
            return error_response("Projeto não encontrado", 404)
        project = ProjectService.update_project(db, project_id, data)
        return success_response(project_schema.dump(project))
    finally:
        db.close()


@project_bp.route("/<int:project_id>/deadline-history", methods=["GET"])
@jwt_required()
def get_project_deadline_history(project_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        project = ProjectService.get_project(db, project_id)
        if not project or project.user_id != user_id:
            return error_response("Projeto não encontrado", 404)
        history = ProjectService.get_deadline_history(db, project_id)
        return success_response(project_deadline_history_schema.dump(history))
    finally:
        db.close()


@project_bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        project = ProjectService.get_project(db, project_id)
        if not project or project.user_id != user_id:
            return error_response("Projeto não encontrado", 404)
        ProjectService.delete_project(db, project_id)
        return "", 204
    finally:
        db.close()
