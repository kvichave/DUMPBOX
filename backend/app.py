import os
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes.auth import auth_bp
from routes.folders import folders_bp
from routes.files import files_bp
from routes.shares import shares_bp


def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

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

    frontend_dist = os.path.abspath(Config.FRONTEND_DIST)
    if os.path.isdir(frontend_dist):
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path and os.path.isfile(os.path.join(frontend_dist, path)):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

    return app


if __name__ == "__main__":
    import sys

    app = create_app()
    mode = sys.argv[1] if len(sys.argv) > 1 else "dev"

    if mode == "prod":
        from waitress import serve
        print("Starting production server on http://0.0.0.0:5000")
        serve(app, host="0.0.0.0", port=5000)
    else:
        app.run(debug=True, port=5000, host="0.0.0.0")
