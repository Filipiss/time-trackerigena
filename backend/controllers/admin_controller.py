from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from functools import wraps
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from models.user import User
from models.project import Project
from models.task import Task
from models.time_entry import TimeEntry
from utils.database import get_db_session

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            user_id = int(get_jwt_identity())
            db = get_db_session()
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if not user or not getattr(user, 'is_admin', False):
                    return jsonify({"error": "Acesso negado. Apenas administradores."}), 403
                return fn(*args, **kwargs)
            finally:
                db.close()
        return decorator
    return wrapper

@admin_required()
def get_all_users():
    """GET /api/admin/users"""
    db = get_db_session()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        from schemas.user_schema import UserPublicSchema
        schema = UserPublicSchema(many=True)
        return jsonify(schema.dump(users)), 200
    finally:
        db.close()

@admin_required()
def toggle_admin_role(user_id):
    """PUT /api/admin/users/<id>/role"""
    data = request.get_json() or {}
    is_admin_target = data.get("is_admin", False)
    
    db = get_db_session()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        
        # Prevenir que o usuário tire o próprio admin se for o último? Por enquanto só altera.
        user.is_admin = not user.is_admin
        db.commit()
        
        return jsonify({
            "message": f"Papel de {user.username} {'promovido a Admin' if user.is_admin else 'rebaixado a Usuário'}",
            "is_admin": user.is_admin
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@admin_required()
def update_user_profile(user_id):
    """PUT /api/admin/users/<id>"""
    data = request.get_json() or {}
    db = get_db_session()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
            
        if "username" in data and data["username"].strip():
            user.username = data["username"].strip()
        if "email" in data and data["email"].strip():
            user.email = data["email"].strip()
        if "full_name" in data:
            user.full_name = data["full_name"].strip() if data["full_name"] else None
        if "country" in data:
            user.country = data["country"].strip() if data["country"] else None
        if "phone" in data:
            user.phone = data["phone"].strip() if data["phone"] else None
            
        db.commit()
        from schemas.user_schema import UserPublicSchema
        schema = UserPublicSchema()
        return jsonify({
            "message": "Usuário atualizado com sucesso",
            "user": schema.dump(user)
        }), 200
    except IntegrityError:
        db.rollback()
        return jsonify({"error": "Este username ou e-mail já existe em outra conta no sistema."}), 409
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@admin_required()
def get_metrics():
    """GET /api/admin/metrics"""
    db = get_db_session()
    try:
        users_count = db.query(func.count(User.id)).scalar() or 0
        projects_count = db.query(func.count(Project.id)).scalar() or 0
        tasks_count = db.query(func.count(Task.id)).scalar() or 0
        
        # Total tracked seconds
        total_seconds = db.query(func.sum(TimeEntry.duration_seconds)).scalar() or 0
        total_hours = round(total_seconds / 3600, 2)
        
        return jsonify({
            "users": users_count,
            "projects": projects_count,
            "tasks": tasks_count,
            "total_hours": total_hours
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@admin_required()
def delete_user(user_id):
    """DELETE /api/admin/users/<id>"""
    db = get_db_session()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
            
        db.delete(user)
        db.commit()
        return jsonify({"message": "Usuário excluído com sucesso"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@admin_required()
def create_user_admin():
    """Cria um usuário 'boneco' de teste instantaneamente sem necessidade de ativação por e-mail."""
    data = request.get_json()
    if not data or not data.get("username"):
        return jsonify({"error": "Preencha pelo menos o Nome de Usuário (username)."}), 400
        
    db = get_db_session()
    try:
        from models.user import User
        import bcrypt
        import uuid
        
        username = data["username"].strip().lower()
        
        if db.query(User).filter(User.username == username).first():
            return jsonify({"error": "Esse username já existe."}), 400
            
        email = data.get("email")
        if not email or not email.strip():
            random_hex = uuid.uuid4().hex[:6]
            email = f"test_{username.lower().replace(' ', '')}_{random_hex}@dummy.local"
        else:
            email = email.strip().lower()
            if db.query(User).filter(User.email == email).first():
                return jsonify({"error": "Esse e-mail já existe."}), 400
            
        password = data.get("password")
        if not password or not password.strip():
            import secrets
            password = secrets.token_urlsafe(12)
            
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        
        new_test_user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            is_active=True,
            is_admin=bool(data.get("is_admin", False))
        )
        
        db.add(new_test_user)
        db.commit()
        return jsonify({"message": "Usuário criado com sucesso!"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
