from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
import qrcode
import io
from app.database import get_db
from app.models import Event, EventStatus, User, UserRole, Registration, RegistrationStatus
from app.schemas import RegistrationResponse, ParticipantResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/registrations", tags=["Inscriptions"])


@router.post("/{event_id}", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_to_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """S'inscrire à un événement"""
    # Vérifier que l'event existe et est publié
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    if event.status != EventStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Événement non disponible")
    
    # Vérifier si déjà inscrit
    existing = db.query(Registration).filter(
        Registration.user_id == current_user.id,
        Registration.event_id == event_id,
        Registration.status != RegistrationStatus.CANCELLED
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Déjà inscrit à cet événement")
    
    # Vérifier la limite de participants
    current_count = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status != RegistrationStatus.CANCELLED
    ).count()
    if current_count >= event.max_participants:
        raise HTTPException(status_code=400, detail="Événement complet")
    
    # Créer l'inscription
    registration = Registration(
        user_id=current_user.id,
        event_id=event_id,
        status=RegistrationStatus.REGISTERED
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    
    # Générer l'URL du QR code
    registration.qr_code_url = f"/api/registrations/{registration.id}/qr-code"
    db.commit()
    db.refresh(registration)
    
    return registration


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_registration(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Annuler son inscription à un événement"""
    registration = db.query(Registration).filter(
        Registration.user_id == current_user.id,
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.REGISTERED
    ).first()
    
    if not registration:
        raise HTTPException(status_code=404, detail="Inscription non trouvée")
    
    registration.status = RegistrationStatus.CANCELLED
    registration.cancelled_at = datetime.now(timezone.utc)
    db.commit()


@router.get("/my-registrations", response_model=List[RegistrationResponse])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir mes inscriptions"""
    registrations = db.query(Registration).filter(
        Registration.user_id == current_user.id
    ).all()
    return registrations


@router.get("/{registration_id}/qr-code")
def get_qr_code(
    registration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Télécharger le QR code de son inscription"""
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Inscription non trouvée")
    
    # Vérifier que c'est le propriétaire de l'inscription ou admin
    if registration.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Générer le QR code
    qr_data = f"REG:{registration_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Retourner l'image
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")


@router.post("/scan/{registration_id}", response_model=RegistrationResponse)
def scan_qr_code(
    registration_id: str,
    event_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Scanner un QR code (check-in/check-out automatique) - Organisateur uniquement.
    
    Optionally provide event_id as a query parameter to validate the registration
    belongs to a specific event before performing check-in/out.
    """
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Inscription non trouvée")
    
    # If event_id is provided, validate the registration belongs to that event
    if event_id and registration.event_id != event_id:
        raise HTTPException(
            status_code=400,
            detail="Cette inscription n'appartient pas à cet événement"
        )
    
    # Vérifier que l'utilisateur est l'organisateur de l'event ou admin
    event = db.query(Event).filter(Event.id == registration.event_id).first()
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Seul l'organisateur peut scanner les QR codes")
    
    # Handle cancelled registrations
    if registration.status == RegistrationStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cette inscription a été annulée")
    
    # Déterminer si c'est un check-in ou check-out basé sur le statut actuel
    if registration.status == RegistrationStatus.REGISTERED:
        # First scan: Check-in
        registration.status = RegistrationStatus.CHECKED_IN
        registration.checked_in_at = datetime.now(timezone.utc)
    elif registration.status == RegistrationStatus.CHECKED_IN:
        # Second scan: Check-out
        registration.status = RegistrationStatus.CHECKED_OUT
        registration.checked_out_at = datetime.now(timezone.utc)
    elif registration.status == RegistrationStatus.CHECKED_OUT:
        # Third scan: Re-check-in (participant came back)
        registration.status = RegistrationStatus.CHECKED_IN
        registration.checked_in_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(registration)
    return registration


@router.post("/{registration_id}/check-in", response_model=RegistrationResponse)
def manual_check_in(
    registration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check-in manuel d'un participant - Organisateur uniquement"""
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Inscription non trouvée")
    
    event = db.query(Event).filter(Event.id == registration.event_id).first()
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if registration.status != RegistrationStatus.REGISTERED:
        raise HTTPException(status_code=400, detail="Le participant n'est pas en statut inscrit")
    
    registration.status = RegistrationStatus.CHECKED_IN
    registration.checked_in_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(registration)
    return registration


@router.post("/{registration_id}/check-out", response_model=RegistrationResponse)
def manual_check_out(
    registration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check-out manuel d'un participant - Organisateur uniquement"""
    registration = db.query(Registration).filter(Registration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Inscription non trouvée")
    
    event = db.query(Event).filter(Event.id == registration.event_id).first()
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if registration.status != RegistrationStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="Le participant n'est pas checked-in")
    
    registration.status = RegistrationStatus.CHECKED_OUT
    registration.checked_out_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(registration)
    return registration


@router.get("/event/{event_id}/participants", response_model=List[ParticipantResponse])
def get_event_participants(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir la liste des participants d'un événement - Organisateur uniquement"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    registrations = db.query(Registration).filter(
        Registration.event_id == event_id
    ).all()
    
    participants = []
    for reg in registrations:
        user = db.query(User).filter(User.id == reg.user_id).first()
        participants.append(ParticipantResponse(
            id=reg.id,
            user_name=user.name,
            user_email=user.email,
            status=reg.status,
            registered_at=reg.registered_at,
            checked_in_at=reg.checked_in_at,
            checked_out_at=reg.checked_out_at
        ))
    
    return participants


@router.get("/event/{event_id}/live", response_model=dict)
def get_live_presence(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir la présence en temps réel - Organisateur uniquement"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    total = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status != RegistrationStatus.CANCELLED
    ).count()
    
    checked_in = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.CHECKED_IN
    ).count()
    
    checked_out = db.query(Registration).filter(
        Registration.event_id == event_id,
        Registration.status == RegistrationStatus.CHECKED_OUT
    ).count()
    
    return {
        "total_registered": total,
        "currently_present": checked_in,
        "checked_out": checked_out,
        "not_arrived": total - checked_in - checked_out
    }


@router.get("/event/{event_id}/history", response_model=List[dict])
def get_event_history(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtenir l'historique complet des check-in/check-out - Organisateur uniquement"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    registrations = db.query(Registration).filter(
        Registration.event_id == event_id
    ).all()
    
    history = []
    for reg in registrations:
        user = db.query(User).filter(User.id == reg.user_id).first()
        history.append({
            "id": reg.id,
            "user_id": reg.user_id,
            "user_name": user.name,
            "user_email": user.email,
            "user_profile_image": user.profile_image,
            "status": reg.status.value,
            "registered_at": reg.registered_at.isoformat() if reg.registered_at else None,
            "checked_in_at": reg.checked_in_at.isoformat() if reg.checked_in_at else None,
            "checked_out_at": reg.checked_out_at.isoformat() if reg.checked_out_at else None,
            "cancelled_at": reg.cancelled_at.isoformat() if reg.cancelled_at else None,
        })
    
    return history
