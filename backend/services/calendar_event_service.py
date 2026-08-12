from sqlalchemy.orm import Session
from models.calendar_event import CalendarEvent
from repositories.calendar_event_repository import CalendarEventRepository
from typing import Optional

class CalendarEventService:
    @staticmethod
    def list_events(db: Session, user_id: int):
        return CalendarEventRepository.list_all(db, user_id)

    @staticmethod
    def get_event(db: Session, event_id: int) -> Optional[CalendarEvent]:
        return CalendarEventRepository.get_by_id(db, event_id)

    @staticmethod
    def create_event(db: Session, data: dict, user_id: int) -> CalendarEvent:
        data["user_id"] = user_id
        return CalendarEventRepository.create(db, data)

    @staticmethod
    def update_event(db: Session, event_id: int, data: dict) -> Optional[CalendarEvent]:
        event = CalendarEventRepository.get_by_id(db, event_id)
        if not event:
            return None
        return CalendarEventRepository.update(db, event, data)

    @staticmethod
    def delete_event(db: Session, event_id: int) -> bool:
        event = CalendarEventRepository.get_by_id(db, event_id)
        if not event:
            return False
        CalendarEventRepository.delete(db, event)
        return True
