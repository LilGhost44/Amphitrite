from fastapi import APIRouter
from app.database.connection import get_connection

router = APIRouter(prefix="/api/v1/habitats", tags=["habitats"])

@router.get("")
def list_habitats(limit: int = 1000):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, scientific_name, species, observed_at, source,
                   ST_X(geom) AS longitude, ST_Y(geom) AS latitude
            FROM habitats ORDER BY observed_at DESC NULLS LAST LIMIT %s
        """, (limit,)).fetchall()
    return {"type": "FeatureCollection", "features": [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
        "properties": {
            "id": r["id"], "scientific_name": r["scientific_name"],
            "species": r["species"],
            "observed_at": r["observed_at"].isoformat() if r["observed_at"] else None,
            "source": r["source"]
        }
    } for r in rows]}
