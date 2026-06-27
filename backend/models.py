from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    folders = db.relationship(
        "Folder", backref="owner", lazy=True, cascade="all, delete-orphan"
    )
    files = db.relationship(
        "File", backref="owner", lazy=True, cascade="all, delete-orphan"
    )


class Folder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("folder.id"), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    parent = db.relationship("Folder", remote_side=[id], backref="children")
    files = db.relationship(
        "File", backref="folder", lazy=True, cascade="all, delete-orphan"
    )


class File(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.BigInteger, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    storage_path = db.Column(db.String(500), nullable=False)
    folder_id = db.Column(db.Integer, db.ForeignKey("folder.id"), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Share(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(
        db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4())
    )
    file_id = db.Column(db.Integer, db.ForeignKey("file.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    file = db.relationship("File", backref="shares")
