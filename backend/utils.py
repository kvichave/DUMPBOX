import os
import uuid
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {
    "txt",
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "mp4",
    "mp3",
    "zip",
    "rar",
    "json",
    "csv",
    "py",
    "js",
    "ts",
    "html",
    "css",
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_unique_filename(original_name):
    ext = original_name.rsplit(".", 1)[1].lower() if "." in original_name else ""
    safe_name = secure_filename(original_name)
    if not safe_name:
        safe_name = f"file_{uuid.uuid4().hex}"
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    return unique_name


def format_size(size_bytes):
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"
