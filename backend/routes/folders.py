from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Folder, File
import os
import shutil
from config import Config

folders_bp = Blueprint("folders", __name__, url_prefix="/api/folders")


@folders_bp.route("", methods=["GET"])
@jwt_required()
def list_folders():
    user_id = int(get_jwt_identity())
    parent_id = request.args.get("parent_id", type=int)

    query = Folder.query.filter_by(user_id=user_id)
    if parent_id is None:
        query = query.filter_by(parent_id=None)
    else:
        query = query.filter_by(parent_id=parent_id)

    folders = query.order_by(Folder.name).all()
    return jsonify(
        [
            {
                "id": f.id,
                "name": f.name,
                "parent_id": f.parent_id,
                "created_at": f.created_at.isoformat(),
            }
            for f in folders
        ]
    ), 200


@folders_bp.route("/tree", methods=["GET"])
@jwt_required()
def folder_tree():
    user_id = int(get_jwt_identity())
    folders = Folder.query.filter_by(user_id=user_id).order_by(Folder.name).all()

    tree = []
    for f in folders:
        tree.append(
            {
                "id": f.id,
                "name": f.name,
                "parent_id": f.parent_id,
            }
        )
    return jsonify(tree), 200


@folders_bp.route("", methods=["POST"])
@jwt_required()
def create_folder():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get("name", "").strip():
        return jsonify({"error": "Folder name is required"}), 400

    name = data["name"].strip()
    parent_id = data.get("parent_id")

    if parent_id:
        parent = Folder.query.filter_by(id=parent_id, user_id=user_id).first()
        if not parent:
            return jsonify({"error": "Parent folder not found"}), 404

    folder = Folder(name=name, parent_id=parent_id, user_id=user_id)
    db.session.add(folder)
    db.session.commit()

    return jsonify(
        {
            "id": folder.id,
            "name": folder.name,
            "parent_id": folder.parent_id,
            "created_at": folder.created_at.isoformat(),
        }
    ), 201


@folders_bp.route("/<int:folder_id>", methods=["PUT"])
@jwt_required()
def rename_folder(folder_id):
    user_id = int(get_jwt_identity())
    folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
    if not folder:
        return jsonify({"error": "Folder not found"}), 404

    data = request.get_json()
    if not data or not data.get("name", "").strip():
        return jsonify({"error": "Folder name is required"}), 400

    folder.name = data["name"].strip()
    db.session.commit()

    return jsonify(
        {
            "id": folder.id,
            "name": folder.name,
            "parent_id": folder.parent_id,
        }
    ), 200


@folders_bp.route("/<int:folder_id>", methods=["DELETE"])
@jwt_required()
def delete_folder(folder_id):
    user_id = int(get_jwt_identity())
    folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
    if not folder:
        return jsonify({"error": "Folder not found"}), 404

    files = File.query.filter_by(folder_id=folder_id, user_id=user_id).all()
    for file in files:
        file_path = os.path.join(Config.UPLOAD_FOLDER, file.storage_path)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.session.delete(folder)
    db.session.commit()

    return jsonify({"message": "Folder deleted"}), 200
