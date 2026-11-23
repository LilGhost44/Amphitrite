from fastapi import APIRouter
from app.database.connection import get_connection

router = APIRouter(prefix="/api/v1/environment", tags=["environment"])

@router.get("")
def list_environment(limit: int = 3000):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, observed_at, variable, value, unit, source, source_dataset,
                   quality_flag, is_simulated, ST_X(geom) AS longitude,
                   ST_Y(geom) AS latitude
            FROM environmental_observations ORDER BY observed_at DESC LIMIT %s
        """, (limit,)).fetchall()
    return {"type": "FeatureCollection", "features": [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
        "properties": {
            "id": r["id"], "observed_at": r["observed_at"].isoformat(),
            "variable": r["variable"], "value": r["value"], "unit": r["unit"],
            "source": r["source"], "source_dataset": r["source_dataset"],
            "quality_flag": r["quality_flag"], "is_simulated": r["is_simulated"]
        }
    } for r in rows]}
