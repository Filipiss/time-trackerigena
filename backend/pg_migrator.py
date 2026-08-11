import os
import sys

def migrate_data():
    from dotenv import load_dotenv
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    load_dotenv()
    
    # 1. Pega URL do Postgres do ENV
    pg_url = os.getenv("DATABASE_URL")
    if not pg_url or "sqlite" in pg_url:
        print("ERRO: DATABASE_URL deve apontar para um banco PostgreSQL no .env para migrar dados.")
        print("Exemplo: postgresql://postgres:suasenha@localhost:5432/trackerigena")
        sys.exit(1)

    print(f"[1/4] Conectando no PostgreSQL destino: {pg_url}")
    dest_engine = create_engine(pg_url)
    
    # 2. Pega URL local do SQLite
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "..", "database", "timetracker.db")
    if not os.path.exists(DB_PATH):
        print(f"ERRO: Banco SQLite não encontrado em {DB_PATH}")
        sys.exit(1)
        
    sqlite_url = f"sqlite:///{DB_PATH}"
    print(f"[2/4] Conectando no SQLite origem: {sqlite_url}")
    src_engine = create_engine(sqlite_url)

    # 3. Importa a base de dados
    from utils.database import Base
    
    # IMPORTANTE: Força a construção das tabelas no destino baseado no schema
    print("[3/4] Criando as tabelas no PostgreSQL se não existirem...")
    # Precisamos importar todos os models para o SQLAlchemy reconhecer na Base
    from models.user import User
    from models.project import Project
    from models.task import Task
    from models.time_entry import TimeEntry
    from models.category import Category
    
    Base.metadata.create_all(bind=dest_engine)

    # 4. Transfere os dados (Migração bruta e idempotente, ignora duplicação se existir)
    print("[4/4] Copiando dados das tabelas na ordem de ForeignKey...")
    SrcSession = sessionmaker(bind=src_engine)
    DestSession = sessionmaker(bind=dest_engine)
    
    src_db = SrcSession()
    dest_db = DestSession()

    try:
        tables_to_sync = [
            User,
            Category,
            Project,
            Task,
            # Importa models dependentes se precisar (como históricos e entradas de tempo)
            TimeEntry,
        ]
        
        # Opcional histórico
        try:
            from models.project import ProjectDeadlineHistory
            from models.task import TaskDeadlineHistory
            tables_to_sync.extend([ProjectDeadlineHistory, TaskDeadlineHistory])
        except ImportError:
            pass
            
        for model in tables_to_sync:
            print(f" -> Copiando {model.__tablename__}...")
            records = src_db.query(model).all()
            for record in records:
                # Checa se o ID já existe
                exists = dest_db.query(model).filter(model.id == record.id).first()
                if not exists:
                    dest_db.merge(record) # Merge trata inserção baseada em ID
            dest_db.commit()
            
        print("\n\nMigração finalizada com sucesso! Seus dados estão no PostgreSQL 🚀")
        print("Lembre-se de deletar ou isolar o arquivo sqlite antigo caso prefira.")
    except Exception as e:
        print(f"Erro fatal: {e}")
        dest_db.rollback()
    finally:
        src_db.close()
        dest_db.close()

if __name__ == "__main__":
    migrate_data()
