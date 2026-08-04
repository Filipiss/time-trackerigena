import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import inspect, text

from utils.database import Base, engine

# Importa os rotas/blueprints que irão disparar a importação dos controllers
from routes.project_routes import project_bp
from routes.task_routes import task_bp
from routes.time_entry_routes import time_entry_bp
from routes.category_routes import category_bp
from models.category import Category
from models.project import Project
from models.task import Task

load_dotenv()

# Cria todas as tabelas no banco de dados, se não existirem
Base.metadata.create_all(bind=engine)


def _run_lightweight_migrations():
    """Adiciona colunas novas em tabelas já existentes (sem Alembic).

    `create_all` só cria tabelas que não existem; não altera tabelas já
    criadas em bancos antigos. Este helper cobre os campos adicionados
    depois do lançamento inicial (calendário de deadlines, moeda e
    horas orçadas das tasks).
    """
    inspector = inspect(engine)

    columns_to_add = {
        "projects": [
            ("deadline", "VARCHAR(10)"),
            ("status", "VARCHAR(30)"),
            ("notes", "TEXT"),
        ],
        "tasks": [
            ("currency", "VARCHAR(3)"),
            ("budgeted_hours", "FLOAT"),
        ],
    }

    with engine.begin() as connection:
        for table_name, columns in columns_to_add.items():
            if table_name not in inspector.get_table_names():
                continue
            existing_columns = {col["name"] for col in inspector.get_columns(table_name)}
            for column_name, column_type in columns:
                if column_name not in existing_columns:
                    connection.execute(
                        text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                    )

    # Garante valores padrão para linhas antigas
    with engine.begin() as connection:
        connection.execute(text("UPDATE projects SET status = 'em_andamento' WHERE status IS NULL"))
        connection.execute(text("UPDATE tasks SET currency = 'EUR' WHERE currency IS NULL"))


_run_lightweight_migrations()

# Mantém as categorias já existentes no banco local acessíveis no novo gerenciamento.
from utils.database import get_db_session
db = get_db_session()
try:
    for (name,) in db.query(Project.category).distinct().all():
        if name and not db.query(Category).filter_by(name=name).first():
            db.add(Category(name=name))
    db.commit()
finally:
    db.close()


def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # Configuração de CORS
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        origins.append(frontend_url)

    CORS(app, origins=origins, supports_credentials=True)

    # Registra os blueprints (routers)
    app.register_blueprint(project_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(time_entry_bp)
    app.register_blueprint(category_bp)

    @app.route("/", methods=["GET"])
    def root():
        """Endpoint raiz para verificação de saúde da API."""
        return jsonify({"app": "Time Trackerígena", "status": "running (Flask)"}), 200

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=8000)
