from datetime import timedelta
from sqlalchemy.orm import Session
from models.time_entry import TimeEntry
from repositories.time_entry_repository import TimeEntryRepository
from repositories.task_repository import TaskRepository

class TimeEntryService:
    @staticmethod
    def get_all_entries(db: Session, task_id: int = None, category: str = None, limit: int = 50, start_date: str = None, end_date: str = None):
        entries = TimeEntryRepository.list_all(db, task_id, category, limit, start_date, end_date)
        for entry in entries:
            entry.task_name = entry.task.name if entry.task else None
            entry.task_category = entry.task.project.category if (entry.task and entry.task.project) else None
            entry.task_color = entry.task.color if entry.task else None
            entry.task_hourly_rate = entry.task.hourly_rate if entry.task else 0.0
            entry.project_name = entry.task.project.name if (entry.task and entry.task.project) else None
        return entries

    @staticmethod
    def create_entry(db: Session, data: dict) -> TimeEntry:
        task_id = data.get("task_id")
        task = TaskRepository.get_by_id(db, task_id)
        if not task:
            raise ValueError("Tarefa não encontrada")
            
        entry = TimeEntryRepository.create(db, data)
        entry.task_name = task.name
        entry.task_category = task.project.category if task.project else None
        entry.task_color = task.color
        entry.task_hourly_rate = task.hourly_rate
        entry.project_name = task.project.name if task.project else None
        return entry

    @staticmethod
    def get_dashboard_stats(db: Session):
        stats = TimeEntryRepository.get_stats(db)
        
        time_by_category = [
            {"category": row.category, "total_seconds": row.total_seconds}
            for row in stats["category_stats"]
        ]
        
        time_by_task = [
            {
                "task_name": row.name,
                "task_color": row.color,
                "category": row.category,
                "total_seconds": row.total_seconds,
            }
            for row in stats["task_stats"]
        ]
        
        # Garante array de 7 dias preenchidos
        day_map = {str(row.day): row.total_seconds for row in stats["day_stats"]}
        time_by_day = []
        for i in range(7):
            day = stats["seven_days_ago"] + timedelta(days=i)
            day_str = str(day)
            time_by_day.append({
                "date": day_str, 
                "total_seconds": day_map.get(day_str, 0)
            })
            
        return {
            "time_by_category": time_by_category,
            "time_by_task": time_by_task,
            "time_by_day": time_by_day
        }
