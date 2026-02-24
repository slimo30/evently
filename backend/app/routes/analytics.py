from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models import Event, EventStatus, User, UserRole, Registration, RegistrationStatus
from app.schemas import GlobalAnalytics, EventAnalytics
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/global", response_model=GlobalAnalytics)
def get_global_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtenir les statistiques globales de la plateforme - Admin uniquement"""
    total_users = db.query(User).count()
    total_events = db.query(Event).count()
    total_registrations = db.query(Registration).count()
    
    # Events par statut
    events_by_status = {}
    for status in EventStatus:
        count = db.query(Event).filter(Event.status == status).count()
        events_by_status[status.value] = count
    
    # Registrations par statut
    registrations_by_status = {}
    for status in RegistrationStatus:
        count = db.query(Registration).filter(Registration.status == status).count()
        registrations_by_status[status.value] = count
    
    return GlobalAnalytics(
        total_users=total_users,
        total_events=total_events,
        total_registrations=total_registrations,
        events_by_status=events_by_status,
        registrations_by_status=registrations_by_status
    )


@router.get("/my-dashboard")
def get_my_dashboard(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir le dashboard de mes événements (ou d'un autre utilisateur si admin)"""
    target_user_id = current_user.id
    if current_user.role == UserRole.ADMIN:
        if user_id:
            target_user_id = user_id
            my_events = db.query(Event).filter(Event.owner_id == target_user_id).all()
        else:
            # For admin, default to ALL events if no specific user is targeted
            my_events = db.query(Event).all()
    else:
        # Mes events
        my_events = db.query(Event).filter(Event.owner_id == current_user.id).all()
    
    total_events = len(my_events)
    total_registrations = 0
    total_checked_in = 0
    total_checked_out = 0
    
    events_stats = []
    for event in my_events:
        registrations = db.query(Registration).filter(
            Registration.event_id == event.id,
            Registration.status != RegistrationStatus.CANCELLED
        ).count()
        
        checked_in = db.query(Registration).filter(
            Registration.event_id == event.id,
            Registration.status.in_([RegistrationStatus.CHECKED_IN, RegistrationStatus.CHECKED_OUT])
        ).count()
        
        total_registrations += registrations
        total_checked_in += checked_in
        
        events_stats.append({
            "event_id": event.id,
            "title": event.title,
            "status": event.status.value,
            "registrations": registrations,
            "max_participants": event.max_participants,
            "fill_rate": round((registrations / event.max_participants) * 100, 1) if event.max_participants > 0 else 0
        })
    
    return {
        "total_events": total_events,
        "total_registrations": total_registrations,
        "total_checked_in": total_checked_in,
        "events": events_stats
    }


@router.get("/event/{event_id}", response_model=EventAnalytics)
def get_event_analytics(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir les statistiques d'un événement - Organisateur uniquement"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    total_registrations = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status != RegistrationStatus.CANCELLED
    ).count()
    
    checked_in_count = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status.in_([RegistrationStatus.CHECKED_IN, RegistrationStatus.CHECKED_OUT])
    ).count()
    
    checked_out_count = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.CHECKED_OUT
    ).count()
    
    no_show_count = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.NO_SHOW
    ).count()
    
    fill_rate = round((total_registrations / event.max_participants) * 100, 1) if event.max_participants > 0 else 0
    
    return EventAnalytics(
        event_id=event_id,
        event_title=event.title,
        date_start=event.date_start,
        date_end=event.date_end,
        location=event.location,
        max_participants=event.max_participants,
        total_registrations=total_registrations,
        checked_in_count=checked_in_count,
        checked_out_count=checked_out_count,
        no_show_count=no_show_count,
        fill_rate=fill_rate
    )
