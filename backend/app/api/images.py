import os
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.database.connection import get_connection

router = APIRouter(prefix="/api/v1/images", tags=["images"])
IMAGE_DIR = Path(os.getenv("DATA_DIR", "/data")) / "raw" / "images"
ALLOWED = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}

@router.get("")
def list_images():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, filename, stored_path, source, is_simulated, created_at
            FROM images ORDER BY created_at DESC LIMIT 200
        """).fetchall()
    return [dict(r) for r in rows]

@router.post("")
async def upload_image(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED:
        raise HTTPException(status_code=415, detail="Unsupported image type")
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image exceeds 25 MB")
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')}_{Path(file.filename).name}"
    destination = IMAGE_DIR / safe_name
    destination.write_bytes(content)
    with get_connection() as conn:
        row = conn.execute("""
            INSERT INTO images (filename, stored_path, source)
            VALUES (%s, %s, 'user_upload')
            RETURNING id, filename, stored_path, source
        """, (safe_name, str(destination))).fetchone()
        conn.commit()
    return dict(row)
