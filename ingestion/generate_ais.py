from dotenv import load_dotenv
load_dotenv()
import os, random
from datetime import datetime, timedelta, timezone
import psycopg

DB = os.getenv("DATABASE_URL", "postgresql://sentinel:change_me_local@localhost:5432/blacksea")

def main():
    random.seed(17)
    now = datetime.now(timezone.utc)
    rows = []
    for n in range(1, 9):
        vessel = f"SIM-BS-{n:03d}"
        lon, lat = random.uniform(27.7,28.8), random.uniform(42.55,43.35)
        speed, heading = random.uniform(2,14), random.uniform(0,359)
        for step in range(12):
            t = now - timedelta(hours=12-step)
            lon += random.uniform(-.012,.012)
            lat += random.uniform(-.009,.009)
            rows.append((vessel,t,speed,heading,lon,lat))
    with psycopg.connect(DB) as conn:
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO vessel_positions
                (vessel_id, observed_at, speed_knots, heading, is_simulated, geom)
                VALUES (%s,%s,%s,%s,TRUE,ST_SetSRID(ST_MakePoint(%s,%s),4326))
            """, rows)
        conn.commit()
    print(f"Inserted {len(rows)} SYNTHETIC vessel positions (not real AIS).")

if __name__ == "__main__":
    main()
