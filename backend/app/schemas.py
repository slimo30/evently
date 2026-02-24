from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, EventStatus, RegistrationStatus


# ============== AUTH SCHEMAS ==============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserAdminCreate(UserCreate):
    role: UserRole = UserRole.USER


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    preferences: Optional[dict] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    profile_image: Optional[str] = None
    role: UserRole
    preferences: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# ============== EVENT SCHEMAS ==============
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    tags: List[str] = []
    location: str
    date_start: datetime
    date_end: datetime
    max_participants: int = 100
    image_url: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    location: Optional[str] = None
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    max_participants: Optional[int] = None
    image_url: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    tags: List[str]
    location: str
    date_start: datetime
    date_end: datetime
    max_participants: int
    image_url: Optional[str]
    owner_id: str
    status: EventStatus
    created_at: datetime
    participants_count: int = 0

    class Config:
        from_attributes = True


class EventReject(BaseModel):
    reason: str


# ============== REGISTRATION SCHEMAS ==============
class RegistrationResponse(BaseModel):
    id: str
    user_id: str
    event_id: str
    qr_code_url: Optional[str]
    status: RegistrationStatus
    registered_at: datetime
    checked_in_at: Optional[datetime]
    checked_out_at: Optional[datetime]

    class Config:
        from_attributes = True


class ParticipantResponse(BaseModel):
    id: str
    user_name: str
    user_email: str
    status: RegistrationStatus
    registered_at: datetime
    checked_in_at: Optional[datetime]
    checked_out_at: Optional[datetime]


# ============== ANALYTICS SCHEMAS ==============
class GlobalAnalytics(BaseModel):
    total_users: int
    total_events: int
    total_registrations: int
    events_by_status: dict
    registrations_by_status: dict


class EventAnalytics(BaseModel):
    event_id: str
    event_title: str
    date_start: datetime
    date_end: datetime
    location: str
    max_participants: int
    total_registrations: int
    checked_in_count: int
    checked_out_count: int
    no_show_count: int
    fill_rate: float


# ============== FAVORITE SCHEMAS ==============
class FavoriteResponse(BaseModel):
    id: str
    user_id: str
    event_id: str
    created_at: datetime
    event: EventResponse

    class Config:
        from_attributes = True
