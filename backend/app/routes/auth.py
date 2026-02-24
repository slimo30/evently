from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserResponse, Token, UserUpdate, UserAdminCreate
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin
from app.utils import save_profile_image, delete_image

router = APIRouter(prefix="/api/auth", tags=["Authentification"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Créer un nouveau compte utilisateur"""
    # Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Validation du mot de passe
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")
    
    # Créer l'utilisateur
    user = User(
        email=user_data.email,
        password=get_password_hash(user_data.password),
        name=user_data.name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Se connecter et obtenir un token JWT"""
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Obtenir le profil de l'utilisateur connecté"""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le profil de l'utilisateur connecté"""
    # Vérifier si l'email est déjà utilisé par un autre utilisateur
    if user_data.email and user_data.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Mettre à jour les champs
    if user_data.name is not None:
        current_user.name = user_data.name
    if user_data.email is not None:
        current_user.email = user_data.email
    if user_data.password is not None:
        if len(user_data.password) < 6:
            raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")
        current_user.password = get_password_hash(user_data.password)
    if user_data.preferences is not None:
        current_user.preferences = user_data.preferences
    
    db.commit()
    db.refresh(current_user)
    return current_user


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


@router.delete("/me/profile-image", status_code=status.HTTP_200_OK)
def delete_profile_image(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer l'image de profil"""
    if not current_user.profile_image:
        raise HTTPException(status_code=400, detail="Aucune image de profil à supprimer")
    
    delete_image(current_user.profile_image)
    current_user.profile_image = None
    db.commit()
    
    return {"message": "Image de profil supprimée avec succès"}


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_data: UserAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Créer un nouvel utilisateur avec un rôle spécifique - Admin uniquement"""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user = User(
        email=user_data.email,
        password=get_password_hash(user_data.password),
        name=user_data.name,
        role=user_data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
