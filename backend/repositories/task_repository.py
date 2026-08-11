from sqlalchemy.orm import Session
from models.task import Task, TaskDeadlineHistory
from models.project import Project

class TaskRepository:
    @staticmethod
    def list_all(db: Session, category: str = None, project_id: int = None, user_id: int = None):
        query = db.query(Task).join(Project, Project.id == Task.project_id)
        if category:
            query = query.filter(Project.category == category)
        if project_id is not None:
            query = query.filter(Task.project_id == project_id)
        if user_id is not None:
            query = query.filter(Project.user_id == user_id)
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
        if "deadline" in update_data and update_data["deadline"] != task.deadline:
            history = TaskDeadlineHistory(
                task_id=task.id,
                old_deadline=task.deadline,
                new_deadline=update_data["deadline"],
            )
            db.add(history)
            update_data["deadline_notified"] = False  # Reset notification state on new deadline

        for key, value in update_data.items():
            setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete(db: Session, task: Task):
        db.delete(task)
        db.commit()

    @staticmethod
    def get_deadline_history(db: Session, task_id: int):
        return (
            db.query(TaskDeadlineHistory)
            .filter(TaskDeadlineHistory.task_id == task_id)
            .order_by(TaskDeadlineHistory.changed_at.desc())
            .all()
        )
