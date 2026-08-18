def log_action(db, action, resource_type=None, resource_id=None, description=None, user_id=None):
    """Grava um registro de auditoria no banco de dados."""
    try:
        from flask import request
        from flask_jwt_extended import get_jwt_identity
        from models.user import User
        from models.audit_log import AuditLog

        # Resolvendo user_id e username
        if not user_id:
            try:
                identity = get_jwt_identity()
                if identity:
                    user_id = int(identity)
            except Exception:
                pass

        username = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                username = user.username

        # Captura o IP do request Flask se estiver no contexto de request
        ip_address = None
        try:
            if request:
                ip_address = request.remote_addr
        except Exception:
            pass

        audit_log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            ip_address=ip_address,
            description=description
        )
        db.add(audit_log)
        db.commit()
    except Exception as e:
        print(f"Erro ao gravar log de auditoria: {e}")
