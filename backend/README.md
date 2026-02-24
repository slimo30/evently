# Event Management API - Backend

API REST pour la gestion d'événements développée avec FastAPI.

## 🚀 Technologies

- **FastAPI** - Framework web moderne et performant
- **SQLAlchemy** - ORM pour la gestion de la base de données
- **PostgreSQL** - Base de données (configurable via `DATABASE_URL` dans `.env`)
- **JWT** - Authentification par tokens (24h d'expiration)
- **Pydantic v2** - Validation des données
- **Passlib + Bcrypt** - Hashage sécurisé des mots de passe
- **Python-jose** - Encodage/décodage JWT
- **qrcode** - Génération de QR codes PNG
- **Python 3.9+**

## 📋 Fonctionnalités

### Authentification & Utilisateurs
- ✅ Inscription et connexion avec JWT
- ✅ **Validation des mots de passe** (minimum 8 caractères, validé par Pydantic)
- ✅ Gestion des rôles : `USER`, `EVENT_OWNER`, `ADMIN`
- ✅ Profil utilisateur avec photo de profil
- ✅ Upload d'image de profil (JPEG, PNG, GIF, WebP — max 5 MB)
- ✅ Suppression d'image de profil
- ✅ Création d'utilisateurs avec rôle par un Admin

### Gestion des Événements
- ✅ CRUD complet des événements
- ✅ Statuts : `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`, `CANCELLED`, `COMPLETED`
- ✅ Workflow de validation : création → PENDING → approuvé/rejeté par Admin
- ✅ Upload d'images pour les événements (JPEG, PNG, GIF, WebP — max 5 MB)
- ✅ Suppression d'images d'événements
- ✅ Catégories et tags (JSON)
- ✅ Limitation du nombre de participants
- ✅ Filtrage par catégorie, lieu, recherche textuelle (titre/description)
- ✅ Événements similaires
- ✅ Recommandations personnalisées basées sur les inscriptions passées
- ✅ Mes événements (organisateur) ou tous les événements (admin)
- ✅ Protection contre la suppression d'événements avec des inscrits actifs

### Inscriptions
- ✅ Inscription aux événements publiés
- ✅ Annulation d'inscription (passe en `CANCELLED`)
- ✅ Génération de QR codes PNG pour les participants
- ✅ Check-in / Check-out via scan QR code (toggle automatique)
- ✅ Check-in / Check-out manuel par l'organisateur
- ✅ Statuts : `REGISTERED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`
- ✅ Liste des participants par événement
- ✅ Présence en temps réel (live stats)
- ✅ Historique des check-in/check-out
- ✅ Vérification de la capacité maximale

### Favoris
- ✅ Ajouter/Retirer des événements en favoris
- ✅ Liste de mes événements favoris (avec pagination)
- ✅ Vérifier si un événement est en favori

### Analytics & Statistiques
- ✅ Statistiques globales (Admin uniquement)
- ✅ Dashboard personnel (tous les utilisateurs authentifiés)
- ✅ Statistiques détaillées par événement (propriétaire ou admin)

## 🛠️ Installation

### Prérequis
- Python 3.9+
- pip

### Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

### Configuration

Le fichier `app/config.py` contient la configuration par défaut, surchargée par `.env` :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `SECRET_KEY` : Clé secrète JWT (à changer en production)
- `ALGORITHM` : `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` : `1440` (24 heures)

Créez un fichier `.env` dans le dossier `backend/` :

```env
DATABASE_URL=postgresql://localhost:5432/eventdb
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Lancement du serveur

```bash
# Développement avec auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

L'API sera accessible sur `http://localhost:8000`

Documentation interactive Swagger : `http://localhost:8000/docs`

## 📚 Documentation API

### Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

**Validation :**
- Email valide requis (format RFC)
- **Mot de passe : minimum 8 caractères** (validé par Pydantic — retourne 422 si trop court)
- Nom requis

**Réponse (201 Created) :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "profile_image": null,
  "preferences": {},
  "created_at": "2026-02-24T10:00:00Z"
}
```

**Erreurs possibles :**
- `400 Bad Request` : Email déjà utilisé
- `422 Unprocessable Entity` : Email invalide ou mot de passe < 8 caractères

#### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Réponse (200 OK) :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Erreurs possibles :**
- `401 Unauthorized` : Email ou mot de passe incorrect

#### Profil utilisateur
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Réponse (200 OK) :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "profile_image": "uploads/profiles/uuid_uuid.jpg",
  "preferences": {},
  "created_at": "2026-02-24T10:00:00Z"
}
```

**Erreurs possibles :**
- `403 Forbidden` : Aucun token fourni (HTTPBearer)
- `401 Unauthorized` : Token invalide ou expiré

#### Modifier le profil
```http
PUT /api/auth/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "NewPassword123!",
  "preferences": {"categories": ["tech", "music"]}
}
```

Tous les champs sont optionnels. Seuls les champs fournis sont mis à jour.

**Erreurs possibles :**
- `400 Bad Request` : Email déjà utilisé par un autre utilisateur
- `403 Forbidden` : Non authentifié

#### Upload photo de profil
```http
POST /api/auth/me/profile-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [image file]
```

**Contraintes :**
- Formats acceptés : `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Taille maximale : 5 MB
- Remplace automatiquement l'ancienne photo

**Réponse (200 OK) :** Objet `UserResponse` complet avec le champ `profile_image` mis à jour.

**Erreurs possibles :**
- `400 Bad Request` : Format non autorisé ou fichier trop volumineux
- `403 Forbidden` : Non authentifié

#### Supprimer photo de profil
```http
DELETE /api/auth/me/profile-image
Authorization: Bearer {token}
```

**Réponse (200 OK) :**
```json
{
  "message": "Image de profil supprimée avec succès"
}
```

**Erreurs possibles :**
- `400 Bad Request` : Aucune image de profil à supprimer

#### Créer un utilisateur (Admin)
```http
POST /api/auth/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "organizer@example.com",
  "password": "Password123!",
  "name": "New Organizer",
  "role": "EVENT_OWNER"
}
```

**Permissions :** Admin uniquement

---

### Événements

#### Lister les événements publiés
```http
GET /api/events/?search=jazz&category=music&location=Paris&skip=0&limit=20
```

**Paramètres de requête :**
- `search` : Recherche dans le titre et la description (optionnel)
- `category` : Filtrer par catégorie exacte (optionnel)
- `location` : Filtrer par lieu (recherche partielle, optionnel)
- `skip` : Pagination — offset (défaut : 0)
- `limit` : Nombre de résultats (défaut : 20)

**Réponse (200 OK) :** Liste d'objets `EventResponse`

#### Obtenir un événement
```http
GET /api/events/{event_id}
```

**Réponse (200 OK) :**
```json
{
  "id": "uuid",
  "title": "Concert de Jazz",
  "description": "Soirée jazz exceptionnelle",
  "category": "music",
  "tags": ["jazz", "live"],
  "location": "Salle Pleyel, Paris",
  "date_start": "2026-03-15T20:00:00Z",
  "date_end": "2026-03-15T23:00:00Z",
  "max_participants": 200,
  "image_url": "uploads/events/uuid_uuid.jpg",
  "owner_id": "uuid",
  "status": "PUBLISHED",
  "created_at": "2026-02-24T10:00:00Z",
  "participants_count": 45
}
```

**Erreurs possibles :**
- `404 Not Found` : Événement non trouvé

#### Événements similaires
```http
GET /api/events/{event_id}/similar?limit=5
```

Retourne des événements publiés de la même catégorie ou du même lieu.

#### Mes événements
```http
GET /api/events/my-events
Authorization: Bearer {token}
```

- **Organisateur** : Retourne ses propres événements (tous statuts)
- **Admin** : Retourne tous les événements de la plateforme

#### Événements en attente (Admin)
```http
GET /api/events/pending
Authorization: Bearer {admin_token}
```

Retourne les événements au statut `PENDING`.

**Permissions :** Admin uniquement

#### Recommandations personnalisées
```http
GET /api/events/recommendations?limit=10
Authorization: Bearer {token}
```

Recommande des événements publiés dans les catégories déjà suivies par l'utilisateur, complétés par des événements populaires.

#### Créer un événement
```http
POST /api/events/
Authorization: Bearer {organizer_or_admin_token}
Content-Type: application/json

{
  "title": "Concert de Jazz",
  "description": "Soirée jazz exceptionnelle",
  "category": "music",
  "tags": ["jazz", "live"],
  "location": "Salle Pleyel, Paris",
  "date_start": "2026-03-15T20:00:00Z",
  "date_end": "2026-03-15T23:00:00Z",
  "max_participants": 200,
  "image_url": null
}
```

L'événement est créé avec le statut `PENDING` et doit être approuvé par un Admin.

**Permissions :** `EVENT_OWNER` ou `ADMIN`

**Réponse (201 Created) :** Objet `EventResponse`

**Erreurs possibles :**
- `403 Forbidden` : Rôle insuffisant (ex. utilisateur `USER`)

#### Modifier un événement
```http
PUT /api/events/{event_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Concert de Jazz - COMPLET",
  "max_participants": 250
}
```

Tous les champs sont optionnels. Seuls les champs fournis sont mis à jour.

**Permissions :** Propriétaire de l'événement ou Admin

**Erreurs possibles :**
- `403 Forbidden` : Non propriétaire et non admin
- `404 Not Found` : Événement non trouvé

#### Supprimer un événement
```http
DELETE /api/events/{event_id}
Authorization: Bearer {token}
```

**Règles de suppression :**
- ❌ Impossible si l'événement a des participants actifs (non annulés)
- ✅ Possible si aucun participant ou tous annulés

**Permissions :** Propriétaire de l'événement ou Admin

**Réponse (204 No Content)**

**Erreurs possibles :**
- `400 Bad Request` : Événement avec des inscrits actifs
- `403 Forbidden` : Non autorisé
- `404 Not Found` : Événement non trouvé

#### Approuver un événement (Admin)
```http
POST /api/events/{event_id}/approve
Authorization: Bearer {admin_token}
```

Passe le statut de `PENDING` à `PUBLISHED`.

**Permissions :** Admin uniquement

**Erreurs possibles :**
- `400 Bad Request` : L'événement n'est pas en statut `PENDING`
- `404 Not Found` : Événement non trouvé

#### Rejeter un événement (Admin)
```http
POST /api/events/{event_id}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Informations insuffisantes"
}
```

Passe le statut de `PENDING` à `REJECTED`.

**Permissions :** Admin uniquement

**Erreurs possibles :**
- `400 Bad Request` : L'événement n'est pas en statut `PENDING`

#### Upload image d'événement
```http
POST /api/events/{event_id}/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [image file]
```

**Contraintes :**
- Formats acceptés : `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Taille maximale : 5 MB
- Remplace automatiquement l'ancienne image

**Permissions :** Propriétaire de l'événement ou Admin

**Réponse (200 OK) :** Objet `EventResponse` avec `image_url` mis à jour.

#### Supprimer image d'événement
```http
DELETE /api/events/{event_id}/image
Authorization: Bearer {token}
```

**Permissions :** Propriétaire de l'événement ou Admin

**Réponse (200 OK) :**
```json
{
  "message": "Image supprimée avec succès"
}
```

**Erreurs possibles :**
- `400 Bad Request` : Aucune image à supprimer

---

### Inscriptions

#### S'inscrire à un événement
```http
POST /api/registrations/{event_id}
Authorization: Bearer {token}
```

**Vérifications automatiques :**
- L'événement existe et est au statut `PUBLISHED`
- Des places sont disponibles (`max_participants`)
- L'utilisateur n'est pas déjà inscrit (statut non annulé)

**Réponse (201 Created) :**
```json
{
  "id": "registration-uuid",
  "user_id": "user-uuid",
  "event_id": "event-uuid",
  "qr_code_url": "/api/registrations/registration-uuid/qr-code",
  "status": "REGISTERED",
  "registered_at": "2026-02-24T10:00:00Z",
  "checked_in_at": null,
  "checked_out_at": null
}
```

**Erreurs possibles :**
- `400 Bad Request` : Déjà inscrit, événement complet, ou événement non disponible
- `404 Not Found` : Événement non trouvé

#### Annuler une inscription
```http
DELETE /api/registrations/{event_id}
Authorization: Bearer {token}
```

Passe le statut de l'inscription de `REGISTERED` à `CANCELLED`.

**Réponse (204 No Content)**

**Erreurs possibles :**
- `404 Not Found` : Inscription non trouvée ou déjà annulée

#### Mes inscriptions
```http
GET /api/registrations/my-registrations
Authorization: Bearer {token}
```

Retourne toutes les inscriptions de l'utilisateur (tous statuts).

#### QR Code d'inscription
```http
GET /api/registrations/{registration_id}/qr-code
Authorization: Bearer {token}
```

Retourne une image PNG du QR code contenant `REG:{registration_id}`.

**Permissions :** Propriétaire de l'inscription ou Admin

**Réponse (200 OK) :** Image PNG (`Content-Type: image/png`)

#### Scanner un QR code (check-in/check-out automatique)
```http
POST /api/registrations/scan/{registration_id}?event_id={event_id}
Authorization: Bearer {organizer_or_admin_token}
```

Logique de scan automatique basée sur le statut actuel :
- `REGISTERED` → `CHECKED_IN` (premier scan)
- `CHECKED_IN` → `CHECKED_OUT` (deuxième scan)
- `CHECKED_OUT` → `CHECKED_IN` (re-entrée autorisée)

Le paramètre `event_id` est optionnel mais recommandé pour valider que l'inscription appartient bien à l'événement scanné.

**Permissions :** Propriétaire de l'événement ou Admin

**Réponse (200 OK) :** Objet `RegistrationResponse` avec le statut mis à jour.

**Erreurs possibles :**
- `400 Bad Request` : `event_id` fourni mais ne correspond pas à l'inscription, ou inscription annulée
- `403 Forbidden` : Non organisateur de cet événement
- `404 Not Found` : Inscription non trouvée

#### Check-in manuel
```http
POST /api/registrations/{registration_id}/check-in
Authorization: Bearer {organizer_or_admin_token}
```

Passe le statut de `REGISTERED` à `CHECKED_IN`.

**Permissions :** Propriétaire de l'événement ou Admin

**Erreurs possibles :**
- `400 Bad Request` : Le participant n'est pas en statut `REGISTERED`

#### Check-out manuel
```http
POST /api/registrations/{registration_id}/check-out
Authorization: Bearer {organizer_or_admin_token}
```

Passe le statut de `CHECKED_IN` à `CHECKED_OUT`.

**Permissions :** Propriétaire de l'événement ou Admin

**Erreurs possibles :**
- `400 Bad Request` : Le participant n'est pas en statut `CHECKED_IN`

#### Liste des participants d'un événement
```http
GET /api/registrations/event/{event_id}/participants
Authorization: Bearer {organizer_or_admin_token}
```

**Permissions :** Propriétaire de l'événement ou Admin

**Réponse (200 OK) :**
```json
[
  {
    "id": "registration-uuid",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "status": "CHECKED_IN",
    "registered_at": "2026-02-24T10:00:00Z",
    "checked_in_at": "2026-03-15T19:55:00Z",
    "checked_out_at": null
  }
]
```

#### Présence en temps réel
```http
GET /api/registrations/event/{event_id}/live
Authorization: Bearer {organizer_or_admin_token}
```

**Permissions :** Propriétaire de l'événement ou Admin

**Réponse (200 OK) :**
```json
{
  "total_registered": 45,
  "currently_present": 30,
  "checked_out": 10,
  "not_arrived": 5
}
```

#### Historique des check-in/check-out
```http
GET /api/registrations/event/{event_id}/history
Authorization: Bearer {organizer_or_admin_token}
```

**Permissions :** Propriétaire de l'événement ou Admin

---

### Favoris

#### Ajouter aux favoris
```http
POST /api/favorites/{event_id}
Authorization: Bearer {token}
```

**Réponse (201 Created) :**
```json
{
  "message": "Événement ajouté aux favoris",
  "favorite_id": "uuid"
}
```

**Erreurs possibles :**
- `400 Bad Request` : Événement déjà en favori
- `404 Not Found` : Événement non trouvé

#### Retirer des favoris
```http
DELETE /api/favorites/{event_id}
Authorization: Bearer {token}
```

**Réponse (204 No Content)**

**Erreurs possibles :**
- `404 Not Found` : Favori non trouvé

#### Mes favoris
```http
GET /api/favorites/my-favorites?skip=0&limit=100
Authorization: Bearer {token}
```

**Réponse (200 OK) :**
```json
[
  {
    "id": "favorite-uuid",
    "user_id": "user-uuid",
    "event_id": "event-uuid",
    "created_at": "2026-02-24T10:00:00Z",
    "event": {
      "id": "event-uuid",
      "title": "Concert de Jazz",
      "description": "...",
      "category": "music",
      "tags": ["jazz"],
      "location": "Paris",
      "date_start": "2026-03-15T20:00:00Z",
      "date_end": "2026-03-15T23:00:00Z",
      "max_participants": 200,
      "image_url": "uploads/events/...",
      "owner_id": "uuid",
      "status": "PUBLISHED",
      "created_at": "2026-02-24T10:00:00Z",
      "participants_count": 45
    }
  }
]
```

#### Vérifier si en favori
```http
GET /api/favorites/is-favorite/{event_id}
Authorization: Bearer {token}
```

**Réponse (200 OK) :**
```json
{
  "is_favorite": true
}
```

---

### Analytics

#### Statistiques globales (Admin)
```http
GET /api/analytics/global
Authorization: Bearer {admin_token}
```

**Permissions :** Admin uniquement

**Réponse (200 OK) :**
```json
{
  "total_users": 150,
  "total_events": 45,
  "total_registrations": 320,
  "events_by_status": {
    "DRAFT": 2,
    "PENDING": 5,
    "PUBLISHED": 30,
    "REJECTED": 3,
    "CANCELLED": 2,
    "COMPLETED": 3
  },
  "registrations_by_status": {
    "REGISTERED": 200,
    "CHECKED_IN": 80,
    "CHECKED_OUT": 30,
    "CANCELLED": 5,
    "NO_SHOW": 5
  }
}
```

#### Dashboard personnel
```http
GET /api/analytics/my-dashboard?user_id={uuid}
Authorization: Bearer {token}
```

Accessible à tous les utilisateurs authentifiés.
- **Utilisateur** : Statistiques de ses propres événements (vides s'il n'est pas organisateur)
- **Organisateur** : Statistiques de ses événements
- **Admin** : Statistiques de tous les événements (ou d'un utilisateur spécifique si `user_id` fourni)

**Réponse (200 OK) :**
```json
{
  "total_events": 5,
  "total_registrations": 120,
  "total_checked_in": 80,
  "events": [
    {
      "event_id": "uuid",
      "title": "Concert de Jazz",
      "status": "PUBLISHED",
      "registrations": 45,
      "max_participants": 50,
      "fill_rate": 90.0
    }
  ]
}
```

#### Statistiques d'un événement
```http
GET /api/analytics/event/{event_id}
Authorization: Bearer {token}
```

**Permissions :** Propriétaire de l'événement ou Admin

**Réponse (200 OK) :**
```json
{
  "event_id": "uuid",
  "event_title": "Concert de Jazz",
  "date_start": "2026-03-15T20:00:00Z",
  "date_end": "2026-03-15T23:00:00Z",
  "location": "Salle Pleyel, Paris",
  "max_participants": 200,
  "total_registrations": 45,
  "checked_in_count": 30,
  "checked_out_count": 10,
  "no_show_count": 0,
  "fill_rate": 22.5
}
```

---

## 🗂️ Structure du projet

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Point d'entrée FastAPI, CORS, fichiers statiques, routes
│   ├── config.py            # Configuration (SECRET_KEY, DATABASE_URL, JWT)
│   ├── database.py          # Connexion DB, SessionLocal, Base
│   ├── models.py            # Modèles SQLAlchemy (User, Event, Registration, Favorite)
│   ├── schemas.py           # Schémas Pydantic avec validation
│   ├── auth.py              # Authentification JWT, hashage mots de passe, guards de rôles
│   ├── utils.py             # Fonctions utilitaires (upload/suppression d'images)
│   └── routes/
│       ├── __init__.py
│       ├── auth.py          # Routes authentification et profil
│       ├── events.py        # Routes événements et images
│       ├── registrations.py # Routes inscriptions, QR codes, check-in/out
│       ├── favorites.py     # Routes favoris
│       └── analytics.py     # Routes statistiques
├── uploads/
│   ├── events/              # Images des événements
│   └── profiles/            # Photos de profil
├── app.db                   # Base de données SQLite (générée automatiquement)
├── requirements.txt         # Dépendances Python
├── test.py                  # Suite de tests complète
├── README.md
└── IMAGES_UPLOAD.md
```

## 🔐 Sécurité

- **JWT** : Authentification par tokens avec expiration de 24h
- **HTTPBearer** : Les routes protégées retournent `403 Forbidden` si aucun token n'est fourni, `401 Unauthorized` si le token est invalide/expiré
- **Passwords** : 
  - Hashage avec bcrypt (via Passlib)
  - **Validation Pydantic : minimum 8 caractères** (retourne 422)
  - Jamais stockés en clair
- **CORS** : Configuré pour accepter toutes les origines (`*`) — à restreindre en production
- **Validation** : Validation stricte des données avec Pydantic v2
- **Autorisation** : Vérification des permissions sur chaque route protégée
- **Upload de fichiers** :
  - Validation de l'extension (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)
  - Limitation de taille (5 MB)
  - Noms de fichiers sécurisés (`{owner_id}_{uuid}.{ext}`)

## 🎭 Rôles et Permissions

### USER (Participant)
- Voir les événements publiés (liste, détail, similaires, recommandations)
- S'inscrire aux événements / Annuler ses inscriptions
- Télécharger son QR code
- Gérer ses favoris
- Voir ses inscriptions
- Dashboard personnel (vide pour un simple utilisateur)
- Modifier son propre profil

### EVENT_OWNER (Organisateur)
Hérite des permissions USER +
- Créer des événements (statut initial : `PENDING`)
- Modifier/Supprimer ses événements
- Uploader/Supprimer l'image de ses événements
- Voir les participants de ses événements
- Scanner les QR codes (check-in/check-out)
- Check-in/Check-out manuel
- Présence en temps réel et historique
- Statistiques de ses événements

### ADMIN
Hérite des permissions EVENT_OWNER +
- Approuver/Rejeter les événements en attente
- Statistiques globales de la plateforme
- Accès et modification de tous les événements
- Créer des utilisateurs avec un rôle spécifique

> **Note :** Par défaut, les nouveaux utilisateurs sont créés avec le rôle `USER`. Pour obtenir le rôle `EVENT_OWNER` ou `ADMIN`, un Admin doit le modifier via `POST /api/auth/users` ou directement en base de données.

## 📸 Upload d'images

### Formats acceptés
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

### Limitations
- Taille maximale : 5 MB

### Stockage
- Les images sont stockées dans `uploads/profiles/` et `uploads/events/`
- Nommage : `{owner_id}_{uuid}.{extension}`
- Accessibles via : `http://localhost:8000/uploads/{type}/{filename}`
- Suppression automatique de l'ancienne image lors du remplacement

## 🧪 Tests

```bash
# Depuis le dossier backend/
source venv/bin/activate
python test.py
```

Le fichier `test.py` couvre l'ensemble des endpoints :

### Tests de santé (2 tests)
- `GET /health`
- `GET /`

### Tests d'authentification (14 tests)
- Inscription avec validation email et mot de passe
- Connexion / mauvais mot de passe / utilisateur inexistant
- Profil utilisateur (avec/sans token, token invalide)
- Mise à jour du profil

### Mise à jour des rôles (2 tests)
- Passage en `EVENT_OWNER` et `ADMIN` via PostgreSQL (`psycopg2`, URL lue depuis `.env`)

### Tests d'événements (15 tests)
- CRUD avec contrôle des permissions
- Filtrage et recherche
- Mes événements, événements en attente, recommandations
- Approbation/Rejet (Admin)
- Protection contre la double approbation

### Tests d'inscriptions (~20 tests)
- Inscription et annulation
- Vérification de la capacité et du doublon
- QR codes (propriétaire et admin)
- Scan QR : `REGISTERED→CHECKED_IN→CHECKED_OUT→CHECKED_IN` (re-entrée)
- Scan avec mauvais `event_id` (400)
- Scan par non-organisateur (403)
- Scan sans `event_id` (rétrocompatible)
- Check-in/Check-out manuel
- Participants et live stats

### Tests d'analytics (6 tests)
- Statistiques globales (Admin, User/Organizer échouent)
- Dashboard (organisateur, utilisateur)
- Statistiques par événement

### Tests de favoris (12 tests)
- Ajout/Retrait/Doublon
- Liste avec pagination
- Vérification du statut
- Tests sans authentification (403)

### Tests d'upload d'images (~15 tests)
- Upload/Remplacement/Suppression d'images de profil
- Upload/Remplacement/Suppression d'images d'événements
- Format invalide et fichier trop volumineux (400)
- Permissions (non propriétaire → 403)

### Tests de suppression (3 tests)
- Suppression par un user (403)
- Suppression par le propriétaire (204)
- Suppression avec inscrits actifs (400)

## 📊 API Endpoints — Résumé

| Méthode | Endpoint | Permission | Description |
|---------|----------|------------|-------------|
| **Auth** ||||
| POST | `/api/auth/register` | Public | Inscription (password ≥ 8 chars) |
| POST | `/api/auth/login` | Public | Connexion (JSON body) |
| GET | `/api/auth/me` | Authentifié | Mon profil |
| PUT | `/api/auth/me` | Authentifié | Modifier profil |
| POST | `/api/auth/me/profile-image` | Authentifié | Upload photo de profil |
| DELETE | `/api/auth/me/profile-image` | Authentifié | Supprimer photo de profil |
| POST | `/api/auth/users` | Admin | Créer utilisateur avec rôle |
| **Events** ||||
| GET | `/api/events/` | Public | Liste événements publiés |
| GET | `/api/events/my-events` | Authentifié | Mes événements |
| GET | `/api/events/pending` | Admin | Événements en attente |
| GET | `/api/events/recommendations` | Authentifié | Recommandations |
| GET | `/api/events/{id}` | Public | Détail événement |
| GET | `/api/events/{id}/similar` | Public | Événements similaires |
| POST | `/api/events/` | EVENT_OWNER+ | Créer événement |
| PUT | `/api/events/{id}` | Propriétaire/Admin | Modifier événement |
| DELETE | `/api/events/{id}` | Propriétaire/Admin | Supprimer événement |
| POST | `/api/events/{id}/approve` | Admin | Approuver |
| POST | `/api/events/{id}/reject` | Admin | Rejeter |
| POST | `/api/events/{id}/image` | Propriétaire/Admin | Upload image |
| DELETE | `/api/events/{id}/image` | Propriétaire/Admin | Supprimer image |
| **Registrations** ||||
| POST | `/api/registrations/{event_id}` | Authentifié | S'inscrire |
| DELETE | `/api/registrations/{event_id}` | Authentifié | Annuler inscription |
| GET | `/api/registrations/my-registrations` | Authentifié | Mes inscriptions |
| GET | `/api/registrations/{id}/qr-code` | Propriétaire/Admin | QR code PNG |
| POST | `/api/registrations/scan/{id}` | Organisateur/Admin | Scanner QR (check-in/out) |
| POST | `/api/registrations/{id}/check-in` | Organisateur/Admin | Check-in manuel |
| POST | `/api/registrations/{id}/check-out` | Organisateur/Admin | Check-out manuel |
| GET | `/api/registrations/event/{id}/participants` | Organisateur/Admin | Liste participants |
| GET | `/api/registrations/event/{id}/live` | Organisateur/Admin | Présence temps réel |
| GET | `/api/registrations/event/{id}/history` | Organisateur/Admin | Historique check-in/out |
| **Favorites** ||||
| POST | `/api/favorites/{event_id}` | Authentifié | Ajouter favori |
| DELETE | `/api/favorites/{event_id}` | Authentifié | Retirer favori |
| GET | `/api/favorites/my-favorites` | Authentifié | Mes favoris |
| GET | `/api/favorites/is-favorite/{event_id}` | Authentifié | Vérifier statut favori |
| **Analytics** ||||
| GET | `/api/analytics/global` | Admin | Stats globales |
| GET | `/api/analytics/my-dashboard` | Authentifié | Mon dashboard |
| GET | `/api/analytics/event/{id}` | Propriétaire/Admin | Stats événement |
| **Autres** ||||
| GET | `/health` | Public | Santé du serveur |
| GET | `/` | Public | Informations API |
| GET | `/uploads/{path}` | Public | Fichiers statiques (images) |

## 🐛 Debug

### Problèmes courants

**Erreur 401 Unauthorized**
- Vérifier que le token JWT est valide et non expiré (24h)
- Format header : `Authorization: Bearer {token}`
- Re-connectez-vous pour obtenir un nouveau token

**Erreur 403 Forbidden**
- Aucun token fourni (HTTPBearer retourne 403 si le header `Authorization` est absent)
- Vérifier que l'utilisateur a les permissions nécessaires (rôle insuffisant)

**Erreur 422 Unprocessable Entity**
- **Mot de passe trop court** : minimum 8 caractères requis
- Email invalide (format RFC)
- Champs requis manquants

**Upload d'image échoue (400)**
- Vérifier la taille du fichier (< 5 MB)
- Vérifier le format : `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` uniquement
- Vérifier les permissions du dossier `uploads/`

**Event complet (400)**
- `max_participants` atteint
- Message : `"Événement complet"`

**Impossible de supprimer un événement (400)**
- L'événement a des participants actifs (non annulés)
- Message : `"Impossible de supprimer un événement avec des inscrits. Annulez-le plutôt."`

**Scan QR retourne 400**
- `event_id` fourni mais ne correspond pas à l'inscription
- L'inscription est annulée (`CANCELLED`)

**Mise à jour des rôles dans les tests**
- Les rôles sont modifiés directement en PostgreSQL via `psycopg2`
- L'URL de connexion est lue depuis le fichier `.env` (`DATABASE_URL`)
- Nécessite de se re-connecter après changement de rôle pour obtenir un token valide

## 🚀 Déploiement

### Variables d'environnement

```env
DATABASE_URL=postgresql://localhost:5432/eventdb
SECRET_KEY=your-very-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Avec Docker (optionnel)

```dockerfile
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p uploads/events uploads/profiles

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t event-api .
docker run -p 8000:8000 -v $(pwd)/uploads:/app/uploads event-api
```

## 📝 Migrations SQL

Deux fichiers de migration sont fournis pour les bases de données PostgreSQL existantes :

### `migration_add_favorites.sql`
Ajoute la table des favoris :
```bash
psql -d eventdb < migration_add_favorites.sql
```

### `migration_add_profile_image.sql`
Ajoute le champ `profile_image` aux utilisateurs :
```bash
psql -d eventdb < migration_add_profile_image.sql
```

## 📄 License

MIT

---

_Documentation mise à jour le 24 Février 2026 - v1.0.0_
