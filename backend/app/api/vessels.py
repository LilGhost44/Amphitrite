from fastapi import APIRouter
from app.database.connection import get_connection

router = APIRouter(prefix="/api/v1/vessels", tags=["vessels"])

@router.get("")
def list_vessels(limit: int = 3000):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, vessel_id, observed_at, speed_knots, heading, is_simulated,
                   ST_X(geom) AS longitude, ST_Y(geom) AS latitude
            FROM vessel_positions ORDER BY observed_at DESC LIMIT %s
        """, (limit,)).fetchall()
    return {"type": "FeatureCollection", "features": [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
        "properties": {
            "id": r["id"], "vessel_id": r["vessel_id"],
            "observed_at": r["observed_at"].isoformat(),
            "speed_knots": r["speed_knots"], "heading": r["heading"],
            "is_simulated": r["is_simulated"]
        }
    } for r in rows]}
