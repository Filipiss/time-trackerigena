import os
from flask_mail import Mail, Message

mail = Mail()


def send_activation_email(app, recipient_email: str, username: str, token: str):
    """Envia e-mail de ativação de conta."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    activation_link = f"{frontend_url}/activate?token={token}"

    with app.app_context():
        msg = Message(
            subject="Ative sua conta — Time Trackerígena",
            recipients=[recipient_email],
            html=f"""
            <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f0f14;color:#e0e0e0;border-radius:12px">
              <h1 style="color:#7c3aed;margin-bottom:8px">👽 Time Trackerígena</h1>
              <p>Olá, <strong>{username}</strong>!</p>
              <p>Clique no botão abaixo para ativar sua conta:</p>
              <a href="{activation_link}"
                 style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Ativar minha conta
              </a>
              <p style="font-size:12px;color:#888">Se você não criou uma conta, pode ignorar este e-mail.</p>
              <p style="font-size:12px;color:#888">Link direto: {activation_link}</p>
            </div>
            """,
        )
        mail.send(msg)


def send_reset_password_email(app, recipient_email: str, username: str, token: str):
    """Envia e-mail com link para redefinição de senha."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}?reset_token={token}"

    with app.app_context():
        msg = Message(
            subject="Redefinir senha — Time Trackerígena",
            recipients=[recipient_email],
            html=f"""
            <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f0f14;color:#e0e0e0;border-radius:12px">
              <h1 style="color:#7c3aed;margin-bottom:8px">👽 Time Trackerígena</h1>
              <p>Olá, <strong>{username}</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.</p>
              <a href="{reset_link}"
                 style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Redefinir minha senha
              </a>
              <p style="font-size:12px;color:#888">Se você não solicitou isso, pode ignorar este e-mail. Sua senha não será alterada.</p>
              <p style="font-size:12px;color:#888">Link direto: {reset_link}</p>
            </div>
            """,
        )
        mail.send(msg)


def send_deadline_notification_email(app, recipient_email: str, username: str, event_name: str, event_type: str = "Projeto"):
    """Envia e-mail de alerta de deadline."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    with app.app_context():
        msg = Message(
            subject=f"⚠️ Prazo Esgotando: {event_name} — Time Trackerígena",
            recipients=[recipient_email],
            html=f"""
            <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f0f14;color:#e0e0e0;border-radius:12px">
              <h1 style="color:#ef4444;margin-bottom:8px">O Prazo Chegou!</h1>
              <p>Olá, <strong>{username}</strong>!</p>
              <p>ETs vieram te avisar que chegou o dia da sua deadline 🛸👽🖖</p>
              <div style="background:rgba(255,255,255,0.05);padding:16px;border-left:4px solid #ef4444;margin:20px 0;border-radius:4px">
                <p style="margin:0;font-size:12px;text-transform:uppercase;color:#888">{event_type}</p>
                <p style="margin:4px 0 0 0;font-size:18px;font-weight:bold;color:#fff">{event_name}</p>
              </div>
              <a href="{frontend_url}/calendar"
                 style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
                Ver no Calendário
              </a>
            </div>
            """,
        )
        mail.send(msg)
