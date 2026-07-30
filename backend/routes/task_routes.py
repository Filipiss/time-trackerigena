from flask import Blueprint, request

task_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

from controllers import task_controller_impl
