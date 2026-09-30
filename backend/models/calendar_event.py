from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from utils.database import Base

class CalendarEvent(Base):
    """Modelo para agendamentos independentes no calendário."""
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    
    date = Column(String(10), nullable=False)
    status = Column(String(30), default="em_andamento", nullable=False)
    notes = Column(Text, nullable=True)
    deadline_notified = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    task = relationship("Task")

    def __repr__(self):
        return f"<CalendarEvent(id={self.id}, date='{self.date}', status='{self.status}')>"
