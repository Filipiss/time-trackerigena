from flask import jsonify


def success_response(data, status: int = 200):
    """Retorna uma resposta JSON de sucesso."""
    return jsonify(data), status


def error_response(message: str, status: int = 400):
    """Retorna uma resposta JSON de erro padronizada."""
    return jsonify({"error": message}), status
