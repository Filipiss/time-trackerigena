import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.database import Base
from models.user import User
from models.project import Project, ProjectDeadlineHistory
from models.task import Task, TaskDeadlineHistory
from models.time_entry import TimeEntry
from models.category import Category
from models.project_attachment import ProjectAttachment

engine = create_engine(os.getenv("DATABASE_URL"))
Base.metadata.create_all(bind=engine)
print("Table for attachments created successfully!")
