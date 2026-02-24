from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Event, Favorite, EventStatus
from app.schemas import FavoriteResponse, EventResponse

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.post("/{event_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajouter un événement aux favoris"""
    # Vérifier que l'événement existe
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    # Vérifier que l'événement n'est pas déjà en favori
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.event_id == event_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Événement déjà en favori")
    
    # Créer le favori
    favorite = Favorite(user_id=current_user.id, event_id=event_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    return {"message": "Événement ajouté aux favoris", "favorite_id": favorite.id}


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retirer un événement des favoris"""
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.event_id == event_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Favori non trouvé")
    
    db.delete(favorite)
    db.commit()
    
    return None


@router.get("/my-favorites")
def get_my_favorites(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupérer la liste de mes événements favoris"""
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Récupérer les événements associés
    event_ids = [fav.event_id for fav in favorites]
    events = db.query(Event).filter(Event.id.in_(event_ids)).all() if event_ids else []
    
    # Construire la réponse avec l'objet event complet
    result = []
    for favorite in favorites:
        event = next((e for e in events if e.id == favorite.event_id), None)
        if event:
            result.append({
                "id": favorite.id,
                "user_id": favorite.user_id,
                "event_id": favorite.event_id,
                "created_at": favorite.created_at,
                "event": {
                    "id": event.id,
                    "title": event.title,
                    "description": event.description,
                    "category": event.category,
                    "tags": event.tags or [],
                    "location": event.location,
                    "date_start": event.date_start,
                    "date_end": event.date_end,
                    "max_participants": event.max_participants,
                    "image_url": event.image_url,
                    "owner_id": event.owner_id,
                    "status": event.status,
                    "created_at": event.created_at,
                    "participants_count": len(event.registrations)
                }
            })
    
    return result


@router.get("/is-favorite/{event_id}")
def check_favorite(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vérifier si un événement est en favori"""
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.event_id == event_id
    ).first()
    
    return {"is_favorite": favorite is not None}
