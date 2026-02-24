from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.database import engine, Base
from app.routes import auth, events, registrations, analytics, favorites

# Créer les tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Event Management API",
    description="API de gestion d'événements participatifs - Projet MIF10",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir les fichiers statiques (images)
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Routes
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(registrations.router)
app.include_router(analytics.router)
app.include_router(favorites.router)


@app.get("/")
def root():
    return {"message": "Event Management API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
