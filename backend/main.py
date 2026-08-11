import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from dotenv import load_dotenv
from sqlalchemy import inspect, text

from utils.database import Base, engine

# Importa os rotas/blueprints que irão disparar a importação dos controllers
from routes.project_routes import project_bp
from routes.task_routes import task_bp
from routes.time_entry_routes import time_entry_bp
from routes.category_routes import category_bp
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp

from models.category import Category
from models.project import Project
from models.task import Task
from models.user import User  # noqa: F401 — necessário para create_all detectar a tabela

load_dotenv()

# Cria todas as tabelas no banco de dados, se não existirem (incluindo 'users')
Base.metadata.create_all(bind=engine)


def _run_lightweight_migrations():
    """Adiciona colunas novas em tabelas já existentes (sem Alembic)."""
    inspector = inspect(engine)

    columns_to_add = {
        "projects": [
            ("deadline", "VARCHAR(10)"),
            ("status", "VARCHAR(30)"),
            ("notes", "TEXT"),
            ("user_id", "INTEGER"),  # FK para users — adicionada gradualmente
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


mail = Mail()
from utils.notifier import start_notifier


def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # ── JWT ──────────────────────────────────────────────────────────────────
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-insecure-key-change-in-prod")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 24 * 7  # 7 dias
    JWTManager(app)

    # ── Flask-Mail ────────────────────────────────────────────────────────────
    app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
    app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME", "")
    app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD", "")
    app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER", "")
    mail.init_app(app)

    # ── CORS ──────────────────────────────────────────────────────────────────
    origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ]
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        origins.append(frontend_url)

    CORS(app, origins=origins, supports_credentials=True)

    # ── Blueprints ────────────────────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(time_entry_bp)
    app.register_blueprint(category_bp)

    @app.route("/", methods=["GET"])
    def root():
        """Endpoint raiz para verificação de saúde da API."""
        return jsonify({"app": "Time Trackerígena", "status": "running (Flask)"}), 200

    start_notifier(app)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=8000)
