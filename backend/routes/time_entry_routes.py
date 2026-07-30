from flask import Blueprint, request

time_entry_bp = Blueprint("time_entries", __name__, url_prefix="/api/time-entries")

from controllers import time_entry_controller_impl
