from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.models import Event, EventStatus, User, UserRole, Registration, RegistrationStatus
from app.schemas import EventCreate, EventUpdate, EventResponse, EventReject
from app.auth import get_current_user, require_organizer, require_admin
from app.utils import save_event_image, delete_image

router = APIRouter(prefix="/api/events", tags=["Événements"])


def get_participants_count(db: Session, event_id: str) -> int:
    return db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status != RegistrationStatus.CANCELLED
    ).count()


@router.get("/", response_model=List[EventResponse])
def list_events(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Recherche par titre"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    location: Optional[str] = Query(None, description="Filtrer par lieu"),
    skip: int = 0,
    limit: int = 20
):
    """Lister les événements publiés avec recherche et filtres"""
    query = db.query(Event).filter(Event.status == EventStatus.PUBLISHED)
    
    if search:
        query = query.filter(or_(
            Event.title.ilike(f"%{search}%"),
            Event.description.ilike(f"%{search}%")
        ))
    if category:
        query = query.filter(Event.category == category)
    if location:
        query = query.filter(Event.location.ilike(f"%{location}%"))
    
    events = query.order_by(Event.date_start.asc()).offset(skip).limit(limit).all()
    
    # Ajouter le count des participants
    result = []
    for event in events:
        event_dict = EventResponse.model_validate(event).model_dump()
        event_dict["participants_count"] = get_participants_count(db, event.id)
        result.append(EventResponse(**event_dict))
    
    return result


@router.get("/my-events", response_model=List[EventResponse])
def get_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir mes événements créés (organisateur) ou tous les événements (admin)"""
    if current_user.role == UserRole.ADMIN:
        events = db.query(Event).all()
    else:
        events = db.query(Event).filter(Event.owner_id == current_user.id).all()
        
    result = []
    for event in events:
        event_dict = EventResponse.model_validate(event).model_dump()
        event_dict["participants_count"] = get_participants_count(db, event.id)
        result.append(EventResponse(**event_dict))
    return result


@router.get("/pending", response_model=List[EventResponse])
def get_pending_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtenir les événements en attente de validation (admin)"""
    events = db.query(Event).filter(Event.status == EventStatus.PENDING).all()
    return events


@router.get("/recommendations", response_model=List[EventResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10
):
    """Obtenir des recommandations personnalisées"""
    # Récupérer les catégories des events auxquels l'user s'est inscrit
    user_categories = db.query(Event.category).join(Registration).filter(
        Registration.user_id == current_user.id
    ).distinct().all()
    user_categories = [c[0] for c in user_categories]
    
    # Récupérer les events déjà inscrits
    registered_event_ids = db.query(Registration.event_id).filter(
        Registration.user_id == current_user.id
    ).all()
    registered_event_ids = [e[0] for e in registered_event_ids]
    
    # Recommander des events dans les mêmes catégories
    query = db.query(Event).filter(
        Event.status == EventStatus.PUBLISHED,
        Event.date_start > datetime.utcnow(),
        Event.id.notin_(registered_event_ids)
    )
    
    if user_categories:
        query = query.filter(Event.category.in_(user_categories))
    
    events = query.order_by(Event.date_start.asc()).limit(limit).all()
    
    # Si pas assez, compléter avec des events populaires
    if len(events) < limit:
        remaining = limit - len(events)
        popular = db.query(Event).filter(
            Event.status == EventStatus.PUBLISHED,
            Event.date_start > datetime.utcnow(),
            Event.id.notin_([e.id for e in events] + registered_event_ids)
        ).limit(remaining).all()
        events.extend(popular)
    
    return events


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    """Obtenir le détail d'un événement"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict["participants_count"] = get_participants_count(db, event.id)
    return EventResponse(**event_dict)


@router.get("/{event_id}/similar", response_model=List[EventResponse])
def get_similar_events(event_id: str, db: Session = Depends(get_db), limit: int = 5):
    """Obtenir des événements similaires"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    similar = db.query(Event).filter(
        Event.id != event_id,
        Event.status == EventStatus.PUBLISHED,
        or_(
            Event.category == event.category,
            Event.location == event.location
        )
    ).limit(limit).all()
    
    return similar


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer)
):
    """Créer un nouvel événement (organisateur/admin)"""
    event = Event(
        title=event_data.title,
        description=event_data.description,
        category=event_data.category,
        tags=event_data.tags,
        location=event_data.location,
        date_start=event_data.date_start,
        date_end=event_data.date_end,
        max_participants=event_data.max_participants,
        image_url=event_data.image_url,
        owner_id=current_user.id,
        status=EventStatus.PENDING
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/image", response_model=EventResponse)
async def upload_event_image(
    event_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Uploader une image de couverture pour un événement"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    # Vérifier les permissions
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Supprimer l'ancienne image si elle existe
    if event.image_url:
        delete_image(event.image_url)
    
    # Sauvegarder la nouvelle image
    image_path = await save_event_image(event.id, file)
    
    # Mettre à jour l'événement
    event.image_url = image_path
    db.commit()
    db.refresh(event)
    
    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict["participants_count"] = get_participants_count(db, event.id)
    return EventResponse(**event_dict)


@router.delete("/{event_id}/image", status_code=status.HTTP_200_OK)
def delete_event_image(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer l'image de couverture d'un événement"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    # Vérifier les permissions
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if not event.image_url:
        raise HTTPException(status_code=400, detail="Aucune image à supprimer")
    
    delete_image(event.image_url)
    event.image_url = None
    db.commit()
    
    return {"message": "Image supprimée avec succès"}


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifier un événement (propriétaire ou admin)"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    update_data = event_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
    
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprimer un événement (propriétaire ou admin)"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Vérifier s'il y a des inscriptions (non annulées)
    registrations_count = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status != RegistrationStatus.CANCELLED
    ).count()
    
    if registrations_count > 0:
        raise HTTPException(status_code=400, detail="Impossible de supprimer un événement avec des inscrits. Annulez-le plutôt.")
    
    # Supprimer l'image de l'événement
    if event.image_url:
        delete_image(event.image_url)
    
    db.delete(event)
    db.commit()


@router.post("/{event_id}/approve", response_model=EventResponse)
def approve_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Approuver un événement (admin)"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="L'événement n'est pas en attente")
    
    event.status = EventStatus.PUBLISHED
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/reject", response_model=EventResponse)
def reject_event(
    event_id: str,
    reject_data: EventReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Rejeter un événement (admin)"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="L'événement n'est pas en attente")
    
    event.status = EventStatus.REJECTED
    event.rejection_reason = reject_data.reason
    db.commit()
    db.refresh(event)
    return event
