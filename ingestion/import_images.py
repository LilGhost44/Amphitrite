from dotenv import load_dotenv
load_dotenv()
import os
from pathlib import Path
import psycopg

DB = os.getenv("DATABASE_URL", "postgresql://sentinel:change_me_local@localhost:5432/blacksea")
IMAGE_DIR = Path(os.getenv("DATA_DIR","data")) / "raw" / "images"
EXTS = {".jpg",".jpeg",".png",".webp",".tif",".tiff"}

def main():
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    added = 0
    with psycopg.connect(DB) as conn:
        with conn.cursor() as cur:
            for path in IMAGE_DIR.iterdir():
                if path.is_file() and path.suffix.lower() in EXTS:
                    resolved = str(path.resolve())
                    cur.execute("""
                        INSERT INTO images(filename,stored_path,source)
                        SELECT %s,%s,'local_import'
                        WHERE NOT EXISTS (SELECT 1 FROM images WHERE stored_path=%s)
                    """, (path.name,resolved,resolved))
                    added += cur.rowcount
        conn.commit()
    print(f"Registered {added} local image files.")

if __name__ == "__main__":
    main()
