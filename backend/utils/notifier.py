import threading
import time
from datetime import datetime
from sqlalchemy.orm import Session
from utils.database import get_db_session
from models.project import Project
from models.task import Task
from models.user import User

def check_and_notify_deadlines(app):
    """
    Varredura de banco de dados para checar de Projetos e Tasks possuem deadlines programados
    para 'hoje'. Dispara notificações extraterrestres via `utils.mail` se houver match.
    """
    from utils.mail import send_deadline_notification_email
    
    db: Session = get_db_session()
    try:
        today_iso = datetime.now().strftime("%Y-%m-%d")
        
        # Projetos
        projects = db.query(Project).filter(
            Project.deadline == today_iso,
            Project.status.in_(["deadline", "urgente"]),
            Project.deadline_notified == False
        ).all()
        
        for project in projects:
            user = db.query(User).filter(User.id == project.user_id).first()
            if user:
                try:
                    send_deadline_notification_email(app, user.email, user.username, project.name, "Projeto")
                    project.deadline_notified = True
                    db.commit()
                except Exception as e:
                    print(f"[Notifier] Erro ao enviar email do Projeto id={project.id}: {e}")
                    db.rollback()

        # Tasks
        # precisamos recuperar o owner da task atravessando o project.
        tasks = db.query(Task).join(Project, Task.project_id == Project.id).filter(
            Task.deadline == today_iso,
            Task.status.in_(["deadline", "urgente"]),
            Task.deadline_notified == False
        ).all()
        
        for task in tasks:
            user = db.query(User).filter(User.id == task.project.user_id).first()
            if user:
                try:
                    send_deadline_notification_email(app, user.email, user.username, task.name, "Task")
                    task.deadline_notified = True
                    db.commit()
                except Exception as e:
                    print(f"[Notifier] Erro ao enviar email da Task id={task.id}: {e}")
                    db.rollback()
    except Exception as e:
        print(f"[Notifier] Erro na varredura principal: {e}")
        db.rollback()
    finally:
        db.close()


def run_notifier_loop(app):
    # Roda a cada minuto para disparo quase imediato
    while True:
        check_and_notify_deadlines(app)
        time.sleep(60)

def start_notifier(app):
    """Inicia o daemon scheduler para não travar a main thread."""
    thread = threading.Thread(target=run_notifier_loop, args=(app,), daemon=True)
    thread.start()
