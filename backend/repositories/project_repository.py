from sqlalchemy.orm import Session
from models.project import Project
from models.project import ProjectDeadlineHistory


class ProjectRepository:
    @staticmethod
    def list_all(db: Session, category: str = None, user_id: int = None):
        query = db.query(Project)
        if category:
            query = query.filter(Project.category == category)
        if user_id is not None:
            query = query.filter(Project.user_id == user_id)
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
        # Registra a mudança de deadline no histórico antes de aplicar
        if "deadline" in update_data and update_data["deadline"] != project.deadline:
            history = ProjectDeadlineHistory(
                project_id=project.id,
                old_deadline=project.deadline,
                new_deadline=update_data["deadline"],
            )
            db.add(history)
            update_data["deadline_notified"] = False  # Reset notification state on new deadline

        for key, value in update_data.items():
            setattr(project, key, value)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def delete(db: Session, project: Project):
        db.delete(project)
        db.commit()

    @staticmethod
    def get_deadline_history(db: Session, project_id: int):
        return (
            db.query(ProjectDeadlineHistory)
            .filter(ProjectDeadlineHistory.project_id == project_id)
            .order_by(ProjectDeadlineHistory.changed_at.desc())
            .all()
        )
