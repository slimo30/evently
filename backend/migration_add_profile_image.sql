-- Migration: Ajouter le champ profile_image à la table users
-- Date: 2026-02-23

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR;

-- Note: Ce champ stocke le chemin relatif de l'image de profil
-- Exemple: "uploads/profiles/user_id_abc123.jpg"
