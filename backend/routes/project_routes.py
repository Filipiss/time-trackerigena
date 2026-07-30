from flask import Blueprint, request

project_bp = Blueprint("projects", __name__, url_prefix="/api/projects")

from controllers import project_controller_impl
