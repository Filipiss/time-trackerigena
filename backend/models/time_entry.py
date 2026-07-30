from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from utils.database import Base


class TimeEntry(Base):
    """Modelo para registros de tempo."""

    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com tarefa
    task = relationship("Task", back_populates="time_entries")

    def __repr__(self):
        return f"<TimeEntry(id={self.id}, task_id={self.task_id}, duration={self.duration_seconds}s)>"
