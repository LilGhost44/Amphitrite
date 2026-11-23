from dotenv import load_dotenv
load_dotenv()
import os
from pathlib import Path
from datetime import datetime, timezone
import copernicusmarine
import xarray as xr
import psycopg


load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        ".env"
    ),
    override=True
)

DB = os.getenv("DATABASE_URL", "postgresql://amphitrite:23221030@localhost:5433/emmaDB")
OUT = Path(os.getenv("DATA_DIR", "data")) / "raw" / "copernicus"
DATASET = os.getenv("CMEMS_DATASET_ID", "SST_BS_SSTA_L4_NRT_OBSERVATIONS_010_006_b")
VARIABLE = os.getenv("CMEMS_VARIABLE", "").strip()

def main():
    if not VARIABLE:
        raise SystemExit(
            "Set CMEMS_VARIABLE after checking: "
            f"copernicusmarine describe --contains {DATASET}"
        )
    OUT.mkdir(parents=True, exist_ok=True)
    result = copernicusmarine.subset(
        dataset_id=DATASET, variables=[VARIABLE],
        minimum_longitude=float(os.getenv("BBOX_MIN_LON","27.5")),
        maximum_longitude=float(os.getenv("BBOX_MAX_LON","29.0")),
        minimum_latitude=float(os.getenv("BBOX_MIN_LAT","42.4")),
        maximum_latitude=float(os.getenv("BBOX_MAX_LAT","43.5")),
        start_datetime=os.getenv("CMEMS_START_DATE","2025-08-01"),
        end_datetime=os.getenv("CMEMS_END_DATE","2025-08-03"),
        output_directory=str(OUT), file_format="netcdf", overwrite=False
    )
    candidates = sorted(OUT.glob("*.nc"), key=lambda p:p.stat().st_mtime, reverse=True)
    if not candidates:
        raise RuntimeError(f"No NetCDF output found. Toolbox returned: {result}")
    path = candidates[0]
    ds = xr.open_dataset(path)
    var = ds[VARIABLE]
    lon = next((n for n in ("longitude","lon","LONGITUDE") if n in ds.coords), None)
    lat = next((n for n in ("latitude","lat","LATITUDE") if n in ds.coords), None)
    time = next((n for n in ("time","TIME") if n in ds.coords), None)
    if not lon or not lat:
        raise RuntimeError(f"Cannot identify coordinate names: {list(ds.coords)}")
    frame = var.to_dataframe(name="value").reset_index().dropna(subset=["value",lon,lat]).head(5000)
    rows = []
    unit = var.attrs.get("units","unknown")
    for _, r in frame.iterrows():
        observed = r[time] if time and time in frame else datetime.now(timezone.utc)
        if hasattr(observed,"to_pydatetime"):
            observed = observed.to_pydatetime()
        rows.append((observed,VARIABLE,float(r["value"]),unit,"Copernicus Marine",
                     DATASET,"source_grid_value",float(r[lon]),float(r[lat])))
    with psycopg.connect(DB) as conn:
        with conn.cursor() as cur:
            cur.executemany("""
                INSERT INTO environmental_observations
                (observed_at,variable,value,unit,source,source_dataset,quality_flag,geom)
                VALUES (%s,%s,%s,%s,%s,%s,%s,ST_SetSRID(ST_MakePoint(%s,%s),4326))
            """, rows)
        conn.commit()
    ds.close()
    print(f"Imported {len(rows)} Copernicus grid observations from {path}")

if __name__ == "__main__":
    main()
