import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# Verifica se existe URL de banco de dados no ambiente (produção/Neon)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Produção: PostgreSQL (Supabase / Neon)
    # pool_pre_ping=True evita quedas de conexão inativa (SSL SYSCALL error / EOF detected)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
    )
else:
    # Desenvolvimento: SQLite local
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_DIR = os.path.join(BASE_DIR, "..", "..", "database")
    os.makedirs(DB_DIR, exist_ok=True)
    DB_PATH = os.path.join(DB_DIR, "timetracker.db")
    SQLITE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Ativa foreign keys no SQLite."""
    if type(dbapi_connection).__name__ in ("sqlite3.Connection", "Connection"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db():
    """Fornece uma sessão do banco de dados e garante o fechamento."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session():
    """Retorna uma sessão do banco para uso direto (sem generator)."""
    return SessionLocal()
