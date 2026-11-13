import ipaddress
import os
import shutil
import socket
import tempfile
import threading
import json
import urllib.parse
import urllib.request
from urllib.error import URLError, HTTPError
from urllib.parse import urlparse

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import yt_dlp

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://maykelpp.github.io").split(",")
CORS(app, resources={r"/api/*": {"origins": [x.strip() for x in allowed_origins if x.strip()]}}, expose_headers=["Content-Disposition"])

limiter = Limiter(get_remote_address, app=app, default_limits=["60 per hour"], storage_uri=os.getenv("RATELIMIT_STORAGE_URI", "memory://"))
download_slots = threading.BoundedSemaphore(2)
MAX_FILE_SIZE = 1024 * 1024 * 1024
TIKWM_ENDPOINT = "https://www.tikwm.com/api/"


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


def validate_tiktok_url(value):
    value = validate_url(value)
    host = (urlparse(value).hostname or "").lower()
    if not (host == "tiktok.com" or host.endswith(".tiktok.com") or host in ("vm.tiktok.com", "vt.tiktok.com")):
        raise ValueError("Este módulo acepta únicamente enlaces de TikTok.")
    return value


def safe_media_url(value):
    if not isinstance(value, str) or not value:
        return None
    parsed = urlparse(value)
    host = (parsed.hostname or "").lower()
    allowed = ("tiktokcdn.com", "tiktokv.com", "byteoversea.com", "ibytedtos.com", "muscdn.com")
    if parsed.scheme != "https" or not any(host == domain or host.endswith("." + domain) for domain in allowed):
        return None
    return value


def tikwm_info(url):
    payload = urllib.parse.urlencode({"url": url, "hd": "1"}).encode()
    req = urllib.request.Request(
        TIKWM_ENDPOINT,
        data=payload,
        headers={"User-Agent": "DCPI-Portal/2.0", "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            result = json.loads(response.read(2_000_000).decode("utf-8"))
    except (URLError, HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError("TikWM no respondió correctamente. Inténtalo de nuevo más tarde.") from exc
    if not isinstance(result, dict) or result.get("code") != 0 or not isinstance(result.get("data"), dict):
        message = result.get("msg", "TikWM no pudo analizar este enlace.") if isinstance(result, dict) else "Respuesta inválida de TikWM."
        raise RuntimeError(str(message)[:180])
    return result["data"]


def base_options():
    return {
        "quiet": True, "no_warnings": True, "noplaylist": True,
        "socket_timeout": 20, "retries": 2, "fragment_retries": 2,
        "max_filesize": MAX_FILE_SIZE, "restrictfilenames": True,
        "ignoreerrors": False,
        "extractor_args": {
            "youtube": {"player_client": ["mweb", "tv", "web_safari"]},
            "youtubepot-bgutilhttp": {"base_url": ["http://127.0.0.1:4416"]},
        },
    }


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "DCPI Universal Downloader API", "version": "2.0.0"})


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
        formats = item.get("formats") or []
        preview_candidates = [
            fmt for fmt in formats
            if fmt.get("url") and fmt.get("vcodec") not in (None, "none")
            and fmt.get("protocol") in ("https", "http", "m3u8_native", "http_dash_segments")
        ]
        preview_candidates.sort(key=lambda fmt: (
            fmt.get("height") or 0,
            fmt.get("tbr") or 0
        ), reverse=True)
        preview_url = preview_candidates[0].get("url") if preview_candidates else item.get("url")
        return jsonify({
            "ok": True, "title": item.get("title") or "Contenido sin título",
            "extractor": item.get("extractor_key") or item.get("extractor") or "Desconocido",
            "duration": item.get("duration"), "thumbnail": item.get("thumbnail"),
            "preview_url": preview_url,
            "webpage_url": item.get("webpage_url") or url,
            "formats_count": len(formats),
        })
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)[:300]}), 400


@app.post("/api/tiktok/info")
@limiter.limit("15 per hour")
def tiktok_info():
    data = request.get_json(silent=True) or {}
    try:
        url = validate_tiktok_url(data.get("url", ""))
        item = tikwm_info(url)
        author = item.get("author") or {}
        music = item.get("music_info") or {}
        images = item.get("images") or []
        return jsonify({
            "ok": True,
            "id": str(item.get("id") or ""),
            "title": item.get("title") or "TikTok",
            "cover": safe_media_url(item.get("cover")),
            "origin_cover": safe_media_url(item.get("origin_cover")),
            "duration": item.get("duration"),
            "width": item.get("width"), "height": item.get("height"),
            "size": item.get("size"), "play_count": item.get("play_count"),
            "digg_count": item.get("digg_count"), "comment_count": item.get("comment_count"),
            "share_count": item.get("share_count"), "collect_count": item.get("collect_count"),
            "region": item.get("region"), "create_time": item.get("create_time"),
            "author": {
                "id": str(author.get("id") or ""),
                "unique_id": author.get("unique_id") or "",
                "nickname": author.get("nickname") or "",
                "avatar": safe_media_url(author.get("avatar")),
            },
            "music": {
                "title": music.get("title") or "",
                "author": music.get("author") or "",
                "play": safe_media_url(music.get("play")),
            },
            "media": {
                "hd": safe_media_url(item.get("hdplay")),
                "no_watermark": safe_media_url(item.get("play")),
                "watermark": safe_media_url(item.get("wmplay")),
            },
            "images": [safe_media_url(x) for x in images if safe_media_url(x)],
            "media_type": "photos" if images else "video",
            "source": "TikWM",
        })
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)[:220]}), 400


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
        host = (urlparse(url).hostname or "").lower()
        if host == "tiktok.com" or host.endswith(".tiktok.com"):
            item = tikwm_info(validate_tiktok_url(url))
            media = item.get("music_info", {}).get("play") if kind == "mp3" else (item.get("hdplay") or item.get("play"))
            media = safe_media_url(media)
            if not media:
                raise RuntimeError("TikWM no proporcionó un archivo de vídeo/audio descargable para esta publicación.")
            req = urllib.request.Request(media, headers={"User-Agent": "Mozilla/5.0"})
            target = os.path.join(temp_dir, "dcpi-tiktok.mp3" if kind == "mp3" else "dcpi-tiktok.mp4")
            total = 0
            with urllib.request.urlopen(req, timeout=30) as source, open(target, "wb") as output:
                while True:
                    chunk = source.read(1024 * 1024)
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > MAX_FILE_SIZE:
                        raise RuntimeError("El archivo supera el límite de 1 GiB.")
                    output.write(chunk)
            response = send_file(target, as_attachment=True, download_name=os.path.basename(target), conditional=True)
            response.call_on_close(lambda: (shutil.rmtree(temp_dir, ignore_errors=True), download_slots.release()))
            return response
        options = base_options()
        options.update({
            "outtmpl": os.path.join(temp_dir, "%(title).120B.%(ext)s"),
            "format": {"best": "bv*+ba/b", "mp4": "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b", "mp3": "bestaudio/best"}.get(kind, "bv*+ba/b"),
        })
        if kind == "mp3":
            options["postprocessors"] = [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "192"}]
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])
        candidates = [os.path.join(temp_dir, name) for name in os.listdir(temp_dir) if os.path.isfile(os.path.join(temp_dir, name)) and not name.endswith((".part", ".ytdl"))]
        if not candidates:
            raise RuntimeError("yt-dlp no generó un archivo descargable.")
        path = max(candidates, key=os.path.getsize)
        if os.path.getsize(path) > MAX_FILE_SIZE:
            raise RuntimeError("El archivo supera el límite de 1 GiB.")
        response = send_file(path, as_attachment=True, download_name=os.path.basename(path), conditional=True)
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
