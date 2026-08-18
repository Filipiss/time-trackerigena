from sqlalchemy import Column, Integer, Boolean, String, Text
from utils.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True)
    maintenance_mode = Column(Boolean, default=False, nullable=False)
    global_banner = Column(Text, nullable=True, default="")
    
    # We only need one row for system settings, typically id=1.
