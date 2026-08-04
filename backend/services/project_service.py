from sqlalchemy.orm import Session
from models.project import Project
from repositories.project_repository import ProjectRepository

class ProjectService:
    @staticmethod
    def get_all_projects(db: Session, category: str = None):
        return ProjectRepository.list_all(db, category)

    @staticmethod
    def get_project(db: Session, project_id: int) -> Project:
        return ProjectRepository.get_by_id(db, project_id)

    @staticmethod
    def create_project(db: Session, data: dict) -> Project:
        return ProjectRepository.create(db, data)

    @staticmethod
    def update_project(db: Session, project_id: int, data: dict) -> Project:
        project = ProjectRepository.get_by_id(db, project_id)
        if not project:
            return None
        return ProjectRepository.update(db, project, data)

    @staticmethod
    def delete_project(db: Session, project_id: int) -> bool:
        project = ProjectRepository.get_by_id(db, project_id)
        if not project:
            return False
        ProjectRepository.delete(db, project)
        return True

    @staticmethod
    def get_deadline_history(db: Session, project_id: int):
        return ProjectRepository.get_deadline_history(db, project_id)
