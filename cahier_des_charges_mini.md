# Cahier des Charges MINI - Gestion d'Événements

## Projet MIF10 - Master Informatique 2025-2026

---

## 1. Objectif

Application web de gestion d'événements participatifs avec :

- **Organisateurs** → créent des événements (soumis à validation admin)
- **Admin** → approuve/rejette les événements, analytics globales
- **Utilisateurs** → s'inscrivent, reçoivent un QR code, présentent à l'entrée/sortie

---

## 2. Les 3 Acteurs

| Acteur          | Droits                                                      |
| --------------- | ----------------------------------------------------------- |
| **User**        | Voir events, s'inscrire, recevoir QR code, recommandations  |
| **Event Owner** | + Créer events, scanner QR des participants, analytics      |
| **Admin**       | + Approuver/rejeter events, analytics globales, gérer users |

---

## 3. Système QR Code

```
User s'inscrit → Reçoit QR unique → Présente QR → Organisateur scanne
```

| Étape     | Qui fait | Action                         |
| --------- | -------- | ------------------------------ |
| Register  | User     | S'inscrit en ligne → reçoit QR |
| Check-in  | Orga     | Scanne QR à l'entrée           |
| Check-out | Orga     | Scanne QR à la sortie          |

**Statuts** : `REGISTERED` → `CHECKED_IN` → `CHECKED_OUT`

---

## 4. Workflow Événements

```
Orga crée → PENDING → Admin approuve → PUBLISHED (visible)
                    → Admin rejette  → REJECTED
```

---

## 5. Stack Technique

| Couche  | Techno                        |
| ------- | ----------------------------- |
| Front   | React + TypeScript + Tailwind |
| Back    | Node.js + Express             |
| BDD     | PostgreSQL                    |
| Auth    | JWT                           |
| CI/CD   | GitLab CI + Docker            |
| Qualité | SonarQube                     |

---

## 6. API Endpoints (Résumé)

### Auth `/api/auth`

- `POST /register` - Créer compte
- `POST /login` - Connexion → JWT

### Events `/api/events`

- `GET /` - Liste events publiés
- `POST /` - Créer event (Owner)
- `POST /:id/approve` - Approuver (Admin)
- `POST /:id/reject` - Rejeter (Admin)

### Registrations `/api/registrations`

- `POST /:event_id/register` - S'inscrire
- `GET /:id/qr-code` - Télécharger QR
- `POST /scan/:registration_id` - Scanner QR (Owner)
- `GET /event/:id/participants` - Liste participants (Owner)

### Analytics `/api/analytics`

- `GET /global` - Stats globales (Admin)
- `GET /event/:id` - Stats event (Owner)

---

## 7. Modèles de Données

### User

`id, email, password, name, role (USER|EVENT_OWNER|ADMIN), preferences`

### Event

`id, title, description, category, location, date_start, date_end, max_participants, owner_id, status (PENDING|PUBLISHED|REJECTED)`

### Registration

`id, user_id, event_id, qr_code_url, status (REGISTERED|CHECKED_IN|CHECKED_OUT), registered_at, checked_in_at, checked_out_at`

---

## 8. Algorithme Recommandation

```
Score = 0.30×Catégorie + 0.25×Tags + 0.20×Localisation + 0.15×Popularité + 0.10×Collaboratif
```

---

## 9. Planning MIF10

| Semaine    | Focus                       | Heures |
| ---------- | --------------------------- | ------ |
| S1 (16/02) | Setup GitLab, Wiki, Équipe  | 5h     |
| S2 (23/02) | User Stories, Maquettes     | 10h    |
| S3 (16/03) | VM, CI/CD, Hello World      | 12h    |
| S4 (23/03) | MVP (Auth + Events)         | 12h    |
| S5 (20/04) | Inscriptions, QR, Analytics | 12h    |
| S6 (27/04) | Finalisation, Démo          | 12h    |

**Rendu** : 28/04/2026 | **Soutenance** : 29-30/04/2026

---

## 10. Permissions Résumé

| Action                  | User | Owner | Admin |
| ----------------------- | :--: | :---: | :---: |
| Voir/S'inscrire events  |  ✅  |  ✅   |  ✅   |
| Créer event             |  ❌  |  ✅   |  ✅   |
| Scanner QR participants |  ❌  |  ✅   |  ✅   |
| Approuver events        |  ❌  |  ❌   |  ✅   |
| Analytics globales      |  ❌  |  ❌   |  ✅   |

---

_MIF10 - Février 2026_
