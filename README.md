# Project Amphitrite — How to use and get started

## Prerequisites
Docker with Compose, Python 3.12, PyCharm. A Copernicus Marine account is needed for SST ingestion.

## Start
```bash
docker compose up --build -d
docker compose ps
```

## Local Python environment (for ingestion scripts)
Windows PowerShell:
```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

For local scripts set `DATABASE_URL=postgresql://sentinel:YOUR_PASSWORD@localhost:5433/blacksea`.
The ingestion scripts load `.env` automatically when run from the project root.

## Import historical GBIF occurrences
```bash
python ingestion/import_gbif.py
```
This searches *Zostera marina* and *Zostera noltei* for selected Black Sea countries. GBIF records are historical occurrence points, not current habitat polygons. 

## Copernicus SST
Create a Copernicus Marine account and set `COPERNICUSMARINE_SERVICE_USERNAME` and `COPERNICUSMARINE_SERVICE_PASSWORD`.
Inspect dataset metadata:
```bash
copernicusmarine describe --contains SST_BS_SST_L4_NRT_OBSERVATIONS_010_006
```
Set `CMEMS_DATASET_ID` and `CMEMS_VARIABLE` to the exact dataset and variable returned by metadata. The default dataset setting is a candidate high-resolution daily SST dataset; verify it before running.
```bash
python ingestion/import_copernicus.py
```
The default request uses a small Varna-area bounding box and a short historical date range. 

## Generated vessel positions for demo purposes
```bash
python ingestion/generate_ais.py
```
These are synthetic AIS-like tracks, not actual vessel observations.

## Underwater imagery
Copy permitted sample images to `data/raw/images/`, then:
```bash
python ingestion/import_images.py
```

## Verify
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/habitats
curl http://localhost:8000/api/v1/environment
curl http://localhost:8000/api/v1/vessels
curl http://localhost:8000/api/v1/images
```

## Notes
- Real and simulated observations are kept distinct.
- GBIF occurrence points do not establish current meadow boundaries.

