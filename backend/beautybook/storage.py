import base64
import io
import uuid
from pathlib import Path

from django.conf import settings


def save_raw_from_base64(data_url: str, subfolder: str, tenant_schema: str) -> tuple:
    """
    Decode a base64 data URL and write the raw bytes to disk immediately —
    no Pillow, no compression. Returns (public_url, abs_path_str).

    Call compress_portfolio_image.delay(abs_path) afterwards to compress async.
    Plain URLs (existing records) are returned as (url, "") with nothing written.
    """
    if not data_url.startswith("data:image"):
        return data_url, ""

    try:
        _, encoded = data_url.split(",", 1)
    except (ValueError, IndexError):
        raise ValueError("Invalid image data URL format.")

    raw_bytes = base64.b64decode(encoded)

    rel_dir = Path(subfolder) / tenant_schema
    abs_dir = Path(settings.MEDIA_ROOT) / rel_dir
    abs_dir.mkdir(parents=True, exist_ok=True)

    # Always .jpg — Celery task will overwrite with proper JPEG bytes
    filename = f"{uuid.uuid4()}.jpg"
    abs_path = abs_dir / filename
    abs_path.write_bytes(raw_bytes)

    rel_url = f"/media/{rel_dir}/{filename}"
    base = getattr(settings, "MEDIA_BASE_URL", "").rstrip("/")
    url = f"{base}{rel_url}" if base else rel_url
    return url, str(abs_path)


def save_compressed_from_base64(data_url: str, subfolder: str, tenant_schema: str) -> tuple:
    """
    Decode a base64 data URL, compress to JPEG (max 1200px wide, quality 85),
    write to MEDIA_ROOT and return (public_url, abs_path_str).
    Plain URLs (existing records) are returned as (url, "") with nothing written.
    """
    if not data_url.startswith("data:image"):
        return data_url, ""

    try:
        header, encoded = data_url.split(",", 1)
    except (ValueError, IndexError):
        raise ValueError("Invalid image data URL format.")

    raw_bytes = base64.b64decode(encoded)

    # Compress with Pillow: resize to max 1200px wide, convert to JPEG
    from PIL import Image
    img = Image.open(io.BytesIO(raw_bytes))
    if img.mode not in ("RGB",):
        img = img.convert("RGB")
    max_width = 1200
    if img.width > max_width:
        new_height = int(img.height * (max_width / img.width))
        img = img.resize((max_width, new_height), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    image_bytes = buf.getvalue()

    rel_dir = Path(subfolder) / tenant_schema
    abs_dir = Path(settings.MEDIA_ROOT) / rel_dir
    abs_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}.jpg"
    abs_path = abs_dir / filename
    abs_path.write_bytes(image_bytes)

    rel_url = f"/media/{rel_dir}/{filename}"
    base = getattr(settings, "MEDIA_BASE_URL", "").rstrip("/")
    url = f"{base}{rel_url}" if base else rel_url
    return url, str(abs_path)


def save_image_from_base64(data_url: str, subfolder: str, tenant_schema: str) -> str:
    """
    Decode a base64 data URL, compress to JPEG (max 1200px wide, quality 85),
    write to MEDIA_ROOT and return the public URL.
    Plain URLs are returned unchanged so existing records keep working.
    """
    url, _ = save_compressed_from_base64(data_url, subfolder, tenant_schema)
    return url
