from dotenv import load_dotenv
load_dotenv()
import os
import requests
import psycopg
from datetime import date as Date

# Load the project's root .env file
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(PROJECT_ROOT, ".env"), override=True)

DB = os.getenv("DATABASE_URL")

if not DB:
    raise RuntimeError("DATABASE_URL is missing from .env")

DB = os.getenv("DATABASE_URL", "postgresql://emma:23221030@localhost:5433/emmaDB")
BASE = "https://api.gbif.org/v1/occurrence/search"
COUNTRIES = ["BG", "RO", "UA", "GE", "TR", "RU"]
SPECIES = ["Zostera marina", "Zostera noltei"]

def parse_gbif_date(value):

    #Helper function - incomplete dates become none.
    if not value:
        return None

    try:
        return Date.fromisoformat(value[:10])
    except (ValueError, TypeError):
        return None

def main():
    processed = 0
    with psycopg.connect(DB) as conn:
        for species in SPECIES:
            for country in COUNTRIES:
                offset = 0
                while True:
                    response = requests.get(BASE, params={
                        "scientificName": species, "country": country,
                        "hasCoordinate": "true", "decimalLatitude": "40,47.5",
                        "decimalLongitude": "26,42.5", "limit": 300, "offset": offset
                    }, timeout=45)
                    response.raise_for_status()
                    payload = response.json()
                    records = payload.get("results", [])
                    if not records:
                        break
                    with conn.cursor() as cur:
                        for item in records:
                            lon, lat = item.get("decimalLongitude"), item.get("decimalLatitude")
                            if lon is None or lat is None:
                                continue
                            key = str(item.get("key"))
                            #date = (item.get("eventDate") or "")[:10] or None
                            date = parse_gbif_date(item.get("eventDate"))
                            cur.execute("""
                                INSERT INTO habitats
                                (source_record_id, scientific_name, species, observed_at,
                                 source, source_url, basis_of_record,
                                 coordinate_uncertainty_m, geom)
                                VALUES (%s,%s,%s,%s,'GBIF',%s,%s,%s,
                                        ST_SetSRID(ST_MakePoint(%s,%s),4326))
                                ON CONFLICT (source_record_id) DO NOTHING
                            """, (key, item.get("scientificName") or species, species, date,
                                  f"https://www.gbif.org/occurrence/{key}",
                                  item.get("basisOfRecord"),
                                  item.get("coordinateUncertaintyInMeters"), lon, lat))
                            processed += 1
                    conn.commit()
                    offset += len(records)
                    if offset >= payload.get("count", 0) or len(records) < 300:
                        break
    print(f"Processed {processed} GBIF records; duplicates ignored.")

if __name__ == "__main__":
    main()
