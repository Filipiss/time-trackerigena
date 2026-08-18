from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from utils.database import get_db_session
from utils.responses import success_response, error_response
from utils.audit_logger import log_action
from services.project_service import ProjectService
from schemas.project_schema import ProjectSchema, ProjectUpdateSchema, ProjectDeadlineHistorySchema, ProjectAttachmentSchema
from routes.project_routes import project_bp
from models.project_attachment import ProjectAttachment

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
project_update_schema = ProjectUpdateSchema()
project_deadline_history_schema = ProjectDeadlineHistorySchema(many=True)
project_attachment_schema = ProjectAttachmentSchema()
project_attachments_schema = ProjectAttachmentSchema(many=True)


@project_bp.route("/reorder", methods=["PATCH"])
@jwt_required()
def reorder_projects():
    data = request.json
    if not isinstance(data, list):
        return error_response("Payload precisa ser uma lista de objetos {id, sort_order}", 400)
    
    db = get_db_session()
    user_id = int(get_jwt_identity())
    try:
        from models.project import Project
        for item in data:
            proj_id = item.get("id")
            order = item.get("sort_order", 0)
            if proj_id is not None:
                db.query(Project).filter(Project.id == proj_id, Project.user_id == user_id).update({"sort_order": order})
        db.commit()
        return success_response({"msg": "Projetos reordenados com sucesso."})
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        db.close()


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
        log_action(db, "CREATE_PROJECT", "PROJECT", project.id, f"Created project '{project.name}'.")
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
        log_action(db, "UPDATE_PROJECT", "PROJECT", project.id, f"Updated project '{project.name}'.")
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
        log_action(db, "DELETE_PROJECT", "PROJECT", project_id, f"Deleted project '{project.name}' (ID {project_id}).")
        return "", 204
    finally:
        db.close()


@project_bp.route("/<int:project_id>/attachments", methods=["GET"])
@jwt_required()
def get_attachments(project_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        project = ProjectService.get_project(db, project_id)
        if not project or project.user_id != user_id:
            return error_response("Projeto não encontrado", 404)
        attachments = db.query(ProjectAttachment).filter(ProjectAttachment.project_id == project_id).all()
        return success_response(project_attachments_schema.dump(attachments))
    finally:
        db.close()


@project_bp.route("/<int:project_id>/attachments", methods=["POST"])
@jwt_required()
def add_attachment(project_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        project = ProjectService.get_project(db, project_id)
        if not project or project.user_id != user_id:
            return error_response("Projeto não encontrado", 404)
        
        try:
            data = project_attachment_schema.load(request.json)
        except ValidationError as err:
            return error_response(err.messages, 422)
            
        attachment = ProjectAttachment(
            project_id=project_id,
            file_name=data["file_name"],
            file_url=data["file_url"],
            file_size=data.get("file_size"),
            color=data.get("color")
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return success_response(project_attachment_schema.dump(attachment), 201)
    finally:
        db.close()

@project_bp.route("/<int:project_id>/attachments/<int:attachment_id>", methods=["PATCH"])
@jwt_required()
def update_attachment(project_id, attachment_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        project = ProjectService.get_project(db, project_id)
        if not project or project.user_id != user_id:
            return error_response("Projeto não encontrado", 404)
        
        attachment = db.query(ProjectAttachment).filter(ProjectAttachment.id == attachment_id, ProjectAttachment.project_id == project_id).first()
        if not attachment:
            return error_response("Anexo não encontrado", 404)
            
        data = request.json
        if "color" in data:
            attachment.color = data["color"]
            
        db.commit()
        db.refresh(attachment)
        return success_response(project_attachment_schema.dump(attachment))    
    finally:
        db.close()


@project_bp.route("/attachments/<int:attachment_id>", methods=["DELETE"])
@jwt_required()
def delete_attachment(attachment_id):
    user_id = int(get_jwt_identity())
    db = get_db_session()
    try:
        attachment = db.query(ProjectAttachment).filter(ProjectAttachment.id == attachment_id).first()
        if not attachment:
            return error_response("Anexo não encontrado", 404)
        
        project = ProjectService.get_project(db, attachment.project_id)
        if not project or project.user_id != user_id:
            return error_response("O projeto não pertence a você", 403)
            
        db.delete(attachment)
        db.commit()
        return "", 204
    finally:
        db.close()
