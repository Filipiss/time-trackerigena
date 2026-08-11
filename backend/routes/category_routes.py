from flask import Blueprint, request
from marshmallow import Schema, fields, ValidationError
from sqlalchemy import func
from models.category import Category
from models.project import Project
from utils.database import get_db_session
from utils.responses import success_response, error_response

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


class CategorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=lambda value: len(value.strip()) > 0)
    created_at = fields.DateTime(dump_only=True)


schema = CategorySchema()
many_schema = CategorySchema(many=True)


@category_bp.route("/", methods=["GET"])
def list_categories():
    db = get_db_session()
    try:
        return success_response(many_schema.dump(db.query(Category).order_by(Category.name).all()))
    finally:
        db.close()


@category_bp.route("/", methods=["POST"])
def create_category():
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(err.messages, 422)
    db = get_db_session()
    try:
        name = data["name"].strip()
        if db.query(Category).filter(func.lower(Category.name) == name.lower()).first():
            return error_response("Já existe uma categoria com esse nome", 409)
        category = Category(name=name)
        db.add(category); db.commit(); db.refresh(category)
        return success_response(schema.dump(category), 201)
    finally:
        db.close()


@category_bp.route("/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return error_response(err.messages, 422)
    db = get_db_session()
    try:
        category = db.get(Category, category_id)
        if not category: return error_response("Categoria não encontrada", 404)
        name = data["name"].strip()
        duplicate = db.query(Category).filter(func.lower(Category.name) == name.lower(), Category.id != category_id).first()
        if duplicate: return error_response("Já existe uma categoria com esse nome", 409)
        old_name = category.name
        category.name = name
        db.query(Project).filter(Project.category == old_name).update({Project.category: name})
        db.commit(); db.refresh(category)
        return success_response(schema.dump(category))
    finally:
        db.close()


@category_bp.route("/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    db = get_db_session()
    try:
        category = db.get(Category, category_id)
        if not category: return error_response("Categoria não encontrada", 404)
        # Cascade: exclui todos os projetos da categoria (tasks/time_entries são removidos pelo SQLAlchemy cascade)
        for project in db.query(Project).filter(Project.category == category.name).all():
            db.delete(project)
        db.delete(category); db.commit()
        return "", 204
    finally:
        db.close()
