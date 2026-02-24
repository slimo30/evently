import enum
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    USER = "USER"
    EVENT_OWNER = "EVENT_OWNER"
    ADMIN = "ADMIN"


class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class RegistrationStatus(str, enum.Enum):
    REGISTERED = "REGISTERED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    profile_image = Column(String, nullable=True)  # Chemin local de l'image de profil
    role = Column(Enum(UserRole), default=UserRole.USER)
    preferences = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    events = relationship("Event", back_populates="owner")
    registrations = relationship("Registration", back_populates="user")


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, index=True)
    tags = Column(JSON, default=[])
    location = Column(String)
    date_start = Column(DateTime(timezone=True), nullable=False)
    date_end = Column(DateTime(timezone=True), nullable=False)
    max_participants = Column(Integer, default=100)
    image_url = Column(String)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.PENDING)
    rejection_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    owner = relationship("User", back_populates="events")
    registrations = relationship("Registration", back_populates="event")


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    qr_code_url = Column(String)
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.REGISTERED)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    checked_in_at = Column(DateTime(timezone=True))
    checked_out_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))

    # Relations
    user = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    user = relationship("User")
    event = relationship("Event")
