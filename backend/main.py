import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from utils.database import Base, engine

# Importa os rotas/blueprints que irão disparar a importação dos controllers
from routes.project_routes import project_bp
from routes.task_routes import task_bp
from routes.time_entry_routes import time_entry_bp
from routes.category_routes import category_bp
from models.category import Category
from models.project import Project

load_dotenv()

# Cria todas as tabelas no banco de dados, se não existirem
Base.metadata.create_all(bind=engine)

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
