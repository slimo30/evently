# Event Management API - Backend

API REST pour la gestion d'événements développée avec FastAPI.

## 🚀 Technologies

- **FastAPI** - Framework web moderne et performant
- **SQLAlchemy** - ORM pour la gestion de la base de données
- **SQLite** - Base de données (peut être remplacée par PostgreSQL)
- **JWT** - Authentification par tokens
- **Pydantic** - Validation des données
- **Passlib + Bcrypt** - Hashage sécurisé des mots de passe
- **Python 3.11+**

## 📋 Fonctionnalités

### Authentification & Utilisateurs
- ✅ Inscription et connexion avec JWT
- ✅ **Validation des mots de passe** (minimum 8 caractères)
- ✅ Gestion des rôles (Admin, Organisateur, Participant)
- ✅ Profil utilisateur avec photo de profil
- ✅ Upload d'image de profil (JPEG, PNG, max 5MB)
- ✅ Suppression d'image de profil

### Gestion des Événements
- ✅ CRUD complet des événements
- ✅ Statuts : DRAFT, PUBLISHED, CANCELLED, COMPLETED
- ✅ Upload d'images pour les événements (JPEG, PNG, max 5MB)
- ✅ Suppression d'images d'événements
- ✅ Catégories et tags
- ✅ Limitation du nombre de participants
- ✅ Filtrage par catégorie, tags, dates
- ✅ Recherche par titre
- ✅ Événements publics vs événements de l'organisateur
- ✅ Approbation/Rejet par les administrateurs
- ✅ Protection contre la suppression d'événements avec des inscrits actifs

### Inscriptions
- ✅ Inscription aux événements
- ✅ Annulation d'inscription
- ✅ Génération de QR codes pour les participants
- ✅ Check-in / Check-out via QR code
- ✅ Gestion des statuts : REGISTERED, CHECKED_IN, CHECKED_OUT, NO_SHOW, CANCELLED
- ✅ Liste des participants par événement
- ✅ Historique des inscriptions
- ✅ Vérification de la capacité maximale

### Favoris
- ✅ Ajouter/Retirer des événements en favoris
- ✅ Liste de mes événements favoris
- ✅ Vérifier si un événement est en favori

### Analytics & Statistiques
- ✅ Statistiques globales (Admin)
- ✅ Dashboard organisateur (mes événements)
- ✅ Statistiques par événement (inscriptions, présence, taux de remplissage)

## 🛠️ Installation

### Prérequis
- Python 3.11+
- pip

### Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

### Configuration

Le fichier `app/config.py` contient la configuration :
- `SECRET_KEY` : Clé secrète pour JWT (à changer en production)
- `DATABASE_URL` : URL de connexion à la base de données
- `UPLOAD_DIR` : Répertoire pour les fichiers uploadés
- `MAX_UPLOAD_SIZE` : Taille maximale des fichiers (5MB par défaut)

### Lancement du serveur

```bash
# Développement avec auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

L'API sera accessible sur `http://localhost:8000`

Documentation interactive : `http://localhost:8000/docs`

## 📚 Documentation API

### Authentification

#### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user"
}
```

**Validation :**
- Email valide requis
- **Mot de passe : minimum 8 caractères**
- Prénom et nom requis
- Rôle : `user`, `event_owner`, ou `admin`

**Réponse (201 Created) :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user",
  "profile_image_url": null,
  "created_at": "2026-02-24T10:00:00Z"
}
```

**Erreurs possibles :**
- `400 Bad Request` : Email déjà utilisé
- `422 Unprocessable Entity` : Mot de passe trop court (< 8 caractères)

#### Connexion
```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=Password123!
```

Réponse :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Profil utilisateur
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user",
  "profile_image_url": "uploads/profiles/abc123.jpg",
  "created_at": "2026-02-24T10:00:00Z"
}
```

#### Modifier le profil
```http
PUT /api/auth/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com"
}
```

#### Upload photo de profil
```http
POST /api/auth/profile-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [image file]
```

**Contraintes :**
- Formats acceptés : JPEG (.jpg, .jpeg), PNG (.png)
- Taille maximale : 5 MB
- Remplace automatiquement l'ancienne photo

**Réponse (200 OK) :**
```json
{
  "profile_image_url": "uploads/profiles/user-id_timestamp.jpg",
  "message": "Image de profil mise à jour avec succès"
}
```

#### Supprimer photo de profil
```http
DELETE /api/auth/profile-image
Authorization: Bearer {token}
```

### Événements

#### Créer un événement
```http
POST /api/events
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Concert de Jazz",
  "description": "Soirée jazz exceptionnelle",
  "category": "concert",
  "tags": ["musique", "jazz"],
  "location": "Salle Pleyel, Paris",
  "date_start": "2026-03-15T20:00:00Z",
  "date_end": "2026-03-15T23:00:00Z",
  "max_participants": 200,
  "status": "published"
}
```

**Permissions :**
- Rôles autorisés : `event_owner`, `admin`

#### Lister les événements
```http
GET /api/events?category=concert&limit=10&skip=0
```

Paramètres :
- `category` : Filtrer par catégorie
- `tags` : Filtrer par tags (séparés par virgules)
- `search` : Recherche dans le titre
- `date_from` : Date de début (ISO 8601)
- `date_to` : Date de fin (ISO 8601)
- `skip` : Pagination (offset)
- `limit` : Nombre de résultats (défaut: 100)

#### Obtenir un événement
```http
GET /api/events/{event_id}
```

**Réponse :**
```json
{
  "id": "uuid",
  "title": "Concert de Jazz",
  "description": "Soirée jazz exceptionnelle",
  "category": "concert",
  "tags": ["musique", "jazz"],
  "location": "Salle Pleyel, Paris",
  "date_start": "2026-03-15T20:00:00Z",
  "date_end": "2026-03-15T23:00:00Z",
  "max_participants": 200,
  "current_participants": 45,
  "status": "published",
  "image_url": "uploads/events/event-id_timestamp.jpg",
  "owner_id": "uuid",
  "created_at": "2026-02-24T10:00:00Z",
  "updated_at": "2026-02-24T10:00:00Z"
}
```

#### Mettre à jour un événement
```http
PUT /api/events/{event_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Concert de Jazz - COMPLET",
  "status": "published"
}
```

**Permissions :**
- Propriétaire de l'événement ou Admin

#### Supprimer un événement
```http
DELETE /api/events/{event_id}
Authorization: Bearer {token}
```

**Règles de suppression :**
- ❌ Impossible si l'événement a des participants actifs (registered, checked_in)
- ✅ Possible si aucun participant ou tous annulés/checked_out

**Permissions :**
- Propriétaire de l'événement ou Admin

#### Approuver un événement (Admin)
```http
POST /api/events/{event_id}/approve
Authorization: Bearer {token}
```

#### Rejeter un événement (Admin)
```http
POST /api/events/{event_id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Informations incomplètes"
}
```

#### Upload image d'événement
```http
POST /api/events/{event_id}/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [image file]
```

**Contraintes :**
- Formats acceptés : JPEG, PNG
- Taille maximale : 5 MB
- Remplace automatiquement l'ancienne image

**Permissions :**
- Propriétaire de l'événement ou Admin

#### Supprimer image d'événement
```http
DELETE /api/events/{event_id}/image
Authorization: Bearer {token}
```

**Permissions :**
- Propriétaire de l'événement ou Admin

#### Mes événements (organisateur)
```http
GET /api/events/my-events
Authorization: Bearer {token}
```

**Permissions :**
- Rôles : `event_owner`, `admin`

#### Participants d'un événement
```http
GET /api/events/{event_id}/participants
Authorization: Bearer {token}
```

**Réponse :**
```json
[
  {
    "id": "registration-id",
    "user": {
      "id": "user-id",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "status": "checked_in",
    "registered_at": "2026-02-24T10:00:00Z",
    "checked_in_at": "2026-03-15T19:55:00Z",
    "checked_out_at": null
  }
]
```

**Permissions :**
- Propriétaire de l'événement ou Admin

### Inscriptions

#### S'inscrire à un événement
```http
POST /api/registrations/{event_id}
Authorization: Bearer {token}
```

**Vérifications automatiques :**
- Événement existe et est publié
- Places disponibles (max_participants)
- Pas déjà inscrit
- Événement non passé

**Réponse (201 Created) :**
```json
{
  "id": "registration-id",
  "event_id": "event-id",
  "user_id": "user-id",
  "status": "registered",
  "qr_code_url": "registration-id",
  "registered_at": "2026-02-24T10:00:00Z"
}
```

#### Annuler une inscription
```http
DELETE /api/registrations/{event_id}
Authorization: Bearer {token}
```

#### Mes inscriptions
```http
GET /api/registrations/my-registrations
Authorization: Bearer {token}
```

#### QR Code d'inscription
```http
GET /api/registrations/{registration_id}/qr-code
```

Retourne une image PNG du QR code.

**Note :** Le QR code contient l'ID de l'inscription pour le scan.

#### Check-in participant
```http
POST /api/registrations/{registration_id}/check-in
Authorization: Bearer {token}
```

**Permissions :**
- Propriétaire de l'événement ou Admin

**Vérifications :**
- Inscription existe et est active (status: registered)
- Pas déjà checked-in

#### Check-out participant
```http
POST /api/registrations/{registration_id}/check-out
Authorization: Bearer {token}
```

**Permissions :**
- Propriétaire de l'événement ou Admin

**Vérifications :**
- Inscription existe et est checked-in

### Favoris

#### Ajouter aux favoris
```http
POST /api/favorites/{event_id}
Authorization: Bearer {token}
```

#### Retirer des favoris
```http
DELETE /api/favorites/{event_id}
Authorization: Bearer {token}
```

#### Mes favoris
```http
GET /api/favorites/my-favorites?skip=0&limit=100
Authorization: Bearer {token}
```

**Réponse :**
```json
[
  {
    "id": "favorite-id",
    "event": {
      "id": "event-id",
      "title": "Concert de Jazz",
      "description": "...",
      "category": "concert",
      "date_start": "2026-03-15T20:00:00Z",
      "image_url": "uploads/events/..."
    },
    "created_at": "2026-02-24T10:00:00Z"
  }
]
```

#### Vérifier si en favori
```http
GET /api/favorites/is-favorite/{event_id}
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "is_favorite": true
}
```

### Analytics

#### Statistiques globales (Admin)
```http
GET /api/analytics/global
Authorization: Bearer {token}
```

**Permissions :**
- Admin uniquement

Réponse :
```json
{
  "total_users": 150,
  "total_events": 45,
  "total_registrations": 320,
  "events_by_status": {
    "draft": 5,
    "published": 30,
    "cancelled": 2,
    "completed": 8
  },
  "registrations_by_status": {
    "registered": 200,
    "checked_in": 80,
    "checked_out": 30,
    "no_show": 5,
    "cancelled": 5
  }
}
```

#### Dashboard organisateur
```http
GET /api/analytics/my-dashboard
Authorization: Bearer {token}
```

**Permissions :**
- Event Owner ou Admin

Réponse :
```json
{
  "total_events": 5,
  "total_registrations": 120,
  "total_checked_in": 80,
  "events": [
    {
      "event_id": "uuid",
      "title": "Concert de Jazz",
      "status": "published",
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

**Permissions :**
- Propriétaire de l'événement ou Admin

## 🗂️ Structure du projet

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Point d'entrée FastAPI, CORS, routes
│   ├── config.py            # Configuration (SECRET_KEY, DATABASE_URL)
│   ├── database.py          # Connexion DB, SessionLocal
│   ├── models.py            # Modèles SQLAlchemy (User, Event, Registration, Favorite)
│   ├── schemas.py           # Schémas Pydantic avec validation
│   ├── auth.py              # Authentification JWT, hashage mots de passe
│   ├── utils.py             # Fonctions utilitaires (images, QR codes)
│   └── routes/
│       ├── __init__.py
│       ├── auth.py          # Routes authentification et profil
│       ├── events.py        # Routes événements et images
│       ├── registrations.py # Routes inscriptions et QR codes
│       ├── favorites.py     # Routes favoris
│       └── analytics.py     # Routes statistiques
├── uploads/
│   ├── events/              # Images des événements
│   └── profiles/            # Photos de profil
├── requirements.txt         # Dépendances Python
├── test.py                  # Suite de tests complète (100 tests)
├── README.md
└── IMAGES_UPLOAD.md
```

## 🔐 Sécurité

- **JWT** : Authentification par tokens avec expiration (30 jours)
- **Passwords** : 
  - Hashage avec bcrypt (via Passlib)
  - **Validation : minimum 8 caractères**
  - Jamais stockés en clair
- **CORS** : Configuré pour accepter les requêtes du frontend
- **Validation** : Validation stricte des données avec Pydantic
- **Autorisation** : Vérification des permissions sur chaque route protégée
- **Upload de fichiers** :
  - Validation du type MIME
  - Limitation de taille (5 MB)
  - Noms de fichiers sécurisés (UUID)

## 🎭 Rôles et Permissions

### User (Participant)
- Voir les événements publiés
- S'inscrire aux événements
- Gérer ses favoris
- Voir ses inscriptions et QR codes

### Event Owner (Organisateur)
Hérite des permissions User +
- Créer des événements
- Modifier/Supprimer ses événements
- Voir les participants de ses événements
- Check-in/Check-out des participants
- Statistiques de ses événements

### Admin
Hérite des permissions Event Owner +
- Approuver/Rejeter les événements
- Statistiques globales de la plateforme
- Accès à tous les événements
- Gérer tous les événements

## 📸 Upload d'images

### Formats acceptés
- JPEG (.jpg, .jpeg)
- PNG (.png)

### Limitations
- Taille maximale : 5 MB
- Dimensions recommandées :
  - Photos de profil : 500x500px (carré)
  - Images d'événements : 1200x630px (ratio 1.91:1)

### Stockage
- Les images sont stockées dans `/uploads/profiles/` et `/uploads/events/`
- Nommage : `{owner_id}_{uuid}.{extension}`
- Accessible via : `/uploads/{type}/{filename}`
- Suppression automatique de l'ancienne image lors du remplacement

## 🧪 Tests

```bash
# Lancer les tests
python test.py
```

Le fichier `test.py` contient **100 tests** couvrant :

### Tests d'authentification (15 tests)
- Inscription avec validation du mot de passe
- Connexion
- Profil utilisateur
- Upload et suppression d'image de profil

### Tests d'événements (40 tests)
- CRUD avec contrôle des permissions
- Filtrage et recherche
- Approbation/Rejet (Admin)
- Upload et suppression d'images
- Protection contre la suppression avec inscrits

### Tests d'inscriptions (25 tests)
- Inscription et annulation
- Vérification de la capacité
- Check-in/Check-out
- QR codes

### Tests de favoris (10 tests)
- Ajout/Retrait
- Liste des favoris
- Vérification du statut

### Tests d'analytics (10 tests)
- Statistiques globales (Admin)
- Dashboard organisateur
- Statistiques par événement

**Résultats attendus :** 100/100 tests passés ✅

## 🚀 Déploiement

### Variables d'environnement recommandées

```bash
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///./event.db  # ou postgresql://user:pass@host/db
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=5242880  # 5 MB en bytes
```

### Avec Docker (optionnel)

```dockerfile
FROM python:3.11-slim
WORKDIR /app

# Installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .

# Créer les dossiers d'upload
RUN mkdir -p uploads/events uploads/profiles

# Exposer le port
EXPOSE 8000

# Lancer l'application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build et run :**
```bash
docker build -t event-api .
docker run -p 8000:8000 -v $(pwd)/uploads:/app/uploads event-api
```

## 📝 Migrations SQL

Deux fichiers de migration sont fournis :

### `migration_add_favorites.sql`
Ajoute la table des favoris :
```bash
sqlite3 event.db < migration_add_favorites.sql
```

### `migration_add_profile_image.sql`
Ajoute le champ profile_image_url aux utilisateurs :
```bash
sqlite3 event.db < migration_add_profile_image.sql
```

## 🐛 Debug

### Problèmes courants

**Erreur 401 Unauthorized**
- Vérifier que le token JWT est valide et non expiré
- Format header : `Authorization: Bearer {token}`

**Erreur 403 Forbidden**
- Vérifier que l'utilisateur a les permissions nécessaires
- Vérifier le rôle de l'utilisateur (user, event_owner, admin)

**Erreur 422 Unprocessable Entity (Inscription)**
- **Mot de passe trop court** : minimum 8 caractères requis
- Email invalide
- Champs requis manquants

**Upload d'image échoue**
- Vérifier la taille du fichier (< 5 MB)
- Vérifier le format (JPEG ou PNG uniquement)
- Vérifier les permissions du dossier `/uploads/`
- Vérifier que les sous-dossiers `events/` et `profiles/` existent

**Event complet (400 Bad Request)**
- Vérifier `max_participants` vs nombre d'inscriptions actives
- Message : "Événement complet"

**Impossible de supprimer un événement (400 Bad Request)**
- L'événement a des participants actifs
- Message : "Impossible de supprimer un événement avec des inscriptions actives"
- Solution : Annuler l'événement plutôt que le supprimer

## 📊 API Endpoints - Résumé

| Méthode | Endpoint | Permission | Description |
|---------|----------|------------|-------------|
| **Auth** ||||
| POST | `/api/auth/register` | Public | Inscription (password ≥ 8 chars) |
| POST | `/api/auth/login` | Public | Connexion |
| GET | `/api/auth/me` | User | Mon profil |
| PUT | `/api/auth/me` | User | Modifier profil |
| POST | `/api/auth/profile-image` | User | Upload photo |
| DELETE | `/api/auth/profile-image` | User | Supprimer photo |
| **Events** ||||
| GET | `/api/events` | Public | Liste événements |
| POST | `/api/events` | Owner+ | Créer événement |
| GET | `/api/events/{id}` | Public | Détail événement |
| PUT | `/api/events/{id}` | Owner/Admin | Modifier événement |
| DELETE | `/api/events/{id}` | Owner/Admin | Supprimer événement |
| POST | `/api/events/{id}/approve` | Admin | Approuver |
| POST | `/api/events/{id}/reject` | Admin | Rejeter |
| POST | `/api/events/{id}/image` | Owner/Admin | Upload image |
| DELETE | `/api/events/{id}/image` | Owner/Admin | Supprimer image |
| GET | `/api/events/my-events` | Owner+ | Mes événements |
| GET | `/api/events/{id}/participants` | Owner/Admin | Participants |
| **Registrations** ||||
| POST | `/api/registrations/{event_id}` | User | S'inscrire |
| DELETE | `/api/registrations/{event_id}` | User | Annuler |
| GET | `/api/registrations/my-registrations` | User | Mes inscriptions |
| GET | `/api/registrations/{id}/qr-code` | Public | QR code (PNG) |
| POST | `/api/registrations/{id}/check-in` | Owner/Admin | Check-in |
| POST | `/api/registrations/{id}/check-out` | Owner/Admin | Check-out |
| **Favorites** ||||
| POST | `/api/favorites/{event_id}` | User | Ajouter favori |
| DELETE | `/api/favorites/{event_id}` | User | Retirer favori |
| GET | `/api/favorites/my-favorites` | User | Mes favoris |
| GET | `/api/favorites/is-favorite/{id}` | User | Vérifier statut |
| **Analytics** ||||
| GET | `/api/analytics/global` | Admin | Stats globales |
| GET | `/api/analytics/my-dashboard` | Owner+ | Mon dashboard |
| GET | `/api/analytics/event/{id}` | Owner/Admin | Stats événement |

## 📄 License

MIT

## 👥 Contribution

Les contributions sont les bienvenues ! Merci de :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Contact

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

_Documentation mise à jour le 24 Février 2026 - v1.0.0_
