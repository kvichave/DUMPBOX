import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, File, Folder
from utils import get_unique_filename, format_size
from config import Config

files_bp = Blueprint("files", __name__, url_prefix="/api/files")


@files_bp.route("", methods=["GET"])
@jwt_required()
def list_files():
    user_id = int(get_jwt_identity())
    folder_id = request.args.get("folder_id", type=int)

    query = File.query.filter_by(user_id=user_id)
    if folder_id is None:
        query = query.filter_by(folder_id=None)
    else:
        query = query.filter_by(folder_id=folder_id)

    files = query.order_by(File.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": f.id,
                "name": f.name,
                "original_name": f.original_name,
                "size": f.size,
                "size_formatted": format_size(f.size),
                "mime_type": f.mime_type,
                "folder_id": f.folder_id,
                "created_at": f.created_at.isoformat(),
            }
            for f in files
        ]
    ), 200


@files_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    folder_id = request.form.get("folder_id", type=int)

    if folder_id:
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({"error": "Folder not found"}), 404

    original_name = secure_filename(file.filename) or file.filename
    unique_name = get_unique_filename(original_name)
    storage_path = os.path.join(Config.UPLOAD_FOLDER, unique_name)
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    file.save(storage_path)

    size = os.path.getsize(storage_path)
    mime_type = file.content_type or "application/octet-stream"

    db_file = File(
        name=original_name,
        original_name=original_name,
        size=size,
        mime_type=mime_type,
        storage_path=unique_name,
        folder_id=folder_id,
        user_id=user_id,
    )
    db.session.add(db_file)
    db.session.commit()

    return jsonify(
        {
            "id": db_file.id,
            "name": db_file.name,
            "size": db_file.size,
            "size_formatted": format_size(db_file.size),
            "mime_type": db_file.mime_type,
            "folder_id": db_file.folder_id,
            "created_at": db_file.created_at.isoformat(),
        }
    ), 201


@files_bp.route("/<int:file_id>", methods=["PUT"])
@jwt_required()
def rename_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({"error": "File not found"}), 404

    data = request.get_json()
    if not data or not data.get("name", "").strip():
        return jsonify({"error": "File name is required"}), 400

    file.name = data["name"].strip()
    db.session.commit()

    return jsonify(
        {
            "id": file.id,
            "name": file.name,
            "size": file.size,
            "size_formatted": format_size(file.size),
            "mime_type": file.mime_type,
            "folder_id": file.folder_id,
        }
    ), 200


@files_bp.route("/<int:file_id>", methods=["DELETE"])
@jwt_required()
def delete_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({"error": "File not found"}), 404

    file_path = os.path.join(Config.UPLOAD_FOLDER, file.storage_path)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.session.delete(file)
    db.session.commit()

    return jsonify({"message": "File deleted"}), 200


@files_bp.route("/<int:file_id>/download", methods=["GET"])
@jwt_required()
def download_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({"error": "File not found"}), 404

    file_path = os.path.join(Config.UPLOAD_FOLDER, file.storage_path)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found on disk"}), 404

    return send_file(
        file_path,
        as_attachment=True,
        download_name=file.original_name,
        mimetype=file.mime_type,
    )


@files_bp.route("/<int:file_id>/preview", methods=["GET"])
@jwt_required()
def preview_file(file_id):
    user_id = int(get_jwt_identity())
    file = File.query.filter_by(id=file_id, user_id=user_id).first()
    if not file:
        return jsonify({"error": "File not found"}), 404

    file_path = os.path.join(Config.UPLOAD_FOLDER, file.storage_path)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found on disk"}), 404

    return send_file(
        file_path,
        as_attachment=False,
        mimetype=file.mime_type,
    )
