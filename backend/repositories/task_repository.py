from sqlalchemy.orm import Session
from models.task import Task
from models.project import Project

class TaskRepository:
    @staticmethod
    def list_all(db: Session, category: str = None, project_id: int = None):
        query = db.query(Task).join(Project, Project.id == Task.project_id)
        if category:
            query = query.filter(Project.category == category)
        if project_id is not None:
            query = query.filter(Task.project_id == project_id)
        
        return query.order_by(Task.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, task_id: int) -> Task:
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def create(db: Session, task_data: dict) -> Task:
        task = Task(**task_data)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update(db: Session, task: Task, update_data: dict) -> Task:
        for key, value in update_data.items():
            setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete(db: Session, task: Task):
        db.delete(task)
        db.commit()
