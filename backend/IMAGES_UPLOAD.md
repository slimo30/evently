# Documentation - Upload d'Images

## 📸 Vue d'ensemble

Le système d'upload d'images permet aux utilisateurs de télécharger :

1. **Photos de profil** : Image personnelle de l'utilisateur
2. **Images d'événements** : Photo principale illustrant un événement

## 🔧 Configuration

### Paramètres (app/utils.py)

```python
from pathlib import Path

# Configuration des dossiers d'upload
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
PROFILE_DIR = UPLOAD_DIR / "profiles"
EVENT_DIR = UPLOAD_DIR / "events"

# Extensions autorisées
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# Taille maximale : 5 MB
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB en bytes
```

### Structure des dossiers

```
uploads/
├── profiles/          # Photos de profil utilisateur
│   └── {user_id}_{uuid}.jpg
└── events/           # Images des événements
    └── {event_id}_{uuid}.jpg
```

## 🛠️ Fonctions utilitaires (app/utils.py)

### validate_image()

Valide un fichier image uploadé.

```python
def validate_image(file: UploadFile) -> None:
    """
    Valide un fichier image uploadé.

    Vérifie :
    - Extension du fichier (.jpg, .jpeg, .png, .gif, .webp)
    - Taille du fichier (max 5 MB)

    Raises:
        HTTPException(400): Si la validation échoue
    """
```

**Exemple d'utilisation :**

```python
from app.utils import validate_image

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Validation automatique
    validate_image(file)

    # Si on arrive ici, le fichier est valide
    # Continuer le traitement...
```

**Erreurs possibles :**

- `"Type de fichier non autorisé. Extensions autorisées: .jpg, .jpeg, .png, .gif, .webp"`
- `"Fichier trop volumineux. Taille maximale: 5MB"`

### save_profile_image()

Sauvegarde une image de profil utilisateur.

```python
async def save_profile_image(user_id: str, file: UploadFile) -> str:
    """
    Sauvegarde une image de profil utilisateur.

    Args:
        user_id: UUID de l'utilisateur
        file: Le fichier à sauvegarder

    Returns:
        str: Chemin relatif du fichier sauvegardé
             Format: "uploads/profiles/{user_id}_{uuid}.{ext}"

    Raises:
        HTTPException(400): Si la validation échoue
    """
```

**Comportement :**

1. Valide l'image (type et taille)
2. Crée le répertoire `uploads/profiles/` si nécessaire
3. Génère un nom de fichier unique : `{user_id}_{uuid}.{extension}`
4. Sauvegarde le fichier
5. Retourne le chemin relatif

**Exemple :**

```python
from app.utils import save_profile_image, delete_image

@router.post("/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Supprimer l'ancienne image si elle existe
    if current_user.profile_image:
        delete_image(current_user.profile_image)
    
    # Sauvegarder la nouvelle image
    image_path = await save_profile_image(current_user.id, file)
    # Retourne: "uploads/profiles/abc-123_def-456.jpg"

    # Mettre à jour la base de données
    current_user.profile_image = image_path
    db.commit()
    db.refresh(current_user)

    return current_user
```

### save_event_image()

Sauvegarde une image d'événement.

```python
async def save_event_image(event_id: str, file: UploadFile) -> str:
    """
    Sauvegarde une image d'événement.

    Args:
        event_id: UUID de l'événement
        file: Le fichier à sauvegarder

    Returns:
        str: Chemin relatif du fichier sauvegardé
             Format: "uploads/events/{event_id}_{uuid}.{ext}"

    Raises:
        HTTPException(400): Si la validation échoue
    """
```

### delete_image()

Supprime un fichier du système de fichiers.

```python
def delete_image(image_path: Optional[str]) -> None:
    """
    Supprime une image de façon sécurisée.

    Args:
        image_path: Chemin relatif du fichier
                   Format: "uploads/{type}/{filename}"

    Note:
        Ne lève pas d'exception si le fichier n'existe pas.
        Gère les erreurs silencieusement (print uniquement).
    """
```

**Exemple :**

```python
from app.utils import delete_image

@router.delete("/profile-image")
async def delete_profile_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Supprimer l'image si elle existe
    if current_user.profile_image:
        delete_image(current_user.profile_image)
        current_user.profile_image = None
        db.commit()

    return {"message": "Image de profil supprimée avec succès"}
```

## 📷 Upload de photo de profil

### Endpoint: POST /api/auth/me/profile-image

**Permissions :** Utilisateur authentifié

**Request :**

```http
POST /api/auth/me/profile-image
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

file: [image file]
```

**Implémentation (app/routes/auth.py) :**

```python
@router.post("/me/profile-image", response_model=UserResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploader une image de profil"""
    # Supprimer l'ancienne image si elle existe
    if current_user.profile_image:
        delete_image(current_user.profile_image)
    
    # Sauvegarder la nouvelle image
    image_path = await save_profile_image(current_user.id, file)
    
    # Mettre à jour l'utilisateur
    current_user.profile_image = image_path
    db.commit()
    db.refresh(current_user)
    
    return current_user
```

**Réponse (200 OK) :**

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "profile_image": "uploads/profiles/user-id_uuid.jpg",
  "role": "USER",
  "preferences": {},
  "created_at": "2026-02-24T12:00:00Z"
}
```

**Cas d'erreur :**

```json
// 400 Bad Request
{
  "detail": "Type de fichier non autorisé. Extensions autorisées: .jpg, .jpeg, .png, .gif, .webp"
}

// 400 Bad Request
{
  "detail": "Fichier trop volumineux. Taille maximale: 5MB"
}

// 401 Unauthorized
{
  "detail": "Could not validate credentials"
}
```

### Endpoint: DELETE /api/auth/me/profile-image

**Permissions :** Utilisateur authentifié

**Request :**

```http
DELETE /api/auth/me/profile-image
Authorization: Bearer {jwt_token}
```

**Implémentation :**

```python
@router.delete("/me/profile-image", status_code=status.HTTP_200_OK)
def delete_profile_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer l'image de profil"""
    if not current_user.profile_image:
        raise HTTPException(
            status_code=400, 
            detail="Aucune image de profil à supprimer"
        )
    
    delete_image(current_user.profile_image)
    current_user.profile_image = None
    db.commit()
    
    return {"message": "Image de profil supprimée avec succès"}
```

**Réponse (200 OK) :**

```json
{
  "message": "Image de profil supprimée avec succès"
}
```

**Erreur (400 Bad Request) :**

```json
{
  "detail": "Aucune image de profil à supprimer"
}
```

## 🎉 Upload d'image d'événement

### Endpoint: POST /api/events/{event_id}/image

**Permissions :** Propriétaire de l'événement ou Admin

**Request :**

```http
POST /api/events/{event_id}/image
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

file: [image file]
```

**Implémentation (app/routes/events.py) :**

```python
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
```

**Réponse (200 OK) :**

```json
{
  "id": "event-uuid",
  "title": "Mon événement",
  "description": "Description...",
  "category": "CONCERT",
  "tags": ["musique", "live"],
  "location": "Paris",
  "date_start": "2026-03-15T20:00:00Z",
  "date_end": "2026-03-15T23:00:00Z",
  "max_participants": 100,
  "image_url": "uploads/events/event-id_uuid.jpg",
  "owner_id": "user-uuid",
  "status": "PENDING",
  "participants_count": 0,
  "created_at": "2026-02-24T12:00:00Z"
}
```

**Cas d'erreur :**

```json
// 404 Not Found
{
  "detail": "Événement non trouvé"
}

// 403 Forbidden
{
  "detail": "Non autorisé"
}

// 400 Bad Request
{
  "detail": "Type de fichier non autorisé. Extensions autorisées: .jpg, .jpeg, .png, .gif, .webp"
}

// 400 Bad Request
{
  "detail": "Fichier trop volumineux. Taille maximale: 5MB"
}
```

### Endpoint: DELETE /api/events/{event_id}/image

**Permissions :** Propriétaire de l'événement ou Admin

**Request :**

```http
DELETE /api/events/{event_id}/image
Authorization: Bearer {jwt_token}
```

**Implémentation :**

```python
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
```

**Réponse (200 OK) :**

```json
{
  "message": "Image supprimée avec succès"
}
```

**Cas d'erreur :**

```json
// 404 Not Found
{
  "detail": "Événement non trouvé"
}

// 403 Forbidden
{
  "detail": "Non autorisé"
}

// 400 Bad Request
{
  "detail": "Aucune image à supprimer"
}
```

## 🧪 Tests

### Test avec cURL

**Upload d'image de profil :**

```bash
curl -X POST http://localhost:8000/api/auth/me/profile-image \
  -H "Authorization: Bearer {your_token}" \
  -F "file=@/path/to/image.jpg"
```

**Upload d'image d'événement :**

```bash
curl -X POST http://localhost:8000/api/events/{event_id}/image \
  -H "Authorization: Bearer {your_token}" \
  -F "file=@/path/to/event-image.jpg"
```

**Suppression d'image de profil :**

```bash
curl -X DELETE http://localhost:8000/api/auth/me/profile-image \
  -H "Authorization: Bearer {your_token}"
```

### Tests unitaires (test.py)

Les tests incluent :
- Validation du type de fichier (extensions autorisées)
- Validation de la taille (max 5MB)
- Upload et suppression d'image de profil
- Upload et suppression d'image d'événement
- Gestion des permissions

## 🔒 Sécurité

### Validations implémentées

1. **Extension de fichier** : Seules les extensions `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` sont autorisées
2. **Taille de fichier** : Maximum 5 MB
3. **Authentification** : Toutes les routes nécessitent un JWT valide
4. **Autorisation** : 
   - Photo de profil : Seul l'utilisateur connecté peut modifier sa propre photo
   - Image d'événement : Seul le propriétaire ou un admin peut modifier l'image
5. **Noms de fichiers uniques** : Utilisation d'UUID pour éviter les conflits
6. **Suppression sécurisée** : Les anciennes images sont automatiquement supprimées lors d'un remplacement

### Recommandations supplémentaires

Pour une production robuste, considérez d'ajouter :

1. **Validation du contenu** : Vérifier que le fichier est vraiment une image (pas juste l'extension)
2. **Compression automatique** : Redimensionner et optimiser les images
3. **Stockage cloud** : Utiliser S3, Cloudinary, ou similaire au lieu du système de fichiers local
4. **Rate limiting** : Limiter le nombre d'uploads par utilisateur/heure
5. **Scan antivirus** : Scanner les fichiers uploadés pour détecter les malwares
6. **CDN** : Servir les images via un CDN pour de meilleures performances

## 📝 Modèles de données

### User Model

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    profile_image = Column(String, nullable=True)  # Chemin local de l'image
    role = Column(Enum(UserRole), default=UserRole.USER)
    preferences = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Event Model

```python
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
    image_url = Column(String)  # Chemin local de l'image
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.PENDING)
    # ...
```
