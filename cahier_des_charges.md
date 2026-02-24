# Cahier des Charges - Plateforme de Gestion d'Événements Participatifs

## Projet MIF10 - Master Informatique 2025-2026

---

## 1. Présentation du Projet

### 1.1 Contexte

Ce projet s'inscrit dans le cadre de l'UE MIF10 (Projet transversal de Master Informatique) de l'Université Lyon 1. Il vise à développer une application web de gestion d'événements participatifs en équipe de 6 personnes, sur une durée de 6 semaines (60h de travail par étudiant).

### 1.2 Encadrants

- **Sylvain Brandel** - Responsable de l'UE, organisation, support, gestion de projet
- **Emmanuel Coquery** - Support Base de Données
- **Lionel Médini** - Support conception d'applications et programmation web

### 1.3 Objectif du Projet

Développer une plateforme web de gestion d'événements participatifs permettant :

- Aux **organisateurs** de proposer des événements (soumis à validation)
- Aux **administrateurs** de valider et gérer les événements
- Aux **utilisateurs** de s'inscrire et confirmer leur présence via QR code

### 1.4 Cible Utilisateur

L'application s'adresse aux structures organisatrices d'événements :

- Bibliothèques
- Universités
- Associations (type AML)
- Clubs sportifs amateurs

Elle permet de gérer le cycle de vie complet d'un événement : création, validation, publication, inscription des participants, et suivi de présence en temps réel via QR code.

---

## 2. Équipe et Organisation

### 2.1 Membres de l'Équipe

| Nom | Prénom | Email | Téléphone | Rôle Principal                 |
| --- | ------ | ----- | --------- | ------------------------------ |
|     |        |       |           | Spécialiste VM et Intégration  |
|     |        |       |           | Spécialiste Back-end           |
|     |        |       |           | Spécialiste Front-end          |
|     |        |       |           | Spécialiste Qualité et Testing |
|     |        |       |           | Spécialiste Produit (UX/UI)    |
|     |        |       |           | Spécialiste Suivi et Reporting |

### 2.2 Rôles Définis

| Rôle                               | Responsabilités                               |
| ---------------------------------- | --------------------------------------------- |
| **Spécialiste VM et Intégration**  | Configuration serveur, CI/CD, déploiement     |
| **Spécialiste Back-end**           | API REST, base de données, logique métier     |
| **Spécialiste Front-end**          | Interface utilisateur, intégration API        |
| **Spécialiste Qualité et Testing** | Tests unitaires, intégration, SonarQube       |
| **Spécialiste Produit (UX/UI)**    | Design, maquettes, cohérence de l'application |
| **Spécialiste Suivi et Reporting** | Gestion des issues, stand-ups, wiki           |

### 2.3 Organisation du Travail

#### Stand-ups Hebdomadaires

- **Lundi** : Planification des tâches de la semaine (issues GitLab)
- **Mercredi** : Point rapide mi-semaine
- **Vendredi** : Bilan + Rétrospective

#### Créneaux de Travail (Nautibus)

- Mardi 14h-17h15
- Jeudi 14h-17h15
- Vendredi 14h-17h15

#### Outils de Collaboration

| Outil       | Usage                     |
| ----------- | ------------------------- |
| **GitLab**  | Code, issues, wiki, CI/CD |
| **Discord** | Communication d'équipe    |
| **Jitsi**   | Visioconférences          |

---

## 3. Les Acteurs du Système

### 3.1 Utilisateur Simple (User)

- Consulter les événements publiés
- S'inscrire (Register) à un événement en ligne
- Recevoir un QR code unique pour son inscription
- Présenter son QR code à l'organisateur (check-in/check-out)
- Voir ses inscriptions et télécharger ses QR codes
- Recevoir des recommandations d'événements personnalisées

### 3.2 Organisateur d'Événements (Event Owner)

- Tous les droits d'un utilisateur simple
- Soumettre une demande de création d'événement (en attente de validation)
- Modifier/supprimer ses propres événements
- **Scanner les QR codes des participants** (check-in à l'entrée, check-out à la sortie)
- Voir les participants de ses événements en temps réel (inscrits, présents, partis)
- Consulter les analytics de ses événements

### 3.3 Administrateur (Admin)

- Tous les droits d'un organisateur
- Approuver/rejeter les demandes d'événements
- Voir les analytics globales de la plateforme
- Gérer tous les événements (modifier/supprimer)
- Gérer les utilisateurs

---

## 4. User Stories

### 4.1 Authentification

| ID    | En tant que | Je veux                       | Afin de                        |
| ----- | ----------- | ----------------------------- | ------------------------------ |
| US-01 | Visiteur    | Créer un compte               | Accéder à l'application        |
| US-02 | Utilisateur | Me connecter                  | Accéder à mes fonctionnalités  |
| US-03 | Utilisateur | Modifier mon profil           | Mettre à jour mes informations |
| US-04 | Utilisateur | Demander le rôle organisateur | Pouvoir créer des événements   |

### 4.2 Gestion des Événements

| ID    | En tant que  | Je veux                              | Afin de                              |
| ----- | ------------ | ------------------------------------ | ------------------------------------ |
| US-10 | Utilisateur  | Voir la liste des événements publiés | Découvrir les événements disponibles |
| US-11 | Utilisateur  | Voir le détail d'un événement        | Avoir toutes les informations        |
| US-12 | Utilisateur  | Recevoir des recommandations         | Découvrir des événements pertinents  |
| US-13 | Organisateur | Créer un événement                   | Le soumettre à validation            |
| US-14 | Organisateur | Modifier mon événement               | Mettre à jour les informations       |
| US-15 | Organisateur | Supprimer mon événement              | Le retirer de la plateforme          |
| US-16 | Organisateur | Générer un QR code                   | Permettre le check-in/check-out      |
| US-17 | Admin        | Voir les événements en attente       | Les examiner pour validation         |
| US-18 | Admin        | Approuver un événement               | Le rendre visible aux utilisateurs   |
| US-19 | Admin        | Rejeter un événement                 | Refuser sa publication               |

### 4.3 Inscriptions et Présence

| ID    | En tant que  | Je veux                            | Afin de                              |
| ----- | ------------ | ---------------------------------- | ------------------------------------ |
| US-20 | Utilisateur  | M'inscrire à un événement          | Réserver ma place et recevoir mon QR |
| US-21 | Utilisateur  | Annuler mon inscription            | Libérer ma place                     |
| US-22 | Utilisateur  | Voir mon QR code d'inscription     | Le présenter à l'organisateur        |
| US-23 | Utilisateur  | Télécharger mon QR code            | L'avoir hors connexion               |
| US-24 | Utilisateur  | Voir mes inscriptions              | Suivre mes participations            |
| US-25 | Organisateur | Scanner le QR d'un participant     | Enregistrer son check-in             |
| US-26 | Organisateur | Scanner le QR d'un participant     | Enregistrer son check-out            |
| US-27 | Organisateur | Voir les participants              | Gérer mon événement                  |
| US-28 | Organisateur | Voir qui est présent en temps réel | Suivre la présence live              |

### 4.4 Analytics

| ID    | En tant que  | Je veux                         | Afin de                             |
| ----- | ------------ | ------------------------------- | ----------------------------------- |
| US-30 | Organisateur | Voir les stats de mon événement | Analyser la participation           |
| US-31 | Organisateur | Voir mon dashboard              | Avoir une vue globale de mes events |
| US-32 | Admin        | Voir les analytics globales     | Piloter la plateforme               |

---

## 5. Système de Présence (QR Code)

### 5.1 Principe de Fonctionnement

Chaque **inscription (Registration)** génère un **QR code unique** pour le participant. L'**organisateur** scanne ce QR code à l'entrée et à la sortie de l'événement pour enregistrer la présence.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE PRÉSENCE                          │
└─────────────────────────────────────────────────────────────────┘

  UTILISATEUR                              ORGANISATEUR
  ────────────                             ────────────
       │                                        │
       │  1. S'inscrit en ligne                 │
       │     (Register)                         │
       ▼                                        │
  ┌──────────┐                                  │
  │ Reçoit   │                                  │
  │ QR Code  │                                  │
  │ unique   │                                  │
  └──────────┘                                  │
       │                                        │
       │  2. Présente son QR code               │
       │     à l'entrée                         │
       ▼                                        ▼
  ┌──────────┐    ───SCAN───▶           ┌──────────┐
  │ Montre   │                          │ Scanne   │
  │ QR Code  │                          │ CHECK-IN │
  └──────────┘                          └──────────┘
       │                                        │
       │  3. Présente son QR code               │
       │     à la sortie                        │
       ▼                                        ▼
  ┌──────────┐    ───SCAN───▶           ┌──────────┐
  │ Montre   │                          │ Scanne   │
  │ QR Code  │                          │CHECK-OUT │
  └──────────┘                          └──────────┘
```

### 5.2 Flux de Participation

```
     ┌──────────┐         ┌──────────┐         ┌──────────┐
     │          │         │          │         │          │
     │ REGISTER │────────▶│ CHECK-IN │────────▶│CHECK-OUT │
     │(Utilisateur)│      │(Orga scan)│        │(Orga scan)│
     │          │         │          │         │          │
     └──────────┘         └──────────┘         └──────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │ INSCRIT  │         │ PRÉSENT  │         │  PARTI   │
    │+ QR Code │         │(Checked-in)│       │(Checked-out)│
    └──────────┘         └──────────┘         └──────────┘
```

### 5.3 Description des Étapes

| Étape         | Qui          | Action             | Description                                    |
| ------------- | ------------ | ------------------ | ---------------------------------------------- |
| **Register**  | Utilisateur  | S'inscrit en ligne | Reçoit un QR code unique lié à son inscription |
| **Check-in**  | Organisateur | Scanne le QR code  | Confirme l'arrivée du participant              |
| **Check-out** | Organisateur | Scanne le QR code  | Confirme le départ du participant              |

### 5.4 QR Code - Spécifications

1. **Génération du QR Code**

   - Un QR code unique est généré pour chaque inscription
   - Le QR code contient l'ID de l'inscription (registration_id)
   - Format du contenu : `https://app.com/scan/{registration_id}`

2. **Affichage pour l'utilisateur**

   - Le QR code est visible dans "Mes inscriptions"
   - Possibilité de télécharger le QR code (image PNG)
   - Possibilité d'ajouter au wallet mobile (optionnel)

3. **Scan par l'organisateur**

   - L'organisateur utilise l'app pour scanner les QR codes
   - Interface de scan accessible depuis la gestion de l'événement
   - Le système détecte automatiquement si c'est un check-in ou check-out
   - Feedback visuel immédiat (succès/erreur)

4. **Validation lors du scan**
   - Vérifier que l'inscription existe
   - Vérifier que l'inscription correspond à cet événement
   - Vérifier que l'utilisateur n'est pas déjà checked-in (pour check-in)
   - Vérifier que l'utilisateur est checked-in (pour check-out)
   - Enregistrer l'heure exacte du scan

### 5.5 Statuts de Participation

| Statut  | Code          | Description                               |
| ------- | ------------- | ----------------------------------------- |
| Inscrit | `REGISTERED`  | Inscription effectuée, QR code généré     |
| Présent | `CHECKED_IN`  | Arrivée confirmée (organisateur a scanné) |
| Parti   | `CHECKED_OUT` | Départ confirmé (organisateur a scanné)   |
| Annulé  | `CANCELLED`   | Inscription annulée                       |
| Absent  | `NO_SHOW`     | Inscrit mais jamais venu                  |

---

## 6. Workflow des Événements

```
┌─────────────────┐
│  Event Owner    │
│  crée un event  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STATUT:       │
│   "PENDING"     │
│   (En attente)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     ADMIN       │
│   examine       │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│APPROVE│ │REJECT │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│PUBLISHED│ │REJECTED │
│(visible)│ │(archivé)│
└─────────┘ └─────────┘
```

### Statuts d'un Événement

- **DRAFT** : Brouillon (non soumis)
- **PENDING** : En attente de validation admin
- **PUBLISHED** : Approuvé et visible par tous
- **REJECTED** : Refusé par l'admin
- **CANCELLED** : Annulé par l'organisateur
- **COMPLETED** : Événement terminé

---

## 7. Architecture Technique

### 7.1 Stack Technologique

| Couche               | Technologie           | Justification                         |
| -------------------- | --------------------- | ------------------------------------- |
| **Front-end**        | React.js + TypeScript | Composants réutilisables, typage fort |
| **UI Framework**     | Tailwind CSS          | Rapidité de développement, responsive |
| **Back-end**         | Node.js + Express     | JavaScript fullstack, performances    |
| **Base de données**  | PostgreSQL            | Robustesse, relations complexes       |
| **Authentification** | JWT                   | Stateless, scalable                   |
| **QR Code**          | qrcode.js             | Génération côté serveur               |
| **Tests**            | Jest + Cypress        | Unitaires + E2E                       |
| **Qualité**          | SonarQube             | Analyse de code                       |
| **CI/CD**            | GitLab CI             | Intégration native                    |
| **Conteneurisation** | Docker                | Déploiement reproductible             |

### 7.2 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React.js + TypeScript                   │    │
│  │         (SPA - Single Page Application)              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVEUR                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Node.js + Express                       │    │
│  │                  (API REST)                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   PostgreSQL                         │    │
│  │               (Base de données)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Diagramme de Classes (Simplifié)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │    Event     │       │ Registration │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ email        │       │ title        │       │ user_id      │
│ password     │       │ description  │       │ event_id     │
│ name         │       │ category     │       │ qr_code_url  │
│ role         │       │ location     │       │ status       │
│ preferences  │       │ date_start   │       │ registered_at│
│ created_at   │       │ date_end     │       │ checked_in_at│
└──────────────┘       │ max_participants│    │ checked_out_at│
       │               │ owner_id     │      └──────────────┘
       │               │ status       │              │
       │               │ qr_code_url  │              │
       │               └──────────────┘              │
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Relationships    │
                    │  User 1──* Event  │
                    │  User 1──* Regist.│
                    │  Event 1──* Regist│
                    └───────────────────┘
```

---

## 8. Endpoints API

### 8.1 Authentification (`/api/auth`)

| Méthode | Route                | Description                | User | Owner | Admin |
| ------- | -------------------- | -------------------------- | ---- | ----- | ----- |
| POST    | `/register`          | Créer un compte            | ✅   | ✅    | ✅    |
| POST    | `/login`             | Se connecter → JWT         | ✅   | ✅    | ✅    |
| GET     | `/me`                | Mon profil                 | ✅   | ✅    | ✅    |
| PUT     | `/me`                | Modifier mon profil        | ✅   | ✅    | ✅    |
| POST    | `/request-organizer` | Demander rôle organisateur | ✅   | ❌    | ❌    |

### 8.2 Événements (`/api/events`)

| Méthode | Route              | Description               | User | Owner | Admin |
| ------- | ------------------ | ------------------------- | ---- | ----- | ----- |
| GET     | `/`                | Lister événements publiés | ✅   | ✅    | ✅    |
| GET     | `/my-events`       | Mes événements créés      | ❌   | ✅    | ✅    |
| GET     | `/pending`         | Événements en attente     | ❌   | ❌    | ✅    |
| GET     | `/recommendations` | Recommandations           | ✅   | ✅    | ✅    |
| GET     | `/:id`             | Détail d'un événement     | ✅   | ✅    | ✅    |
| GET     | `/:id/qr-code`     | QR code de l'événement    | ❌   | ✅\*  | ✅    |
| POST    | `/`                | Créer un événement        | ❌   | ✅    | ✅    |
| PUT     | `/:id`             | Modifier un événement     | ❌   | ✅\*  | ✅    |
| DELETE  | `/:id`             | Supprimer un événement    | ❌   | ✅\*  | ✅    |
| POST    | `/:id/approve`     | Approuver                 | ❌   | ❌    | ✅    |
| POST    | `/:id/reject`      | Rejeter                   | ❌   | ❌    | ✅    |

\*Owner = propriétaire de l'événement uniquement

### 8.3 Inscriptions & Présence (`/api/registrations`)

| Méthode | Route                     | Description                       | User | Owner  | Admin |
| ------- | ------------------------- | --------------------------------- | ---- | ------ | ----- |
| POST    | `/:event_id/register`     | S'inscrire à un événement         | ✅   | ✅     | ✅    |
| DELETE  | `/:event_id/register`     | Annuler inscription               | ✅   | ✅     | ✅    |
| GET     | `/my-registrations`       | Mes inscriptions + QR codes       | ✅   | ✅     | ✅    |
| GET     | `/:id/qr-code`            | Télécharger mon QR code           | ✅\* | ✅\*   | ✅    |
| POST    | `/scan/:registration_id`  | Scanner QR (check-in/out auto)    | ❌   | ✅\*\* | ✅    |
| POST    | `/:id/check-in`           | Check-in manuel d'un participant  | ❌   | ✅\*\* | ✅    |
| POST    | `/:id/check-out`          | Check-out manuel d'un participant | ❌   | ✅\*\* | ✅    |
| GET     | `/event/:id/participants` | Liste des participants            | ❌   | ✅\*\* | ✅    |
| GET     | `/event/:id/live`         | Présence en temps réel            | ❌   | ✅\*\* | ✅    |

\*User/Owner = propriétaire de l'inscription uniquement  
\*\*Owner = propriétaire de l'événement concerné uniquement

### 8.4 Analytics (`/api/analytics`)

| Méthode | Route           | Description      | User | Owner | Admin |
| ------- | --------------- | ---------------- | ---- | ----- | ----- |
| GET     | `/global`       | Stats globales   | ❌   | ❌    | ✅    |
| GET     | `/my-dashboard` | Mon dashboard    | ❌   | ✅    | ✅    |
| GET     | `/event/:id`    | Stats d'un event | ❌   | ✅\*  | ✅    |

### 8.5 Administration (`/api/admin`)

| Méthode | Route                             | Description           | User | Owner | Admin |
| ------- | --------------------------------- | --------------------- | ---- | ----- | ----- |
| GET     | `/users`                          | Liste utilisateurs    | ❌   | ❌    | ✅    |
| PUT     | `/users/:id/role`                 | Modifier rôle         | ❌   | ❌    | ✅    |
| GET     | `/organizer-requests`             | Demandes organisateur | ❌   | ❌    | ✅    |
| POST    | `/organizer-requests/:id/approve` | Approuver             | ❌   | ❌    | ✅    |
| POST    | `/organizer-requests/:id/reject`  | Rejeter               | ❌   | ❌    | ✅    |

---

## 9. Modèles de Données

### 9.1 User

```json
{
  "id": "uuid",
  "email": "string",
  "password": "string (hashed)",
  "name": "string",
  "role": "USER | EVENT_OWNER | ADMIN",
  "preferences": {
    "categories": ["string"],
    "location": "string"
  },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 9.2 Event

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "category": "string",
  "tags": ["string"],
  "location": "string",
  "date_start": "datetime",
  "date_end": "datetime",
  "max_participants": "integer",
  "image_url": "string",
  "qr_code_url": "string",
  "owner_id": "uuid (ref User)",
  "status": "DRAFT | PENDING | PUBLISHED | REJECTED | CANCELLED | COMPLETED",
  "rejection_reason": "string (optional)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 9.3 Registration

```json
{
  "id": "uuid",
  "user_id": "uuid (ref User)",
  "event_id": "uuid (ref Event)",
  "qr_code_url": "string (QR code unique de l'inscription)",
  "status": "REGISTERED | CHECKED_IN | CHECKED_OUT | CANCELLED | NO_SHOW",
  "registered_at": "datetime",
  "checked_in_at": "datetime (optional)",
  "checked_out_at": "datetime (optional)",
  "cancelled_at": "datetime (optional)"
}
```

### 9.4 OrganizerRequest

```json
{
  "id": "uuid",
  "user_id": "uuid (ref User)",
  "status": "PENDING | APPROVED | REJECTED",
  "reason": "string",
  "created_at": "datetime",
  "processed_at": "datetime (optional)",
  "processed_by": "uuid (ref User - Admin)"
}
```

---

## 10. Algorithme de Recommandation

### 10.1 Critères

1. **Historique d'inscriptions** - Catégories des événements passés
2. **Préférences utilisateur** - Catégories favorites, localisation
3. **Comportement** - Événements consultés récemment
4. **Popularité** - Événements trending
5. **Filtrage collaboratif** - Utilisateurs similaires

### 10.2 Formule de Score

```
Score = (0.30 × Catégorie_Match) +
        (0.25 × Tag_Match) +
        (0.20 × Location_Proximity) +
        (0.15 × Popularity_Score) +
        (0.10 × Collaborative_Score)
```

---

## 11. Règles de Gestion

### 11.1 Inscriptions

- Un utilisateur ne peut s'inscrire qu'une fois à un événement
- L'inscription est possible jusqu'à la date de début
- L'annulation est possible jusqu'à 24h avant l'événement
- Limite de participants respectée

### 11.2 Check-in / Check-out

- Check-in possible uniquement si inscrit
- Check-in possible uniquement pendant l'événement
- Check-out possible uniquement après check-in
- Un seul check-in/check-out par inscription

### 11.3 Événements

- Un événement doit être approuvé pour être visible
- Un événement avec des inscrits ne peut pas être supprimé (seulement annulé)

---

## 12. Planning du Projet (Jalons MIF10)

### Semaine 1 (16/02) - Lancement | 5h/personne

**Objectifs :**

- [x] Création du groupe GitLab
- [x] Création du projet GitLab
- [x] Page de garde du Wiki
- [x] Page équipe avec liste des membres
- [x] Ajout des enseignants comme rapporteurs

**Livrables Jalon 1 :**

- Groupe et projet GitLab créés
- Wiki initialisé avec page de garde et page équipe

---

### Semaine 2 (23/02) - Conception | 10h/personne

**Objectifs :**

- [ ] Définition des rôles dans l'équipe
- [ ] Rédaction des objectifs et cible utilisateur
- [ ] Création des user stories
- [ ] Création des maquettes écrans
- [ ] Création des issues GitLab

**Livrables Jalon 2 :**

- Rôles et organisation définis
- User stories documentées
- Maquettes écrans
- Issues GitLab créées

---

### Semaine 3 (16/03) - Stack et démarrage | 12h/personne

**Objectifs :**

- [ ] Configuration de la VM
- [ ] Mise en place CI/CD GitLab
- [ ] Configuration SonarQube
- [ ] Hello World avec connexion BDD

**Livrables Jalon 3 :**

- VM fonctionnelle
- CI/CD opérationnel
- Hello World déployé
- Documentation technique (How-to, outils, architecture)

---

### Semaine 4 (23/03) - MVP | 12h/personne

**Objectifs :**

- [ ] Authentification (register/login)
- [ ] CRUD Événements basique
- [ ] Affichage liste des événements

**Livrables Jalon 4 :**

- Chaîne CI/CD complète
- UNE fonctionnalité de base intégrée

---

### Semaine 5 (20/04) - Développement | 12h/personne

**Objectifs :**

- [ ] Système d'inscription
- [ ] Check-in/Check-out QR Code
- [ ] Workflow validation Admin
- [ ] Analytics de base
- [ ] Tests

**Livrables Jalon 5 :**

- Screenshots des tickets traités
- Extrait SonarQube

---

### Semaine 6 (27/04) - Livraison | 12h/personne

**Objectifs :**

- [ ] Finalisation (pas de nouvelles fonctionnalités)
- [ ] Corrections de bugs
- [ ] Documentation
- [ ] Préparation démo

**Livrables Jalon 6 :**

- Guide d'utilisation sur wiki
- Architecture mise à jour
- Documentation technique
- Branche FINAL créée

---

## 13. Rendus et Soutenances

### 13.1 Dates Clés

| Date                 | Événement                     |
| -------------------- | ----------------------------- |
| **28/04/2026 23h59** | Rendu du code (branche FINAL) |
| **29/04/2026 12h00** | Mise à jour wiki              |
| **30/04/2026 23h59** | Évaluation entre pairs        |
| **29-30/04/2026**    | Soutenances                   |

### 13.2 Éléments du Rendu

- [ ] Branche `FINAL` avec code de la démo
- [ ] `README.md` avec dépendances et procédure de build
- [ ] Wiki structuré avec tous les rendus intermédiaires
- [ ] Documentation qualité (tests, SonarQube)
- [ ] Page démo avec lien VM et instructions

### 13.3 Soutenance (25 min)

- **15 min** : Présentation et démo
- **10 min** : Questions

**Contenu :**

- Démonstration du scénario principal
- Choix d'architecture
- Mode de fonctionnement collaboratif
- Rétrospective Agile
- Leçons apprises

---

## 14. Résumé des Permissions

| Action                  | User | Owner | Admin |
| ----------------------- | ---- | ----- | ----- |
| Voir événements publiés | ✅   | ✅    | ✅    |
| S'inscrire (Register)   | ✅   | ✅    | ✅    |
| Check-in / Check-out    | ✅   | ✅    | ✅    |
| Recommandations         | ✅   | ✅    | ✅    |
| Créer événement         | ❌   | ✅    | ✅    |
| Générer QR code         | ❌   | ✅    | ✅    |
| Voir participants       | ❌   | ✅    | ✅    |
| Analytics (ses events)  | ❌   | ✅    | ✅    |
| Approuver événements    | ❌   | ❌    | ✅    |
| Analytics globales      | ❌   | ❌    | ✅    |
| Gérer utilisateurs      | ❌   | ❌    | ✅    |

---

## 15. Annexes

### 15.1 Liens Utiles

- **Projet GitLab** : [À compléter]
- **Wiki** : [À compléter]
- **VM de Démo** : [À compléter]
- **Discord** : [À compléter]

### 15.2 Contact Encadrants

- Questions techniques → Issues GitLab (publiques)
- Questions personnelles/organisation → Email à Sylvain Brandel

---

_Document créé le 20 Février 2026 - Projet MIF10_
