from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from utils.database import Base


class Task(Base):
    """Modelo para tarefas rastreadas pertencentes a um projeto."""

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(7), default="#6366f1")
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    hourly_rate = Column(Float, default=0.0)
    currency = Column(String(3), default="EUR")  # 'EUR', 'USD' ou 'BRL'
    budgeted_hours = Column(Float, nullable=True)  # horas orçadas para a task
    is_billed = Column(Boolean, default=False)

    # Relacionamento com o projeto pai
    project = relationship("Project", back_populates="tasks")

    # Detalhes de rastreamento / histórico
    time_entries = relationship(
        "TimeEntry", back_populates="task", cascade="all, delete-orphan"
    )

    # Campos de Calendário (Prazos)
    deadline = Column(String(10), nullable=True)  # formato YYYY-MM-DD
    status = Column(String(30), default="em_andamento")
    notes = Column(Text, nullable=True)
    deadline_notified = Column(Boolean, default=False)

    deadline_history = relationship(
        "TaskDeadlineHistory", back_populates="task", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Task(id={self.id}, name='{self.name}', project_id={self.project_id})>"


class TaskDeadlineHistory(Base):
    """Registra alterações de deadline de uma task (auditoria de mudanças de prazo)."""

    __tablename__ = "task_deadline_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    old_deadline = Column(String(10), nullable=True)
    new_deadline = Column(String(10), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="deadline_history")

    def __repr__(self):
        return f"<TaskDeadlineHistory(task_id={self.task_id}, {self.old_deadline} -> {self.new_deadline})>"
