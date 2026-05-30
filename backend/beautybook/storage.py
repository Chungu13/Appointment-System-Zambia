import base64
import uuid
from pathlib import Path

from django.conf import settings


def save_image_from_base64(data_url: str, subfolder: str, tenant_schema: str) -> str:
    """
    If data_url is a base64 data URL (data:image/...), decode it, write the file to
    MEDIA_ROOT/<subfolder>/<tenant_schema>/<uuid>.<ext>, and return the full URL
    (prefixed with MEDIA_BASE_URL if set, otherwise a relative /media/... path).

    If data_url is already a plain URL or path, return it unchanged so existing
    records keep working without re-upload.
    """
    if not data_url.startswith("data:image"):
        return data_url

    try:
        header, encoded = data_url.split(",", 1)
        mime = header.split(";")[0].split(":")[1]          # "image/jpeg" or "image/png"
        ext = "jpg" if mime.endswith("jpeg") else mime.split("/")[1]
    except (ValueError, IndexError):
        raise ValueError("Invalid image data URL format.")

    image_bytes = base64.b64decode(encoded)

    rel_dir = Path(subfolder) / tenant_schema
    abs_dir = Path(settings.MEDIA_ROOT) / rel_dir
    abs_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}.{ext}"
    (abs_dir / filename).write_bytes(image_bytes)

    rel_url = f"/media/{rel_dir}/{filename}"
    base = getattr(settings, "MEDIA_BASE_URL", "").rstrip("/")
    return f"{base}{rel_url}" if base else rel_url
