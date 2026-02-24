import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
import uuid

# Configuration des dossiers d'upload
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
PROFILE_DIR = UPLOAD_DIR / "profiles"
EVENT_DIR = UPLOAD_DIR / "events"

# Extensions autorisées
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def validate_image(file: UploadFile) -> None:
    """Valider le type et la taille d'une image"""
    # Vérifier l'extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non autorisé. Extensions autorisées: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Vérifier la taille (si disponible)
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux. Taille maximale: {MAX_FILE_SIZE // (1024*1024)}MB"
        )


async def save_upload_file(upload_file: UploadFile, destination: Path) -> str:
    """Sauvegarder un fichier uploadé"""
    try:
        # Créer le dossier de destination s'il n'existe pas
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        # Sauvegarder le fichier
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        
        return str(destination)
    finally:
        upload_file.file.close()


async def save_profile_image(user_id: str, file: UploadFile) -> str:
    """Sauvegarder une image de profil"""
    validate_image(file)
    
    # Générer un nom de fichier unique
    file_ext = Path(file.filename).suffix.lower()
    filename = f"{user_id}_{uuid.uuid4()}{file_ext}"
    file_path = PROFILE_DIR / filename
    
    await save_upload_file(file, file_path)
    
    # Retourner le chemin relatif
    return f"uploads/profiles/{filename}"


async def save_event_image(event_id: str, file: UploadFile) -> str:
    """Sauvegarder une image d'événement"""
    validate_image(file)
    
    # Générer un nom de fichier unique
    file_ext = Path(file.filename).suffix.lower()
    filename = f"{event_id}_{uuid.uuid4()}{file_ext}"
    file_path = EVENT_DIR / filename
    
    await save_upload_file(file, file_path)
    
    # Retourner le chemin relatif
    return f"uploads/events/{filename}"


def delete_image(image_path: Optional[str]) -> None:
    """Supprimer une image"""
    if not image_path:
        return
    
    try:
        # Construire le chemin complet
        full_path = Path(__file__).parent.parent / image_path
        if full_path.exists():
            full_path.unlink()
    except Exception as e:
        # Ne pas lever d'erreur si la suppression échoue
        print(f"Erreur lors de la suppression de l'image: {e}")
