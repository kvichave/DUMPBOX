import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Share, File
from config import Config

shares_bp = Blueprint("shares", __name__, url_prefix="/api/shares")


@shares_bp.route("", methods=["POST"])
@jwt_required()
def create_share():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data or not data.get("file_id"):
        return jsonify({"error": "file_id is required"}), 400

    file = File.query.filter_by(id=data["file_id"], user_id=user_id).first()
    if not file:
        return jsonify({"error": "File not found"}), 404

    existing_share = Share.query.filter_by(file_id=file.id).first()
    if existing_share:
        return jsonify(
            {
                "token": existing_share.token,
                "url": f"/api/shares/{existing_share.token}",
                "created_at": existing_share.created_at.isoformat(),
            }
        ), 200

    share = Share(file_id=file.id)
    db.session.add(share)
    db.session.commit()

    return jsonify(
        {
            "token": share.token,
            "url": f"/api/shares/{share.token}",
            "created_at": share.created_at.isoformat(),
        }
    ), 201


@shares_bp.route("/<token>", methods=["GET"])
def access_share(token):
    share = Share.query.filter_by(token=token).first()
    if not share:
        return jsonify({"error": "Share link not found"}), 404

    file = share.file
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


@shares_bp.route("/<token>/info", methods=["GET"])
def share_info(token):
    share = Share.query.filter_by(token=token).first()
    if not share:
        return jsonify({"error": "Share link not found"}), 404

    file = share.file
    return jsonify(
        {
            "file_name": file.original_name if file else "Unknown",
            "file_size": file.size if file else 0,
        }
    ), 200
