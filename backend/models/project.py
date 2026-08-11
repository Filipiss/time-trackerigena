from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from utils.database import Base

# Status possíveis para o deadline de um projeto no calendário.
PROJECT_STATUSES = ("em_andamento", "urgente", "em_revisao", "aguardando_cliente", "completo")


class Project(Base):
    """Modelo para projetos (agrupadores de tarefas dentro de Loco/Freelas)."""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable para migração gradual
    name = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)  # 'Loco' ou 'Freelas'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Campos do calendário de deadlines
    deadline = Column(String(10), nullable=True)  # formato YYYY-MM-DD
    status = Column(String(30), default="em_andamento")
    notes = Column(Text, nullable=True)

    # Relacionamento com tarefas
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    deadline_history = relationship(
        "ProjectDeadlineHistory", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', category='{self.category}', user_id={self.user_id})>"


class ProjectDeadlineHistory(Base):
    """Registra alterações de deadline de um projeto (auditoria de mudanças de prazo)."""

    __tablename__ = "project_deadline_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    old_deadline = Column(String(10), nullable=True)
    new_deadline = Column(String(10), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="deadline_history")

    def __repr__(self):
        return f"<ProjectDeadlineHistory(project_id={self.project_id}, {self.old_deadline} -> {self.new_deadline})>"
