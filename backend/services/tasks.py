import io
import logging
from pathlib import Path

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="services.tasks.compress_portfolio_image", ignore_result=True)
def compress_portfolio_image(image_path: str) -> None:
    """
    Compress a raw uploaded portfolio image in place.
    Resize to max 1200px wide, convert to JPEG quality 85.
    Overwrites the original file — the DB URL stays unchanged.
    """
    if not image_path:
        return

    path = Path(image_path)
    if not path.exists():
        logger.warning("compress_portfolio_image: path not found: %s", image_path)
        return

    try:
        from PIL import Image

        raw = path.read_bytes()
        img = Image.open(io.BytesIO(raw))
        if img.mode != "RGB":
            img = img.convert("RGB")

        max_width = 1200
        if img.width > max_width:
            new_height = int(img.height * (max_width / img.width))
            img = img.resize((max_width, new_height), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        path.write_bytes(buf.getvalue())

        logger.info(
            "compress_portfolio_image: compressed %s (raw=%d bytes → %d bytes)",
            path.name, len(raw), len(buf.getvalue()),
        )
    except Exception as exc:
        logger.error("compress_portfolio_image: failed for %s: %s", image_path, exc)
