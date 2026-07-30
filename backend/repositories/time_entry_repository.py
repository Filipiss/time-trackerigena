from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from models.time_entry import TimeEntry
from models.task import Task
from models.project import Project


class TimeEntryRepository:
    @staticmethod
    def list_all(db: Session, task_id: int = None, category: str = None, limit: int = 50, start_date: str = None, end_date: str = None):
        query = db.query(TimeEntry).join(Task, Task.id == TimeEntry.task_id).join(Project, Project.id == Task.project_id)
        
        if task_id is not None:
            query = query.filter(TimeEntry.task_id == task_id)
        if category:
            query = query.filter(Project.category == category)
        if start_date:
            query = query.filter(func.date(TimeEntry.start_time) >= start_date)
        if end_date:
            query = query.filter(func.date(TimeEntry.start_time) <= end_date)
            
        return query.order_by(TimeEntry.created_at.desc()).limit(limit).all()

    @staticmethod
    def create(db: Session, entry_data: dict) -> TimeEntry:
        entry = TimeEntry(**entry_data)
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def get_total_time_for_task(db: Session, task_id: int) -> int:
        total = db.query(func.coalesce(func.sum(TimeEntry.duration_seconds), 0)).filter(TimeEntry.task_id == task_id).scalar()
        return total

    @staticmethod
    def get_stats(db: Session, days: int = 7):
        today = datetime.utcnow().date()
        start_day = today - timedelta(days=days - 1)
        filtered = db.query(TimeEntry).filter(func.date(TimeEntry.start_time) >= start_day).subquery()
        # Tempo por categoria
        category_stats = (
            db.query(
                Project.category,
                func.coalesce(func.sum(filtered.c.duration_seconds), 0).label("total_seconds"),
            )
            .select_from(filtered)
            .join(Task, Task.id == filtered.c.task_id)
            .join(Project, Project.id == Task.project_id)
            .group_by(Project.category)
            .all()
        )
        
        # Tempo por tarefa
        task_stats = (
            db.query(
                Task.name,
                Task.color,
                Project.category,
                func.coalesce(func.sum(filtered.c.duration_seconds), 0).label("total_seconds"),
            )
            .select_from(filtered)
            .join(Task, Task.id == filtered.c.task_id)
            .join(Project, Project.id == Task.project_id)
            .group_by(Task.id, Task.name, Task.color, Project.category)
            .order_by(func.sum(filtered.c.duration_seconds).desc())
            .all()
        )
        
        # Tempo por dia
        day_stats = (
            db.query(
                func.date(TimeEntry.start_time).label("day"),
                func.coalesce(func.sum(TimeEntry.duration_seconds), 0).label("total_seconds"),
            )
            .filter(func.date(TimeEntry.start_time) >= start_day)
            .group_by(func.date(TimeEntry.start_time))
            .order_by(func.date(TimeEntry.start_time))
            .all()
        )

        return {
            "category_stats": category_stats,
            "task_stats": task_stats,
            "day_stats": day_stats,
            "start_day": start_day,
            "total_seconds": db.query(func.coalesce(func.sum(TimeEntry.duration_seconds), 0)).scalar()
        }
