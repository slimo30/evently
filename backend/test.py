"""
Test complet de l'API Event Management
Exécute tous les endpoints avec tous les champs

Usage:
    cd backend
    source venv/bin/activate
    python test.py
"""

import requests
import psycopg2
from pathlib import Path
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

# Resolve the database URL from the .env file next to this script,
# falling back to the same default as app/config.py
_ENV_FILE = Path(__file__).parent / ".env"
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/eventdb"
if _ENV_FILE.exists():
    for line in _ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            DATABASE_URL = line.split("=", 1)[1].strip()
            break

# Absolute path to the directory that contains this script —
# used to locate test asset files regardless of cwd.
TEST_DIR = Path(__file__).parent

# Couleurs pour le terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(name, success, response=None):
    """Affiche le résultat d'un test"""
    status = f"{GREEN}✓ PASS{RESET}" if success else f"{RED}✗ FAIL{RESET}"
    print(f"{status} - {name}")
    if response and not success:
        print(f"  Status: {response.status_code}")
        try:
            print(f"  Response: {response.json()}")
        except:
            print(f"  Response: {response.text[:200]}")


def print_section(name):
    """Affiche une section"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")


def update_user_role(user_id, role):
    """Met à jour le rôle d'un utilisateur directement dans la base PostgreSQL"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("UPDATE users SET role = %s WHERE id = %s", (role, user_id))
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"{RED}  Erreur SQL: {e}{RESET}")
        return False


class APITester:
    def __init__(self):
        self.user_token = None
        self.organizer_token = None
        self.admin_token = None
        self.user_id = None
        self.organizer_id = None
        self.admin_id = None
        self.event_id = None
        self.event_id_2 = None
        self.registration_id = None
        self.results = {"passed": 0, "failed": 0}

    def test(self, name, condition, response=None):
        """Enregistre et affiche un test"""
        if condition:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
        print_test(name, condition, response)
        return condition

    # ==================== HEALTH CHECK ====================
    def test_health(self):
        print_section("HEALTH CHECK")

        # GET /health
        r = requests.get(f"{BASE_URL.replace('/api', '')}/health")
        self.test("GET /health", r.status_code == 200, r)

        # GET /
        r = requests.get(BASE_URL.replace('/api', ''))
        self.test("GET /", r.status_code == 200, r)

    # ==================== AUTH ====================
    def test_auth(self):
        print_section("AUTHENTIFICATION")

        timestamp = datetime.now().timestamp()

        # POST /api/auth/register - User
        user_data = {
            "email": f"user_{timestamp}@test.com",
            "password": "Password123!",
            "name": "Test User"
        }
        r = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        success = r.status_code == 201
        self.test("POST /api/auth/register (User)", success, r)
        if success:
            self.user_id = r.json()["id"]
            self.user_email = user_data["email"]
            self.user_password = user_data["password"]

        # POST /api/auth/register - Organizer
        organizer_data = {
            "email": f"organizer_{timestamp}@test.com",
            "password": "Password123!",
            "name": "Test Organizer"
        }
        r = requests.post(f"{BASE_URL}/auth/register", json=organizer_data)
        success = r.status_code == 201
        self.test("POST /api/auth/register (Organizer)", success, r)
        if success:
            self.organizer_id = r.json()["id"]
            self.organizer_email = organizer_data["email"]
            self.organizer_password = organizer_data["password"]

        # POST /api/auth/register - Admin
        admin_data = {
            "email": f"admin_{timestamp}@test.com",
            "password": "Password123!",
            "name": "Test Admin"
        }
        r = requests.post(f"{BASE_URL}/auth/register", json=admin_data)
        success = r.status_code == 201
        self.test("POST /api/auth/register (Admin)", success, r)
        if success:
            self.admin_id = r.json()["id"]
            self.admin_email = admin_data["email"]
            self.admin_password = admin_data["password"]

        # POST /api/auth/register - Email déjà utilisé
        r = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        self.test("POST /api/auth/register (Email déjà utilisé)", r.status_code == 400, r)

        # POST /api/auth/register - Email invalide (422 from Pydantic EmailStr)
        invalid_email_data = {
            "email": "not-an-email",
            "password": "Password123!",
            "name": "Test"
        }
        r = requests.post(f"{BASE_URL}/auth/register", json=invalid_email_data)
        self.test("POST /api/auth/register (Email invalide)", r.status_code == 422, r)

        # POST /api/auth/register - Mot de passe trop court (< 8 chars → 422 from Pydantic validator)
        short_password_data = {
            "email": f"short_{timestamp}@test.com",
            "password": "Pass1!",   # 6 characters — fails the 8-char validator
            "name": "Test"
        }
        r = requests.post(f"{BASE_URL}/auth/register", json=short_password_data)
        self.test("POST /api/auth/register (Mot de passe trop court)", r.status_code == 422, r)

        # POST /api/auth/login - User
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        success = r.status_code == 200
        self.test("POST /api/auth/login (User)", success, r)
        if success:
            self.user_token = r.json()["access_token"]

        # POST /api/auth/login - Organizer
        login_data = {
            "email": organizer_data["email"],
            "password": organizer_data["password"]
        }
        r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        success = r.status_code == 200
        self.test("POST /api/auth/login (Organizer)", success, r)
        if success:
            self.organizer_token = r.json()["access_token"]

        # POST /api/auth/login - Admin
        login_data = {
            "email": admin_data["email"],
            "password": admin_data["password"]
        }
        r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        success = r.status_code == 200
        self.test("POST /api/auth/login (Admin)", success, r)
        if success:
            self.admin_token = r.json()["access_token"]

        # POST /api/auth/login - Mauvais mot de passe
        login_data = {
            "email": user_data["email"],
            "password": "WrongPassword"
        }
        r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        self.test("POST /api/auth/login (Mauvais mot de passe)", r.status_code == 401, r)

        # POST /api/auth/login - Utilisateur inexistant
        login_data = {
            "email": "nonexistent@test.com",
            "password": "Password123!"
        }
        r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        self.test("POST /api/auth/login (Utilisateur inexistant)", r.status_code == 401, r)

        # GET /api/auth/me
        headers = {"Authorization": f"Bearer {self.user_token}"}
        r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        self.test("GET /api/auth/me", r.status_code == 200, r)

        # GET /api/auth/me - Sans token (HTTPBearer returns 403 when no credentials)
        r = requests.get(f"{BASE_URL}/auth/me")
        self.test("GET /api/auth/me (Sans token)", r.status_code == 403, r)

        # GET /api/auth/me - Token invalide (HTTPBearer + JWTError → 401)
        invalid_headers = {"Authorization": "Bearer invalid_token_123"}
        r = requests.get(f"{BASE_URL}/auth/me", headers=invalid_headers)
        self.test("GET /api/auth/me (Token invalide)", r.status_code == 401, r)

        # PUT /api/auth/me - Mettre à jour le profil
        update_profile_data = {
            "name": "Updated User Name",
            "email": user_data["email"]  # Garder le même email
        }
        r = requests.put(f"{BASE_URL}/auth/me", json=update_profile_data, headers=headers)
        self.test("PUT /api/auth/me (Mise à jour profil)", r.status_code == 200, r)
        if r.status_code == 200:
            print(f"  {YELLOW}→ Nom mis à jour: {r.json()['name']}{RESET}")

        # PUT /api/auth/me - Vérifier que le nom a été mis à jour
        r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if r.status_code == 200:
            success = r.json()["name"] == "Updated User Name"
            self.test("GET /api/auth/me (Vérification mise à jour)", success, r)

        # PUT /api/auth/me - Sans token (HTTPBearer returns 403)
        r = requests.put(f"{BASE_URL}/auth/me", json=update_profile_data)
        self.test("PUT /api/auth/me (Sans token)", r.status_code == 403, r)

        # PUT /api/auth/me - Email déjà utilisé par un autre utilisateur
        update_with_existing_email = {
            "name": "Test",
            "email": organizer_data["email"]  # Email de l'organisateur
        }
        r = requests.put(f"{BASE_URL}/auth/me", json=update_with_existing_email, headers=headers)
        self.test("PUT /api/auth/me (Email déjà utilisé)", r.status_code == 400, r)

    # ==================== MISE À JOUR DES RÔLES ====================
    def update_roles(self):
        """Met à jour les rôles directement dans la base de données SQLite"""
        print_section("MISE À JOUR DES RÔLES")

        if self.organizer_id:
            success = update_user_role(self.organizer_id, "EVENT_OWNER")
            self.test("UPDATE role → EVENT_OWNER (Organizer)", success)
            if success:
                # Re-login pour obtenir un nouveau token avec le bon rôle
                login_data = {"email": self.organizer_email, "password": self.organizer_password}
                r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
                if r.status_code == 200:
                    self.organizer_token = r.json()["access_token"]

        if self.admin_id:
            success = update_user_role(self.admin_id, "ADMIN")
            self.test("UPDATE role → ADMIN (Admin)", success)
            if success:
                # Re-login pour obtenir un nouveau token avec le bon rôle
                login_data = {"email": self.admin_email, "password": self.admin_password}
                r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
                if r.status_code == 200:
                    self.admin_token = r.json()["access_token"]

    # ==================== EVENTS ====================
    def test_events(self):
        print_section("ÉVÉNEMENTS")

        headers_user = {"Authorization": f"Bearer {self.user_token}"}
        headers_organizer = {"Authorization": f"Bearer {self.organizer_token}"}
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        # GET /api/events/ - Liste publique
        r = requests.get(f"{BASE_URL}/events/")
        self.test("GET /api/events/ (Liste publique)", r.status_code == 200, r)

        # GET /api/events/ - Avec filtres
        params = {
            "search": "test",
            "category": "tech",
            "location": "Lyon",
            "skip": 0,
            "limit": 10
        }
        r = requests.get(f"{BASE_URL}/events/", params=params)
        self.test("GET /api/events/ (Avec filtres)", r.status_code == 200, r)

        # POST /api/events/ - Créer événement (User - devrait échouer, role USER → 403)
        event_data = {
            "title": "Test Event by User",
            "description": "Description de l'événement test créé par un user",
            "category": "tech",
            "tags": ["python", "fastapi", "test"],
            "location": "Lyon, France",
            "date_start": (datetime.now() + timedelta(days=7)).isoformat(),
            "date_end": (datetime.now() + timedelta(days=7, hours=3)).isoformat(),
            "max_participants": 100,
            "image_url": "https://example.com/image.jpg"
        }
        r = requests.post(f"{BASE_URL}/events/", json=event_data, headers=headers_user)
        self.test("POST /api/events/ (User - doit échouer)", r.status_code == 403, r)

        # POST /api/events/ - Créer événement (Organizer)
        event_data_org = {
            "title": "Test Event by Organizer",
            "description": "Description de l'événement test créé par un organisateur",
            "category": "tech",
            "tags": ["python", "fastapi", "workshop"],
            "location": "Lyon, France",
            "date_start": (datetime.now() + timedelta(days=7)).isoformat(),
            "date_end": (datetime.now() + timedelta(days=7, hours=3)).isoformat(),
            "max_participants": 50,
            "image_url": "https://example.com/workshop.jpg"
        }
        r = requests.post(f"{BASE_URL}/events/", json=event_data_org, headers=headers_organizer)
        success = r.status_code == 201
        self.test("POST /api/events/ (Organizer)", success, r)
        if success:
            self.event_id = r.json()["id"]

        # POST /api/events/ - Créer événement (Admin)
        event_data_admin = {
            "title": "Test Event by Admin",
            "description": "Description de l'événement test créé par un admin",
            "category": "music",
            "tags": ["concert", "live", "jazz"],
            "location": "Paris, France",
            "date_start": (datetime.now() + timedelta(days=14)).isoformat(),
            "date_end": (datetime.now() + timedelta(days=14, hours=5)).isoformat(),
            "max_participants": 200,
            "image_url": "https://example.com/concert.jpg"
        }
        r = requests.post(f"{BASE_URL}/events/", json=event_data_admin, headers=headers_admin)
        success = r.status_code == 201
        self.test("POST /api/events/ (Admin)", success, r)
        if success:
            self.event_id_2 = r.json()["id"]

        # GET /api/events/my-events (Organizer) — must come before /{event_id} in test flow
        r = requests.get(f"{BASE_URL}/events/my-events", headers=headers_organizer)
        self.test("GET /api/events/my-events (Organizer)", r.status_code == 200, r)

        # GET /api/events/my-events (Admin)
        r = requests.get(f"{BASE_URL}/events/my-events", headers=headers_admin)
        self.test("GET /api/events/my-events (Admin)", r.status_code == 200, r)

        # GET /api/events/pending (Admin)
        r = requests.get(f"{BASE_URL}/events/pending", headers=headers_admin)
        self.test("GET /api/events/pending (Admin)", r.status_code == 200, r)

        # GET /api/events/pending (User - doit échouer)
        r = requests.get(f"{BASE_URL}/events/pending", headers=headers_user)
        self.test("GET /api/events/pending (User - doit échouer)", r.status_code == 403, r)

        # GET /api/events/recommendations
        r = requests.get(f"{BASE_URL}/events/recommendations", headers=headers_user, params={"limit": 5})
        self.test("GET /api/events/recommendations", r.status_code == 200, r)

        if self.event_id:
            # GET /api/events/{id}
            r = requests.get(f"{BASE_URL}/events/{self.event_id}")
            self.test("GET /api/events/{id}", r.status_code == 200, r)

            # GET /api/events/{id}/similar
            r = requests.get(f"{BASE_URL}/events/{self.event_id}/similar", params={"limit": 5})
            self.test("GET /api/events/{id}/similar", r.status_code == 200, r)

            # PUT /api/events/{id} - Par le propriétaire
            update_data = {
                "title": "Test Event by Organizer - UPDATED",
                "description": "Description mise à jour",
                "max_participants": 75
            }
            r = requests.put(f"{BASE_URL}/events/{self.event_id}", json=update_data, headers=headers_organizer)
            self.test("PUT /api/events/{id} (Propriétaire)", r.status_code == 200, r)

            # PUT /api/events/{id} - Par un autre user (doit échouer)
            r = requests.put(f"{BASE_URL}/events/{self.event_id}", json=update_data, headers=headers_user)
            self.test("PUT /api/events/{id} (Autre user - doit échouer)", r.status_code == 403, r)

            # PUT /api/events/{id} - Par admin
            update_data_admin = {"title": "Test Event - Admin Updated"}
            r = requests.put(f"{BASE_URL}/events/{self.event_id}", json=update_data_admin, headers=headers_admin)
            self.test("PUT /api/events/{id} (Admin)", r.status_code == 200, r)

            # POST /api/events/{id}/approve (Admin) — event starts as PENDING
            r = requests.post(f"{BASE_URL}/events/{self.event_id}/approve", headers=headers_admin)
            self.test("POST /api/events/{id}/approve (Admin)", r.status_code == 200, r)

            # POST /api/events/{id}/approve (Déjà approuvé - doit échouer, status != PENDING)
            r = requests.post(f"{BASE_URL}/events/{self.event_id}/approve", headers=headers_admin)
            self.test("POST /api/events/{id}/approve (Déjà approuvé)", r.status_code == 400, r)

        if self.event_id_2:
            # POST /api/events/{id}/reject (Admin) — event_id_2 is still PENDING
            reject_data = {"reason": "Ne respecte pas les critères de la plateforme"}
            r = requests.post(f"{BASE_URL}/events/{self.event_id_2}/reject", json=reject_data, headers=headers_admin)
            self.test("POST /api/events/{id}/reject (Admin)", r.status_code == 200, r)

    # ==================== REGISTRATIONS ====================
    def test_registrations(self):
        print_section("INSCRIPTIONS")

        headers_user = {"Authorization": f"Bearer {self.user_token}"}
        headers_organizer = {"Authorization": f"Bearer {self.organizer_token}"}
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        if not self.event_id:
            print(f"{YELLOW}⚠ Pas d'événement disponible pour les tests d'inscription{RESET}")
            return

        # Vérifier que l'événement est bien PUBLISHED
        r = requests.get(f"{BASE_URL}/events/{self.event_id}")
        if r.status_code == 200:
            event_status = r.json().get("status")
            print(f"  {YELLOW}→ Event status: {event_status}{RESET}")
            if event_status != "PUBLISHED":
                r = requests.post(f"{BASE_URL}/events/{self.event_id}/approve", headers=headers_admin)
                print(f"  {YELLOW}→ Approbation de l'événement: {r.status_code}{RESET}")

        # POST /api/registrations/{event_id} - S'inscrire (User)
        r = requests.post(f"{BASE_URL}/registrations/{self.event_id}", headers=headers_user)
        success = r.status_code == 201
        self.test("POST /api/registrations/{event_id} (User s'inscrit)", success, r)
        if success:
            self.registration_id = r.json()["id"]

        # POST /api/registrations/{event_id} - Déjà inscrit
        r = requests.post(f"{BASE_URL}/registrations/{self.event_id}", headers=headers_user)
        self.test("POST /api/registrations/{event_id} (Déjà inscrit)", r.status_code == 400, r)

        # POST /api/registrations/{event_id} - Admin s'inscrit aussi
        r = requests.post(f"{BASE_URL}/registrations/{self.event_id}", headers=headers_admin)
        admin_registration_id = r.json()["id"] if r.status_code == 201 else None
        self.test("POST /api/registrations/{event_id} (Admin s'inscrit)", r.status_code == 201, r)

        # GET /api/registrations/my-registrations (User)
        r = requests.get(f"{BASE_URL}/registrations/my-registrations", headers=headers_user)
        self.test("GET /api/registrations/my-registrations", r.status_code == 200, r)

        if self.registration_id:
            # GET /api/registrations/{id}/qr-code (Propriétaire)
            r = requests.get(f"{BASE_URL}/registrations/{self.registration_id}/qr-code", headers=headers_user)
            self.test("GET /api/registrations/{id}/qr-code (Propriétaire)", r.status_code == 200, r)

            # GET /api/registrations/{id}/qr-code (Admin peut accéder)
            r = requests.get(f"{BASE_URL}/registrations/{self.registration_id}/qr-code", headers=headers_admin)
            self.test("GET /api/registrations/{id}/qr-code (Admin)", r.status_code == 200, r)

            # GET /api/registrations/event/{id}/participants (Organizer - propriétaire event)
            r = requests.get(f"{BASE_URL}/registrations/event/{self.event_id}/participants", headers=headers_organizer)
            self.test("GET /api/registrations/event/{id}/participants (Organizer)", r.status_code == 200, r)

            # GET /api/registrations/event/{id}/participants (User - doit échouer)
            r = requests.get(f"{BASE_URL}/registrations/event/{self.event_id}/participants", headers=headers_user)
            self.test("GET /api/registrations/event/{id}/participants (User - doit échouer)", r.status_code == 403, r)

            # GET /api/registrations/event/{id}/live (Organizer)
            r = requests.get(f"{BASE_URL}/registrations/event/{self.event_id}/live", headers=headers_organizer)
            self.test("GET /api/registrations/event/{id}/live", r.status_code == 200, r)
            if r.status_code == 200:
                print(f"  {YELLOW}→ Live: {r.json()}{RESET}")

            # ──────────────────────────────────────────
            # QR SCAN TESTS — Uses a dedicated fresh event/registration
            # so state is always predictable (REGISTERED → CHECKED_IN → CHECKED_OUT → CHECKED_IN …)
            # ──────────────────────────────────────────

            scan_event_data = {
                "title": "Scan Test Event",
                "description": "Dédié aux tests de scan QR",
                "category": "tech",
                "tags": [],
                "location": "Scan Lab",
                "date_start": (datetime.now() + timedelta(days=90)).isoformat(),
                "date_end": (datetime.now() + timedelta(days=90, hours=3)).isoformat(),
                "max_participants": 50,
                "image_url": None
            }
            rs_event = requests.post(f"{BASE_URL}/events/", json=scan_event_data, headers=headers_organizer)
            if rs_event.status_code == 201:
                scan_event_id = rs_event.json()["id"]

                # Approve the event as admin
                requests.post(f"{BASE_URL}/events/{scan_event_id}/approve", headers=headers_admin)

                # User registers
                rs_reg = requests.post(f"{BASE_URL}/registrations/{scan_event_id}", headers=headers_user)
                if rs_reg.status_code == 201:
                    scan_reg_id = rs_reg.json()["id"]
                    print(f"  {YELLOW}→ Scan registration ID: {scan_reg_id}{RESET}")

                    # 1. GET QR code (owner)
                    r = requests.get(f"{BASE_URL}/registrations/{scan_reg_id}/qr-code", headers=headers_user)
                    self.test("GET /api/registrations/{id}/qr-code (Propriétaire)", r.status_code == 200, r)
                    if r.status_code == 200:
                        print(f"  {YELLOW}→ QR code PNG size: {len(r.content)} bytes{RESET}")

                    # 2. GET QR code as admin
                    r = requests.get(f"{BASE_URL}/registrations/{scan_reg_id}/qr-code", headers=headers_admin)
                    self.test("GET /api/registrations/{id}/qr-code (Admin)", r.status_code == 200, r)

                    # 3. Check-in via scan (REGISTERED → CHECKED_IN)
                    r = requests.post(
                        f"{BASE_URL}/registrations/scan/{scan_reg_id}",
                        params={"event_id": scan_event_id},
                        headers=headers_organizer
                    )
                    self.test("POST /api/registrations/scan (Check-in: REGISTERED→CHECKED_IN)", r.status_code == 200, r)
                    if r.status_code == 200:
                        print(f"  {YELLOW}→ Status: {r.json()['status']}{RESET}")
                        assert r.json()['status'] == 'CHECKED_IN', f"Expected CHECKED_IN, got {r.json()['status']}"

                    # 4. Check-out via scan (CHECKED_IN → CHECKED_OUT)
                    r = requests.post(
                        f"{BASE_URL}/registrations/scan/{scan_reg_id}",
                        params={"event_id": scan_event_id},
                        headers=headers_organizer
                    )
                    self.test("POST /api/registrations/scan (Check-out: CHECKED_IN→CHECKED_OUT)", r.status_code == 200, r)
                    if r.status_code == 200:
                        print(f"  {YELLOW}→ Status: {r.json()['status']}{RESET}")
                        assert r.json()['status'] == 'CHECKED_OUT', f"Expected CHECKED_OUT, got {r.json()['status']}"

                    # 5. Scan again when CHECKED_OUT → backend re-checks-in (CHECKED_OUT → CHECKED_IN)
                    #    This is by design: the backend allows re-entry after check-out.
                    r = requests.post(
                        f"{BASE_URL}/registrations/scan/{scan_reg_id}",
                        params={"event_id": scan_event_id},
                        headers=headers_organizer
                    )
                    self.test("POST /api/registrations/scan (Re-check-in: CHECKED_OUT→CHECKED_IN)", r.status_code == 200, r)
                    if r.status_code == 200:
                        print(f"  {YELLOW}→ Status: {r.json()['status']}{RESET}")
                        assert r.json()['status'] == 'CHECKED_IN', f"Expected CHECKED_IN, got {r.json()['status']}"

                    # 6. Wrong event_id — must fail (400)
                    if self.event_id_2:
                        r = requests.post(
                            f"{BASE_URL}/registrations/scan/{scan_reg_id}",
                            params={"event_id": self.event_id_2},
                            headers=headers_organizer
                        )
                        self.test("POST /api/registrations/scan (Mauvais event_id — doit échouer 400)", r.status_code == 400, r)

                    # 7. Non-organizer tries to scan — must fail (403)
                    rs_admin_reg = requests.post(f"{BASE_URL}/registrations/{scan_event_id}", headers=headers_admin)
                    if rs_admin_reg.status_code == 201:
                        other_reg_id = rs_admin_reg.json()["id"]
                        r = requests.post(
                            f"{BASE_URL}/registrations/scan/{other_reg_id}",
                            params={"event_id": scan_event_id},
                            headers=headers_user   # regular user, not organizer — should 403
                        )
                        self.test("POST /api/registrations/scan (Non-organisateur — doit échouer 403)", r.status_code == 403, r)

                        # 8. Scan without event_id — backward-compatible (uses admin's registration)
                        r = requests.post(
                            f"{BASE_URL}/registrations/scan/{other_reg_id}",
                            headers=headers_organizer  # no event_id param
                        )
                        self.test("POST /api/registrations/scan (Sans event_id — rétrocompatible)", r.status_code == 200, r)

            # ──────────────────────────────────────────
            # GET participants + live stats
            # ──────────────────────────────────────────
            r = requests.get(f"{BASE_URL}/registrations/event/{self.event_id}/participants", headers=headers_organizer)
            self.test("GET /api/registrations/event/{id}/participants (Organizer)", r.status_code == 200, r)

            r = requests.get(f"{BASE_URL}/registrations/event/{self.event_id}/participants", headers=headers_user)
            self.test("GET /api/registrations/event/{id}/participants (User — doit échouer 403)", r.status_code == 403, r)

            r = requests.get(f"{BASE_URL}/registrations/event/{self.event_id}/live", headers=headers_organizer)
            self.test("GET /api/registrations/event/{id}/live (Organizer)", r.status_code == 200, r)
            if r.status_code == 200:
                print(f"  {YELLOW}→ Live stats: {r.json()}{RESET}")

            # ──────────────────────────────────────────
            # Manual check-in / check-out endpoints
            # admin_registration_id is currently REGISTERED (not yet touched by scan tests)
            # ──────────────────────────────────────────
            if admin_registration_id:
                r = requests.post(f"{BASE_URL}/registrations/{admin_registration_id}/check-in", headers=headers_organizer)
                self.test("POST /api/registrations/{id}/check-in (Manuel)", r.status_code == 200, r)

                r = requests.post(f"{BASE_URL}/registrations/{admin_registration_id}/check-out", headers=headers_organizer)
                self.test("POST /api/registrations/{id}/check-out (Manuel)", r.status_code == 200, r)

        # Test annulation - Créer une nouvelle inscription pour l'annuler
        event_for_cancel = {
            "title": "Event for Cancel Test",
            "description": "Test annulation",
            "category": "test",
            "tags": ["cancel"],
            "location": "Test",
            "date_start": (datetime.now() + timedelta(days=30)).isoformat(),
            "date_end": (datetime.now() + timedelta(days=30, hours=2)).isoformat(),
            "max_participants": 10,
            "image_url": None
        }
        r = requests.post(f"{BASE_URL}/events/", json=event_for_cancel, headers=headers_organizer)
        if r.status_code == 201:
            cancel_event_id = r.json()["id"]
            # Approuver l'événement
            requests.post(f"{BASE_URL}/events/{cancel_event_id}/approve", headers=headers_admin)

            # S'inscrire
            r = requests.post(f"{BASE_URL}/registrations/{cancel_event_id}", headers=headers_user)
            if r.status_code == 201:
                # DELETE /api/registrations/{event_id} - Annuler
                r = requests.delete(f"{BASE_URL}/registrations/{cancel_event_id}", headers=headers_user)
                self.test("DELETE /api/registrations/{event_id} (Annuler inscription)", r.status_code == 204, r)

    # ==================== ANALYTICS ====================
    def test_analytics(self):
        print_section("ANALYTICS")

        headers_user = {"Authorization": f"Bearer {self.user_token}"}
        headers_organizer = {"Authorization": f"Bearer {self.organizer_token}"}
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        # GET /api/analytics/global (Admin)
        r = requests.get(f"{BASE_URL}/analytics/global", headers=headers_admin)
        self.test("GET /api/analytics/global (Admin)", r.status_code == 200, r)
        if r.status_code == 200:
            data = r.json()
            print(f"  {YELLOW}→ Users: {data['total_users']}, Events: {data['total_events']}, Registrations: {data['total_registrations']}{RESET}")

        # GET /api/analytics/global (User - doit échouer)
        r = requests.get(f"{BASE_URL}/analytics/global", headers=headers_user)
        self.test("GET /api/analytics/global (User - doit échouer)", r.status_code == 403, r)

        # GET /api/analytics/global (Organizer - doit échouer)
        r = requests.get(f"{BASE_URL}/analytics/global", headers=headers_organizer)
        self.test("GET /api/analytics/global (Organizer - doit échouer)", r.status_code == 403, r)

        # GET /api/analytics/my-dashboard (Organizer)
        r = requests.get(f"{BASE_URL}/analytics/my-dashboard", headers=headers_organizer)
        self.test("GET /api/analytics/my-dashboard (Organizer)", r.status_code == 200, r)
        if r.status_code == 200:
            data = r.json()
            print(f"  {YELLOW}→ Mes events: {data['total_events']}, Inscriptions: {data['total_registrations']}{RESET}")

        # GET /api/analytics/my-dashboard (User - accessible to all authenticated users)
        r = requests.get(f"{BASE_URL}/analytics/my-dashboard", headers=headers_user)
        self.test("GET /api/analytics/my-dashboard (User)", r.status_code == 200, r)

        if self.event_id:
            # GET /api/analytics/event/{id} (Organizer - propriétaire)
            r = requests.get(f"{BASE_URL}/analytics/event/{self.event_id}", headers=headers_organizer)
            self.test("GET /api/analytics/event/{id} (Organizer)", r.status_code == 200, r)
            if r.status_code == 200:
                data = r.json()
                print(f"  {YELLOW}→ Inscriptions: {data['total_registrations']}, Check-in: {data['checked_in_count']}, Fill rate: {data['fill_rate']}%{RESET}")

            # GET /api/analytics/event/{id} (User - doit échouer)
            r = requests.get(f"{BASE_URL}/analytics/event/{self.event_id}", headers=headers_user)
            self.test("GET /api/analytics/event/{id} (User - doit échouer)", r.status_code == 403, r)

            # GET /api/analytics/event/{id} (Admin)
            r = requests.get(f"{BASE_URL}/analytics/event/{self.event_id}", headers=headers_admin)
            self.test("GET /api/analytics/event/{id} (Admin)", r.status_code == 200, r)

    # ==================== FAVORITES ====================
    def test_favorites(self):
        print_section("FAVORIS")

        headers_user = {"Authorization": f"Bearer {self.user_token}"}
        headers_organizer = {"Authorization": f"Bearer {self.organizer_token}"}
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        if not self.event_id:
            print(f"{YELLOW}⚠ Pas d'événement disponible pour les tests de favoris{RESET}")
            return

        # POST /api/favorites/{event_id} - Ajouter aux favoris (User)
        r = requests.post(f"{BASE_URL}/favorites/{self.event_id}", headers=headers_user)
        success = r.status_code == 201
        self.test("POST /api/favorites/{event_id} (Ajouter aux favoris)", success, r)

        # POST /api/favorites/{event_id} - Déjà en favoris
        r = requests.post(f"{BASE_URL}/favorites/{self.event_id}", headers=headers_user)
        self.test("POST /api/favorites/{event_id} (Déjà en favoris - doit échouer)", r.status_code == 400, r)

        # POST /api/favorites/{event_id} - Sans authentification (HTTPBearer → 403)
        r = requests.post(f"{BASE_URL}/favorites/{self.event_id}")
        self.test("POST /api/favorites/{event_id} (Sans token - doit échouer)", r.status_code == 403, r)

        # POST /api/favorites/{event_id} - Événement inexistant
        fake_event_id = "00000000-0000-0000-0000-000000000000"
        r = requests.post(f"{BASE_URL}/favorites/{fake_event_id}", headers=headers_user)
        self.test("POST /api/favorites/{event_id} (Événement inexistant - doit échouer)", r.status_code == 404, r)

        # GET /api/favorites/my-favorites - Voir mes favoris (User)
        r = requests.get(f"{BASE_URL}/favorites/my-favorites", headers=headers_user)
        success = r.status_code == 200
        self.test("GET /api/favorites/my-favorites (User)", success, r)
        if success:
            favorites = r.json()
            print(f"  {YELLOW}→ Nombre de favoris: {len(favorites)}{RESET}")
            if len(favorites) > 0:
                print(f"  {YELLOW}→ Premier favori: {favorites[0]['event']['title']}{RESET}")

        # GET /api/favorites/my-favorites - Sans authentification (HTTPBearer → 403)
        r = requests.get(f"{BASE_URL}/favorites/my-favorites")
        self.test("GET /api/favorites/my-favorites (Sans token - doit échouer)", r.status_code == 403, r)

        # GET /api/favorites/my-favorites - Avec skip et limit
        r = requests.get(f"{BASE_URL}/favorites/my-favorites", headers=headers_user, params={"skip": 0, "limit": 5})
        self.test("GET /api/favorites/my-favorites (Avec pagination)", r.status_code == 200, r)

        if self.event_id_2:
            # Ajouter un deuxième événement aux favoris (event_id_2 may be REJECTED but favorites allow any event)
            r = requests.post(f"{BASE_URL}/favorites/{self.event_id_2}", headers=headers_user)
            self.test("POST /api/favorites/{event_id} (Deuxième événement)", r.status_code == 201 or r.status_code == 400, r)

            # Vérifier que la liste contient maintenant 2 événements (ou 1 si déjà ajouté)
            r = requests.get(f"{BASE_URL}/favorites/my-favorites", headers=headers_user)
            if r.status_code == 200:
                favorites = r.json()
                print(f"  {YELLOW}→ Total de favoris: {len(favorites)}{RESET}")

        # GET /api/favorites/is-favorite/{event_id} - Vérifier si en favoris
        r = requests.get(f"{BASE_URL}/favorites/is-favorite/{self.event_id}", headers=headers_user)
        success = r.status_code == 200 and r.json().get("is_favorite") == True
        self.test("GET /api/favorites/is-favorite/{event_id} (Est en favoris)", success, r)

        # Créer un nouvel événement pour tester "pas en favoris"
        event_not_fav = {
            "title": "Event Not in Favorites",
            "description": "Test",
            "category": "test",
            "tags": ["test"],
            "location": "Test",
            "date_start": (datetime.now() + timedelta(days=100)).isoformat(),
            "date_end": (datetime.now() + timedelta(days=100, hours=2)).isoformat(),
            "max_participants": 10,
            "image_url": None
        }
        r = requests.post(f"{BASE_URL}/events/", json=event_not_fav, headers=headers_organizer)
        if r.status_code == 201:
            event_not_fav_id = r.json()["id"]
            # Vérifier qu'il n'est pas en favoris
            r = requests.get(f"{BASE_URL}/favorites/is-favorite/{event_not_fav_id}", headers=headers_user)
            success = r.status_code == 200 and r.json().get("is_favorite") == False
            self.test("GET /api/favorites/is-favorite/{event_id} (N'est pas en favoris)", success, r)

        # GET /api/favorites/is-favorite/{event_id} - Sans authentification (HTTPBearer → 403)
        r = requests.get(f"{BASE_URL}/favorites/is-favorite/{self.event_id}")
        self.test("GET /api/favorites/is-favorite/{event_id} (Sans token - doit échouer)", r.status_code == 403, r)

        # DELETE /api/favorites/{event_id} - Retirer des favoris
        r = requests.delete(f"{BASE_URL}/favorites/{self.event_id}", headers=headers_user)
        self.test("DELETE /api/favorites/{event_id} (Retirer des favoris)", r.status_code == 204, r)

        # DELETE /api/favorites/{event_id} - Pas en favoris
        r = requests.delete(f"{BASE_URL}/favorites/{self.event_id}", headers=headers_user)
        self.test("DELETE /api/favorites/{event_id} (Pas en favoris - doit échouer)", r.status_code == 404, r)

        # DELETE /api/favorites/{event_id} - Sans authentification (HTTPBearer → 403)
        r = requests.delete(f"{BASE_URL}/favorites/{self.event_id}")
        self.test("DELETE /api/favorites/{event_id} (Sans token - doit échouer)", r.status_code == 403, r)

        # Vérifier que le favori a bien été supprimé
        r = requests.get(f"{BASE_URL}/favorites/is-favorite/{self.event_id}", headers=headers_user)
        success = r.status_code == 200 and r.json().get("is_favorite") == False
        self.test("GET /api/favorites/is-favorite/{event_id} (Après suppression)", success, r)

        # Vérifier la liste des favoris après suppression
        r = requests.get(f"{BASE_URL}/favorites/my-favorites", headers=headers_user)
        if r.status_code == 200:
            favorites = r.json()
            print(f"  {YELLOW}→ Favoris restants: {len(favorites)}{RESET}")

    # ==================== IMAGE UPLOADS ====================
    def test_image_uploads(self):
        print_section("UPLOAD D'IMAGES")

        headers_user = {"Authorization": f"Bearer {self.user_token}"}
        headers_organizer = {"Authorization": f"Bearer {self.organizer_token}"}
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        # Paths to test assets — always resolved relative to this script file,
        # so the tests work regardless of the current working directory.
        profile_jpg  = TEST_DIR / "test_profile.jpg"
        event_jpg    = TEST_DIR / "test_event.jpg"
        invalid_txt  = TEST_DIR / "test_invalid.txt"
        large_jpg    = TEST_DIR / "test_large.jpg"

        # ========== IMAGES DE PROFIL ==========

        profile_uploaded = False  # track whether upload succeeded

        # POST /api/auth/me/profile-image - Upload image de profil (User)
        if profile_jpg.exists():
            with open(profile_jpg, 'rb') as f:
                files = {'file': ('test_profile.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/auth/me/profile-image", files=files, headers=headers_user)
            success = r.status_code == 200
            self.test("POST /api/auth/me/profile-image (Upload valide)", success, r)
            if success:
                profile_uploaded = True
                if r.json().get('profile_image'):
                    print(f"  {YELLOW}→ Image sauvegardée: {r.json()['profile_image']}{RESET}")
        else:
            print(f"{YELLOW}⚠ Fichier test_profile.jpg non trouvé{RESET}")

        # POST /api/auth/me/profile-image - Remplacer l'image (User)
        if profile_jpg.exists():
            with open(profile_jpg, 'rb') as f:
                files = {'file': ('test_profile_new.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/auth/me/profile-image", files=files, headers=headers_user)
            success = r.status_code == 200
            self.test("POST /api/auth/me/profile-image (Remplacement)", success, r)
            if success:
                profile_uploaded = True

        # POST /api/auth/me/profile-image - Format invalide (.txt not in ALLOWED_EXTENSIONS)
        if invalid_txt.exists():
            with open(invalid_txt, 'rb') as f:
                files = {'file': ('test.txt', f, 'text/plain')}
                r = requests.post(f"{BASE_URL}/auth/me/profile-image", files=files, headers=headers_user)
            self.test("POST /api/auth/me/profile-image (Format invalide - doit échouer)", r.status_code == 400, r)
        else:
            print(f"{YELLOW}⚠ Fichier test_invalid.txt non trouvé{RESET}")

        # POST /api/auth/me/profile-image - Fichier trop volumineux (> 5 MB)
        if large_jpg.exists():
            with open(large_jpg, 'rb') as f:
                files = {'file': ('test_large.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/auth/me/profile-image", files=files, headers=headers_user)
            self.test("POST /api/auth/me/profile-image (Trop volumineux - doit échouer)", r.status_code == 400, r)
        else:
            print(f"{YELLOW}⚠ Fichier test_large.jpg non trouvé{RESET}")

        # POST /api/auth/me/profile-image - Sans authentification (HTTPBearer → 403)
        if profile_jpg.exists():
            with open(profile_jpg, 'rb') as f:
                files = {'file': ('test_profile.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/auth/me/profile-image", files=files)
            self.test("POST /api/auth/me/profile-image (Sans token - doit échouer)", r.status_code == 403, r)

        # GET /api/auth/me - Vérifier que profile_image est présent (only if upload succeeded)
        if profile_uploaded:
            r = requests.get(f"{BASE_URL}/auth/me", headers=headers_user)
            if r.status_code == 200:
                has_profile_image = r.json().get('profile_image') is not None
                self.test("GET /api/auth/me (Avec profile_image)", has_profile_image, r)
                if has_profile_image:
                    print(f"  {YELLOW}→ Profile image: {r.json()['profile_image']}{RESET}")

            # DELETE /api/auth/me/profile-image - Supprimer l'image
            r = requests.delete(f"{BASE_URL}/auth/me/profile-image", headers=headers_user)
            self.test("DELETE /api/auth/me/profile-image", r.status_code == 200, r)

            # DELETE /api/auth/me/profile-image - Supprimer alors qu'il n'y a pas d'image
            r = requests.delete(f"{BASE_URL}/auth/me/profile-image", headers=headers_user)
            self.test("DELETE /api/auth/me/profile-image (Pas d'image - doit échouer)", r.status_code == 400, r)
        else:
            print(f"{YELLOW}⚠ Skipping profile_image GET/DELETE tests (no upload succeeded){RESET}")

        # ========== IMAGES D'ÉVÉNEMENTS ==========

        if not self.event_id:
            print(f"{YELLOW}⚠ Pas d'événement disponible pour les tests d'upload{RESET}")
            return

        event_img_uploaded = False  # track whether event image upload succeeded

        # POST /api/events/{id}/image - Upload image d'événement (Organizer - propriétaire)
        if event_jpg.exists():
            with open(event_jpg, 'rb') as f:
                files = {'file': ('test_event.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/events/{self.event_id}/image", files=files, headers=headers_organizer)
            success = r.status_code == 200
            self.test("POST /api/events/{id}/image (Upload valide - Organizer)", success, r)
            if success:
                event_img_uploaded = True
                if r.json().get('image_url'):
                    print(f"  {YELLOW}→ Image sauvegardée: {r.json()['image_url']}{RESET}")
        else:
            print(f"{YELLOW}⚠ Fichier test_event.jpg non trouvé{RESET}")

        # POST /api/events/{id}/image - Remplacer l'image
        if event_jpg.exists():
            with open(event_jpg, 'rb') as f:
                files = {'file': ('test_event_new.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/events/{self.event_id}/image", files=files, headers=headers_organizer)
            success = r.status_code == 200
            self.test("POST /api/events/{id}/image (Remplacement)", success, r)
            if success:
                event_img_uploaded = True

        # POST /api/events/{id}/image - Par un user non propriétaire (doit échouer)
        if event_jpg.exists():
            with open(event_jpg, 'rb') as f:
                files = {'file': ('test_event.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/events/{self.event_id}/image", files=files, headers=headers_user)
            self.test("POST /api/events/{id}/image (Non propriétaire - doit échouer)", r.status_code == 403, r)

        # POST /api/events/{id}/image - Par admin
        if event_jpg.exists():
            with open(event_jpg, 'rb') as f:
                files = {'file': ('test_event.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/events/{self.event_id}/image", files=files, headers=headers_admin)
            success = r.status_code == 200
            self.test("POST /api/events/{id}/image (Admin)", success, r)
            if success:
                event_img_uploaded = True

        # POST /api/events/{id}/image - Format invalide
        if invalid_txt.exists():
            with open(invalid_txt, 'rb') as f:
                files = {'file': ('test.txt', f, 'text/plain')}
                r = requests.post(f"{BASE_URL}/events/{self.event_id}/image", files=files, headers=headers_organizer)
            self.test("POST /api/events/{id}/image (Format invalide - doit échouer)", r.status_code == 400, r)

        # POST /api/events/{id}/image - Fichier trop volumineux
        if large_jpg.exists():
            with open(large_jpg, 'rb') as f:
                files = {'file': ('test_large.jpg', f, 'image/jpeg')}
                r = requests.post(f"{BASE_URL}/events/{self.event_id}/image", files=files, headers=headers_organizer)
            self.test("POST /api/events/{id}/image (Trop volumineux - doit échouer)", r.status_code == 400, r)

        # POST /api/events/{id}/image - Événement inexistant
        if event_jpg.exists():
            with open(event_jpg, 'rb') as f:
                files = {'file': ('test_event.jpg', f, 'image/jpeg')}
                fake_event_id = "00000000-0000-0000-0000-000000000000"
                r = requests.post(f"{BASE_URL}/events/{fake_event_id}/image", files=files, headers=headers_organizer)
            self.test("POST /api/events/{id}/image (Événement inexistant - doit échouer)", r.status_code == 404, r)

        # GET /api/events/{id} - Vérifier que image_url est présent (only if upload succeeded)
        if event_img_uploaded:
            r = requests.get(f"{BASE_URL}/events/{self.event_id}")
            if r.status_code == 200:
                has_image_url = r.json().get('image_url') is not None
                self.test("GET /api/events/{id} (Avec image_url)", has_image_url, r)
                if has_image_url:
                    print(f"  {YELLOW}→ Image URL: {r.json()['image_url']}{RESET}")

            # DELETE /api/events/{id}/image - Supprimer l'image
            r = requests.delete(f"{BASE_URL}/events/{self.event_id}/image", headers=headers_organizer)
            self.test("DELETE /api/events/{id}/image", r.status_code == 200, r)

            # DELETE /api/events/{id}/image - Supprimer alors qu'il n'y a pas d'image
            r = requests.delete(f"{BASE_URL}/events/{self.event_id}/image", headers=headers_organizer)
            self.test("DELETE /api/events/{id}/image (Pas d'image - doit échouer)", r.status_code == 400, r)

            # DELETE /api/events/{id}/image - Par un user non propriétaire (doit échouer)
            # D'abord remettre une image
            if event_jpg.exists():
                with open(event_jpg, 'rb') as f:
                    files = {'file': ('test_event.jpg', f, 'image/jpeg')}
                    requests.post(f"{BASE_URL}/events/{self.event_id}/image", files=files, headers=headers_organizer)
            r = requests.delete(f"{BASE_URL}/events/{self.event_id}/image", headers=headers_user)
            self.test("DELETE /api/events/{id}/image (Non propriétaire - doit échouer)", r.status_code == 403, r)
        else:
            print(f"{YELLOW}⚠ Skipping event image GET/DELETE tests (no upload succeeded){RESET}")

    # ==================== TESTS DE SUPPRESSION ====================
    def test_delete(self):
        print_section("SUPPRESSION")

        headers_user = {"Authorization": f"Bearer {self.user_token}"}
        headers_organizer = {"Authorization": f"Bearer {self.organizer_token}"}
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}

        # Créer un événement sans inscriptions pour le supprimer
        event_data = {
            "title": "Event to Delete",
            "description": "Cet événement sera supprimé",
            "category": "test",
            "tags": ["delete", "test"],
            "location": "Test Location",
            "date_start": (datetime.now() + timedelta(days=60)).isoformat(),
            "date_end": (datetime.now() + timedelta(days=60, hours=2)).isoformat(),
            "max_participants": 10,
            "image_url": None
        }
        r = requests.post(f"{BASE_URL}/events/", json=event_data, headers=headers_organizer)
        if r.status_code == 201:
            event_to_delete = r.json()["id"]

            # DELETE /api/events/{id} (User - doit échouer)
            r = requests.delete(f"{BASE_URL}/events/{event_to_delete}", headers=headers_user)
            self.test("DELETE /api/events/{id} (User - doit échouer)", r.status_code == 403, r)

            # DELETE /api/events/{id} (Organizer - propriétaire)
            r = requests.delete(f"{BASE_URL}/events/{event_to_delete}", headers=headers_organizer)
            self.test("DELETE /api/events/{id} (Organizer - propriétaire)", r.status_code == 204, r)

        # Créer un événement avec inscription pour tester l'échec de suppression
        event_data2 = {
            "title": "Event with Registration",
            "description": "Cet événement a des inscrits",
            "category": "test",
            "tags": ["nodelete"],
            "location": "Test",
            "date_start": (datetime.now() + timedelta(days=90)).isoformat(),
            "date_end": (datetime.now() + timedelta(days=90, hours=2)).isoformat(),
            "max_participants": 10,
            "image_url": None
        }
        r = requests.post(f"{BASE_URL}/events/", json=event_data2, headers=headers_admin)
        if r.status_code == 201:
            event_with_reg = r.json()["id"]
            # Approuver
            requests.post(f"{BASE_URL}/events/{event_with_reg}/approve", headers=headers_admin)
            # S'inscrire
            requests.post(f"{BASE_URL}/registrations/{event_with_reg}", headers=headers_user)

            # DELETE /api/events/{id} (Avec inscrits - doit échouer)
            r = requests.delete(f"{BASE_URL}/events/{event_with_reg}", headers=headers_admin)
            self.test("DELETE /api/events/{id} (Avec inscrits - doit échouer)", r.status_code == 400, r)

    # ==================== RÉSUMÉ ====================
    def print_summary(self):
        print_section("RÉSUMÉ DES TESTS")
        total = self.results["passed"] + self.results["failed"]
        percent = (self.results["passed"] / total * 100) if total > 0 else 0
        print(f"Total: {total} tests")
        print(f"{GREEN}Réussis: {self.results['passed']} ({percent:.1f}%){RESET}")
        print(f"{RED}Échoués: {self.results['failed']}{RESET}")

        if self.results["failed"] == 0:
            print(f"\n{GREEN}{'='*60}{RESET}")
            print(f"{GREEN}   ✓ TOUS LES TESTS SONT PASSÉS !{RESET}")
            print(f"{GREEN}{'='*60}{RESET}")
        else:
            print(f"\n{YELLOW}⚠ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.{RESET}")


def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}   TEST COMPLET DE L'API EVENT MANAGEMENT{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"URL de base: {BASE_URL}")
    print(f"Base de données: {DATABASE_URL}")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    tester = APITester()

    try:
        # Vérifier que le serveur est accessible
        r = requests.get(f"{BASE_URL.replace('/api', '')}/health", timeout=5)
        if r.status_code != 200:
            print(f"{RED}✗ Le serveur n'est pas accessible{RESET}")
            return
    except requests.exceptions.ConnectionError:
        print(f"{RED}✗ Impossible de se connecter au serveur{RESET}")
        print(f"{YELLOW}  Assurez-vous que le serveur est lancé:{RESET}")
        print(f"{YELLOW}  uvicorn app.main:app --reload{RESET}")
        return

    # Exécuter tous les tests
    tester.test_health()
    tester.test_auth()
    tester.update_roles()
    tester.test_events()
    tester.test_registrations()
    tester.test_analytics()
    tester.test_favorites()
    tester.test_image_uploads()
    tester.test_delete()

    # Afficher le résumé
    tester.print_summary()


if __name__ == "__main__":
    main()
