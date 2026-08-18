from utils.database import get_db_session
from sqlalchemy import text

db = get_db_session()
try:
    # Tabelas mapeadas do banco
    tables = [
        'users', 
        'projects', 
        'tasks', 
        'time_entries', 
        'categories', 
        'calendar_events',
        'tickets',
        'ticket_messages'
    ]
    
    for table in tables:
        try:
            # Query robusta para Postgres que atualiza o relógio de IDs (auto-increment)
            sql = f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}) + 1, 1), false);"
            db.execute(text(sql))
            print(f"[OK] Sequência sincronizada para a tabela: {table}")
        except Exception as e:
            db.rollback()
            print(f"[WAR] Falha ou sem sequence auto-inc para a tabela {table}: {str(e)}")
            
    db.commit()
    print("Todas as sequences do PostgreSQL foram sincronizadas com sucesso!")
except Exception as e:
    print("Erro fatal executando SQL:", e)
finally:
    db.close()
