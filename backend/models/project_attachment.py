from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from utils.database import Base

class ProjectAttachment(Base):
    __tablename__ = 'project_attachments'
    __allow_unmapped__ = True

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=True) # in bytes
    color = Column(String(7), nullable=True) # hex color code
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="attachments")

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'file_name': self.file_name,
            'file_url': self.file_url,
            'file_size': self.file_size,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
