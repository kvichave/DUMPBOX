from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes.auth import auth_bp
from routes.folders import folders_bp
from routes.files import files_bp
from routes.shares import shares_bp
import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        expose_headers=["Content-Disposition"],
    )

    @app.after_request
    def add_pna_headers(response):
        origin = request.headers.get("Origin", "")
        if origin:
            response.headers.add("Access-Control-Allow-Origin", origin)
            response.headers.add("Access-Control-Allow-Credentials", "true")
            response.headers.add("Access-Control-Allow-Private-Network", "true")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        return response

    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(folders_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(shares_bp)

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, host="0.0.0.0")
