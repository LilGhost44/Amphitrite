from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.api import habitats, environment, vessels, images

app = FastAPI(title="Amphitrite API", version="0.1.0",
              description="Marine environmental data foundation for Black Sea seagrass monitoring.")
app.include_router(habitats.router)
app.include_router(environment.router)
app.include_router(vessels.router)
app.include_router(images.router)

FRONTEND_DIR = Path("/app/frontend")
app.mount("/ui", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

@app.get("/health")
def health():
    return {"status": "ok", "service": "amphitrite-api"}

@app.get("/")
def root():
    return FileResponse(FRONTEND_DIR / "index.html")
