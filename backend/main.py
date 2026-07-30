import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from utils.database import Base, engine

# Importa os rotas/blueprints que irão disparar a importação dos controllers
from routes.project_routes import project_bp
from routes.task_routes import task_bp
from routes.time_entry_routes import time_entry_bp

load_dotenv()

# Cria todas as tabelas no banco de dados, se não existirem
Base.metadata.create_all(bind=engine)

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

    @app.route("/", methods=["GET"])
    def root():
        """Endpoint raiz para verificação de saúde da API."""
        return jsonify({"app": "Time Trackerígena", "status": "running (Flask)"}), 200

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=8000)
