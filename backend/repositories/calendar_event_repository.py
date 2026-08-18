from sqlalchemy.orm import Session
from models.calendar_event import CalendarEvent
from typing import List, Optional

class CalendarEventRepository:
    @staticmethod
    def get_by_id(db: Session, event_id: int) -> Optional[CalendarEvent]:
        return db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()

    @staticmethod
    def list_all(db: Session, user_id: int) -> List[CalendarEvent]:
        return db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id).all()

    @staticmethod
    def create(db: Session, data: dict) -> CalendarEvent:
        event = CalendarEvent(**data)
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def update(db: Session, event: CalendarEvent, data: dict) -> CalendarEvent:
        for key, value in data.items():
            if hasattr(event, key):
                setattr(event, key, value)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def delete(db: Session, event: CalendarEvent):
        db.delete(event)
        db.commit()
