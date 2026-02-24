-- Migration: Ajouter la table des favoris
-- Date: 2026-02-24
-- Description: Permet aux utilisateurs de marquer des événements comme favoris

-- Créer la table favorites
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    event_id VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    
    -- Index pour améliorer les performances
    CONSTRAINT unique_user_event_favorite UNIQUE (user_id, event_id)
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON favorites(event_id);

-- Commentaires
COMMENT ON TABLE favorites IS 'Table des événements favoris des utilisateurs';
COMMENT ON COLUMN favorites.id IS 'Identifiant unique du favori';
COMMENT ON COLUMN favorites.user_id IS 'Référence à l''utilisateur';
COMMENT ON COLUMN favorites.event_id IS 'Référence à l''événement';
COMMENT ON COLUMN favorites.created_at IS 'Date d''ajout aux favoris';
