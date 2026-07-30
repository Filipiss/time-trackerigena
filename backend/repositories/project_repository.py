from sqlalchemy.orm import Session
from models.project import Project

class ProjectRepository:
    @staticmethod
    def list_all(db: Session, category: str = None):
        query = db.query(Project)
        if category:
            query = query.filter(Project.category == category)
        return query.order_by(Project.created_at.desc()).all()

    @staticmethod
    def create(db: Session, project_data: dict) -> Project:
        project = Project(**project_data)
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def get_by_id(db: Session, project_id: int) -> Project:
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def update(db: Session, project: Project, update_data: dict) -> Project:
        for key, value in update_data.items():
            setattr(project, key, value)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete(db: Session, project: Project):
        db.delete(project)
        db.commit()
