from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from utils.database import Base


class Project(Base):
    """Modelo para projetos (agrupadores de tarefas dentro de Loco/Freelas)."""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)  # 'Loco' ou 'Freelas'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com tarefas
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', category='{self.category}')>"
