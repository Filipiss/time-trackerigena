from flask import request, jsonify
from sqlalchemy.orm import Session
from flask_jwt_extended import get_jwt_identity

from utils.database import get_db_session
from services.calendar_event_service import CalendarEventService

def list_events():
    user_id = int(get_jwt_identity())
    db: Session = get_db_session()
    try:
        events = CalendarEventService.list_events(db, user_id)
        return jsonify([
            {
                "id": ev.id,
                "project_id": ev.project_id,
                "task_id": ev.task_id,
                "date": ev.date,
                "status": ev.status,
                "notes": ev.notes,
            } for ev in events
        ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

def create_event():
    user_id = int(get_jwt_identity())
    data = request.json
    db: Session = get_db_session()
    try:
        # data may contain project_id, task_id, date, status, notes
        event = CalendarEventService.create_event(db, data, user_id)
        return jsonify({
            "id": event.id,
            "project_id": event.project_id,
            "task_id": event.task_id,
            "date": event.date,
            "status": event.status,
            "notes": event.notes
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()

def update_event(event_id):
    user_id = int(get_jwt_identity())
    data = request.json
    db: Session = get_db_session()
    try:
        event = CalendarEventService.get_event(db, event_id)
        if not event or event.user_id != user_id:
            return jsonify({"error": "Event not found"}), 404
            
        updated_event = CalendarEventService.update_event(db, event_id, data)
        return jsonify({
            "id": updated_event.id,
            "project_id": updated_event.project_id,
            "task_id": updated_event.task_id,
            "date": updated_event.date,
            "status": updated_event.status,
            "notes": updated_event.notes
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()

def delete_event(event_id):
    user_id = int(get_jwt_identity())
    db: Session = get_db_session()
    try:
        event = CalendarEventService.get_event(db, event_id)
        if not event or event.user_id != user_id:
            return jsonify({"error": "Event not found"}), 404
            
        CalendarEventService.delete_event(db, event_id)
        return jsonify({"message": "Event deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        db.close()
