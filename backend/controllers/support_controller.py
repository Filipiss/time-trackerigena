import threading
from flask import jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload
from models.ticket import Ticket, TicketMessage
from models.user import User
from utils.database import get_db_session
from controllers.admin_controller import admin_required
from utils.mail import send_new_ticket_email_to_admins

# --- User Methods ---

@jwt_required()
def create_ticket():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get("subject") or not data.get("message"):
        return jsonify({"error": "Assunto e mensagem são obrigatórios"}), 400
        
    db = get_db_session()
    try:
        new_ticket = Ticket(
            user_id=user_id,
            subject=data["subject"].strip(),
            status="open"
        )
        db.add(new_ticket)
        db.commit()
        
        first_message = TicketMessage(
            ticket_id=new_ticket.id,
            sender_id=user_id,
            message=data["message"].strip()
        )
        db.add(first_message)
        db.commit()
        
        # Dispara email para admins em thread separada
        user = db.query(User).filter(User.id == user_id).first()
        admins = db.query(User).filter(User.is_admin == True).all()
        admin_emails = [admin.email for admin in admins if admin.email]
        
        if admin_emails:
            app = current_app._get_current_object()
            threading.Thread(
                target=send_new_ticket_email_to_admins,
                args=(app, admin_emails, new_ticket.subject, user.username)
            ).start()
        
        return jsonify({"message": "Chamado aberto com sucesso", "ticket_id": new_ticket.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@jwt_required()
def get_my_tickets():
    user_id = get_jwt_identity()
    db = get_db_session()
    try:
        tickets = db.query(Ticket).filter(Ticket.user_id == user_id).order_by(Ticket.updated_at.desc()).all()
        result = [
            {
                "id": t.id,
                "subject": t.subject,
                "status": t.status,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat()
            } for t in tickets
        ]
        return jsonify(result), 200
    finally:
        db.close()

@jwt_required()
def get_ticket_messages(ticket_id):
    user_id = get_jwt_identity()
    db = get_db_session()
    try:
        # User is either the owner OR an admin
        user = db.query(User).filter(User.id == user_id).first()
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        
        if not ticket:
            return jsonify({"error": "Chamado não encontrado"}), 404
            
        if not user.is_admin and ticket.user_id != user_id:
            return jsonify({"error": "Acesso negado."}), 403
            
        messages = db.query(TicketMessage).options(joinedload(TicketMessage.sender)).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.created_at.asc()).all()
        
        msg_result = [
            {
                "id": m.id,
                "sender_name": m.sender.username,
                "sender_id": m.sender_id,
                "is_admin": m.sender.is_admin,
                "message": m.message,
                "created_at": m.created_at.isoformat()
            } for m in messages
        ]
        
        return jsonify({
            "ticket": {
                "id": ticket.id,
                "subject": ticket.subject,
                "status": ticket.status,
                "created_at": ticket.created_at.isoformat()
            },
            "messages": msg_result
        }), 200
    finally:
        db.close()

@jwt_required()
def reply_ticket(ticket_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get("message"):
        return jsonify({"error": "Mensagem não pode ser vazia"}), 400
        
    db = get_db_session()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return jsonify({"error": "Chamado não encontrado"}), 404
            
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user.is_admin and ticket.user_id != user_id:
            return jsonify({"error": "Acesso negado."}), 403
            
        if ticket.status == "resolved" and not user.is_admin:
            return jsonify({"error": "Este chamado está marcado como resolvido e não pode receber novas respostas."}), 403
            
        new_message = TicketMessage(
            ticket_id=ticket.id,
            sender_id=user_id,
            message=data["message"].strip()
        )
        db.add(new_message)
        
        # Smart Status update
        if user.is_admin and ticket.user_id != user_id:
            ticket.status = "answered"
        elif not user.is_admin:
            ticket.status = "open"
            
        db.commit()
        return jsonify({"message": "Resposta enviada"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# --- Admin Methods ---

@admin_required()
def get_all_tickets_admin():
    db = get_db_session()
    try:
        tickets = db.query(Ticket).options(joinedload(Ticket.user)).order_by(Ticket.updated_at.desc()).all()
        result = [
            {
                "id": t.id,
                "subject": t.subject,
                "status": t.status,
                "user_name": t.user.username if t.user else "Desconhecido",
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat()
            } for t in tickets
        ]
        return jsonify(result), 200
    finally:
        db.close()

@admin_required()
def update_ticket_status_admin(ticket_id):
    data = request.get_json()
    status = data.get("status")
    
    if status not in ["open", "resolved"]:
        return jsonify({"error": "Status inválido"}), 400
        
    db = get_db_session()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return jsonify({"error": "Chamado não encontrado"}), 404
            
        ticket.status = status
        db.commit()
        return jsonify({"message": "Status do chamado atualizado com sucesso"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@admin_required()
def delete_ticket_admin(ticket_id):
    """Deleta um chamado e todas as suas mensagens em cascata permanentemente."""
    db = get_db_session()
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            return jsonify({"error": "Chamado não encontrado"}), 404
            
        db.delete(ticket)
        db.commit()
        return jsonify({"message": "Chamado removido com sucesso."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
