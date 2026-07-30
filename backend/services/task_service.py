from sqlalchemy.orm import Session
from models.task import Task
from repositories.task_repository import TaskRepository
from repositories.project_repository import ProjectRepository
from repositories.time_entry_repository import TimeEntryRepository

class TaskService:
    @staticmethod
    def get_all_tasks(db: Session, category: str = None, project_id: int = None):
        tasks = TaskRepository.list_all(db, category, project_id)
        for task in tasks:
            task.total_time = TimeEntryRepository.get_total_time_for_task(db, task.id)
            task.project_name = task.project.name if task.project else None
            task.project_category = task.project.category if task.project else None
        return tasks

    @staticmethod
    def create_task(db: Session, data: dict) -> Task:
        project = ProjectRepository.get_by_id(db, data.get("project_id"))
        if not project:
            raise ValueError("Projeto pai não encontrado")
            
        task = TaskRepository.create(db, data)
        task.total_time = 0
        task.project_name = project.name
        task.project_category = project.category
        return task

    @staticmethod
    def update_task(db: Session, task_id: int, data: dict) -> Task:
        task = TaskRepository.get_by_id(db, task_id)
        if not task:
            return None
            
        # Validate new project_id if sent
        if "project_id" in data and data["project_id"] is not None:
            project = ProjectRepository.get_by_id(db, data["project_id"])
            if not project:
                raise ValueError("Novo projeto pai não encontrado")

        updated_task = TaskRepository.update(db, task, data)
        updated_task.total_time = TimeEntryRepository.get_total_time_for_task(db, task.id)
        updated_task.project_name = updated_task.project.name if updated_task.project else None
        updated_task.project_category = updated_task.project.category if updated_task.project else None
        return updated_task

    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        task = TaskRepository.get_by_id(db, task_id)
        if not task:
            return False
        TaskRepository.delete(db, task)
        return True
