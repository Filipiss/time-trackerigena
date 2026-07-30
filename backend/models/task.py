from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from utils.database import Base


class Task(Base):
    """Modelo para tarefas rastreadas pertencentes a um projeto."""

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(7), default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    hourly_rate = Column(Float, default=0.0)
    is_billed = Column(Boolean, default=False)

    # Relacionamento com o projeto pai
    project = relationship("Project", back_populates="tasks")

    # Relacionamento com entradas de tempo
    time_entries = relationship(
        "TimeEntry", back_populates="task", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Task(id={self.id}, name='{self.name}', project_id={self.project_id})>"
