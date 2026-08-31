import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask_mail import Mail, Message

mail = Mail()


def _dispatch_email(app, subject: str, recipients: list, html_content: str, bcc: list = None):
    """Envia e-mail via Flask-Mail ou fallback direto para SMTP_SSL (porta 465)."""
    mail_user = os.getenv("MAIL_USERNAME") or "filipi.soares.silva@gmail.com"
    mail_pass = os.getenv("MAIL_PASSWORD") or "nuxyeymjxwuvojqp"
    mail_server = os.getenv("MAIL_SERVER") or "smtp.gmail.com"
    default_sender = os.getenv("MAIL_DEFAULT_SENDER") or ("Time Trackerígena", mail_user)

    # 1. Tentativa via Flask-Mail
    try:
        with app.app_context():
            msg = Message(
                subject=subject,
                recipients=recipients,
                bcc=bcc,
                html=html_content,
                sender=default_sender,
            )
            mail.send(msg)
            print(f"[Mail] Email successfully sent to {recipients} via Flask-Mail")
            return True
    except Exception as e:
        print(f"[Mail Warning] Flask-Mail failed: {e}. Trying direct SMTP_SSL fallback...")

    # 2. Fallback direto via smtplib.SMTP_SSL (Porta 465 - garantida na nuvem)
    try:
        sender_email = mail_user
        all_to = list(recipients or []) + list(bcc or [])
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Time Trackerígena <{sender_email}>"
        msg["To"] = ", ".join(recipients) if recipients else ""
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP_SSL(mail_server, 465, timeout=10)
        server.login(mail_user, mail_pass)
        server.sendmail(sender_email, all_to, msg.as_string())
        server.quit()
        print(f"[Mail] Email successfully sent to {recipients} via Direct SMTP_SSL fallback")
        return True
    except Exception as err:
        print(f"[Mail Fatal Error] Direct SMTP_SSL fallback also failed: {err}")
        return False


def send_activation_email(app, recipient_email: str, username: str, token: str):
    """Envia e-mail de ativação de conta."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    activation_link = f"{frontend_url}/activate?token={token}"

    html = f"""
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
    """
    return _dispatch_email(app, "Ative sua conta — Time Trackerígena", [recipient_email], html)


def send_reset_password_email(app, recipient_email: str, username: str, token: str):
    """Envia e-mail com link para redefinição de senha."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_link = f"{frontend_url}?reset_token={token}"

    html = f"""
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
    """
    return _dispatch_email(app, "Redefinir senha — Time Trackerígena", [recipient_email], html)


def send_deadline_notification_email(app, recipient_email: str, username: str, event_name: str, event_type: str = "Projeto"):
    """Envia e-mail de alerta de deadline."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    
    html = f"""
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
    """
    return _dispatch_email(app, f"⚠️ Prazo Esgotando: {event_name} — Time Trackerígena", [recipient_email], html)


def send_new_ticket_email_to_admins(app, admin_emails: list, ticket_subject: str, username: str):
    """Envia alerta de novo ticket de suporte para os administradores."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    if not admin_emails:
        return
        
    html = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f0f14;color:#e0e0e0;border-radius:12px">
      <h1 style="color:#f59f00;margin-bottom:8px">Novo Ticket de Suporte</h1>
      <p>O usuário <strong>{username}</strong> acabou de abrir um novo chamado.</p>
      <div style="background:rgba(255,255,255,0.05);padding:16px;border-left:4px solid #f59f00;margin:20px 0;border-radius:4px">
        <p style="margin:4px 0 0 0;font-size:18px;font-weight:bold;color:#fff">{ticket_subject}</p>
      </div>
      <a href="{frontend_url}/admin/support"
         style="display:inline-block;background:#f59f00;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Acessar Helpdesk
      </a>
    </div>
    """
    return _dispatch_email(app, f"🚨 Novo Chamado de Suporte: {ticket_subject}", [], html, bcc=admin_emails)

