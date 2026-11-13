import ipaddress
import os
import shutil
import socket
import tempfile
import threading
from urllib.parse import urlparse

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import yt_dlp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://maykelpp.github.io"
).split(",")
CORS(app, resources={r"/api/*": {"origins": [x.strip() for x in allowed_origins if x.strip()]}}, expose_headers=["Content-Disposition"])

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["60 per hour"],
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://"),
)
download_slots = threading.BoundedSemaphore(2)
MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1 GiB


def validate_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        raise ValueError("Introduce una URL válida.")
    parsed = urlparse(value.strip())
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("Solo se admiten enlaces HTTP o HTTPS.")
    host = parsed.hostname.lower()
    if host in ("localhost",) or host.endswith(".local"):
        raise ValueError("Ese host no está permitido.")
    try:
        addresses = socket.getaddrinfo(host, None)
        for item in addresses:
            ip = ipaddress.ip_address(item[4][0])
            if not ip.is_global:
                raise ValueError("La dirección del servidor no es pública.")
    except socket.gaierror:
        raise ValueError("No se pudo resolver el dominio.")
    return value.strip()


def base_options():
    return {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "socket_timeout": 20,
        "retries": 2,
        "fragment_retries": 2,
        "max_filesize": MAX_FILE_SIZE,
        "restrictfilenames": True,
        "ignoreerrors": False,
        # PO Token provider local (BgUtils) para el cliente mweb de YouTube.
        "extractor_args": {
            "youtube": {"player_client": ["mweb", "tv", "web_safari"]},
            "youtubepot-bgutilhttp": {
                "base_url": ["http://127.0.0.1:4416"]
            },
        },
    }


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "DCPI Universal Downloader API", "version": "1.0.0"})


@app.post("/api/info")
@limiter.limit("20 per hour")
def info():
    data = request.get_json(silent=True) or {}
    try:
        url = validate_url(data.get("url", ""))
        options = base_options()
        options["skip_download"] = True
        with yt_dlp.YoutubeDL(options) as ydl:
            item = ydl.extract_info(url, download=False)
        if item.get("_type") == "playlist":
            raise ValueError("Por ahora se analizan enlaces individuales, no listas.")
        return jsonify({
            "ok": True,
            "title": item.get("title") or "Contenido sin título",
            "extractor": item.get("extractor_key") or item.get("extractor") or "Desconocido",
            "duration": item.get("duration"),
            "thumbnail": item.get("thumbnail"),
            "webpage_url": item.get("webpage_url") or url,
            "formats_count": len(item.get("formats") or []),
        })
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)[:300]}), 400


@app.post("/api/download")
@limiter.limit("5 per hour")
def download():
    if not download_slots.acquire(blocking=False):
        return jsonify({"ok": False, "error": "El servidor está ocupado. Inténtalo más tarde."}), 429

    temp_dir = tempfile.mkdtemp(prefix="dcpi_")
    try:
        data = request.get_json(silent=True) or {}
        url = validate_url(data.get("url", ""))
        kind = data.get("format", "best")
        options = base_options()
        options.update({
            "outtmpl": os.path.join(temp_dir, "%(title).120B.%(ext)s"),
            "format": {
                "best": "bv*+ba/b",
                "mp4": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
                "mp3": "bestaudio/best",
            }.get(kind, "bv*+ba/b"),
        })
        if kind == "mp3":
            options["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }]

        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])

        candidates = [
            os.path.join(temp_dir, name)
            for name in os.listdir(temp_dir)
            if os.path.isfile(os.path.join(temp_dir, name))
            and not name.endswith((".part", ".ytdl"))
        ]
        if not candidates:
            raise RuntimeError("yt-dlp no generó un archivo descargable.")
        path = max(candidates, key=os.path.getsize)
        if os.path.getsize(path) > MAX_FILE_SIZE:
            raise RuntimeError("El archivo supera el límite de 1 GiB.")
        response = send_file(
            path,
            as_attachment=True,
            download_name=os.path.basename(path),
            conditional=True,
        )
        response.call_on_close(lambda: (shutil.rmtree(temp_dir, ignore_errors=True), download_slots.release()))
        return response
    except Exception as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        download_slots.release()
        return jsonify({"ok": False, "error": str(exc)[:300]}), 400


@app.errorhandler(413)
def too_large(_error):
    return jsonify({"ok": False, "error": "La solicitud es demasiado grande."}), 413


@app.errorhandler(429)
def rate_limited(_error):
    return jsonify({"ok": False, "error": "Límite de solicitudes alcanzado. Inténtalo más tarde."}), 429


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "10000")))
