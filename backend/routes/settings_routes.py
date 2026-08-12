from flask import Blueprint, request
from utils.database import get_db_session
from utils.responses import success_response, error_response
from models.system_setting import SystemSetting
from controllers.admin_controller import admin_required

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

def get_or_create_settings(db):
    settings = db.query(SystemSetting).first()
    if not settings:
        settings = SystemSetting(maintenance_mode=False, global_banner="")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@settings_bp.route("/", methods=["GET"])
def get_settings():
    db = get_db_session()
    try:
        s = get_or_create_settings(db)
        return success_response({
            "maintenance_mode": s.maintenance_mode,
            "global_banner": s.global_banner
        })
    finally:
        db.close()

@settings_bp.route("/", methods=["PUT"])
@admin_required()
def update_settings():
    data = request.json
    db = get_db_session()
    try:
        s = get_or_create_settings(db)
        if "maintenance_mode" in data:
            s.maintenance_mode = bool(data["maintenance_mode"])
        if "global_banner" in data:
            s.global_banner = str(data["global_banner"]).strip()
        
        db.commit()
        return success_response({
            "maintenance_mode": s.maintenance_mode,
            "global_banner": s.global_banner
        })
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        db.close()
