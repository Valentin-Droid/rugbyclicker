-- Suppression des tables si elles existent (pour dev)
DROP TABLE IF EXISTS achat_amelioration CASCADE;
DROP TABLE IF EXISTS possession_infrastructure CASCADE;
DROP TABLE IF EXISTS stock_ressource CASCADE;
DROP TABLE IF EXISTS amelioration CASCADE;
DROP TABLE IF EXISTS infrastructure CASCADE;
DROP TABLE IF EXISTS ressource CASCADE;
DROP TABLE IF EXISTS partie CASCADE;
DROP TABLE IF EXISTS joueur CASCADE;

-- Table joueur
CREATE TABLE joueur (
    id_joueur SERIAL PRIMARY KEY,
    pseudo VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table partie
CREATE TABLE partie (
    id_partie SERIAL PRIMARY KEY,
    nom_club VARCHAR(100) NOT NULL,
    niveau INT NOT NULL DEFAULT 1,
    dernier_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_argent_genere NUMERIC(14,2) DEFAULT 0,
    id_joueur INT NOT NULL,
    CONSTRAINT fk_partie_joueur
        FOREIGN KEY (id_joueur) REFERENCES joueur(id_joueur)
        ON DELETE CASCADE
);

-- Table ressource
CREATE TABLE ressource (
    id_ressource SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Table stock_ressource
CREATE TABLE stock_ressource (
    id_partie INT NOT NULL,
    id_ressource INT NOT NULL,
    quantite NUMERIC(14,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_partie, id_ressource),
    CONSTRAINT fk_stock_partie
        FOREIGN KEY (id_partie) REFERENCES partie(id_partie)
        ON DELETE CASCADE,
    CONSTRAINT fk_stock_ressource
        FOREIGN KEY (id_ressource) REFERENCES ressource(id_ressource)
        ON DELETE CASCADE,
    CONSTRAINT chk_stock_positif CHECK (quantite >= 0)
);

-- Table infrastructure
CREATE TABLE infrastructure (
    id_infrastructure SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    cout_base NUMERIC(12,2) NOT NULL,
    production_base NUMERIC(12,2) NOT NULL,
    description TEXT
);

-- Table possession_infrastructure
CREATE TABLE possession_infrastructure (
    id_partie INT NOT NULL,
    id_infrastructure INT NOT NULL,
    quantite INT NOT NULL DEFAULT 0,
    niveau INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_partie, id_infrastructure),
    CONSTRAINT fk_possession_partie
        FOREIGN KEY (id_partie) REFERENCES partie(id_partie)
        ON DELETE CASCADE,
    CONSTRAINT fk_possession_infrastructure
        FOREIGN KEY (id_infrastructure) REFERENCES infrastructure(id_infrastructure)
        ON DELETE CASCADE,
    CONSTRAINT chk_possession_quantite CHECK (quantite >= 0),
    CONSTRAINT chk_possession_niveau CHECK (niveau >= 1)
);

-- Table amelioration
CREATE TABLE amelioration (
    id_amelioration SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    cout NUMERIC(12,2) NOT NULL,
    effet TEXT NOT NULL,
    type_cible VARCHAR(50) NOT NULL
);

-- Table achat_amelioration
CREATE TABLE achat_amelioration (
    id_partie INT NOT NULL,
    id_amelioration INT NOT NULL,
    date_achat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_partie, id_amelioration),
    CONSTRAINT fk_achat_partie
        FOREIGN KEY (id_partie) REFERENCES partie(id_partie)
        ON DELETE CASCADE,
    CONSTRAINT fk_achat_amelioration
        FOREIGN KEY (id_amelioration) REFERENCES amelioration(id_amelioration)
        ON DELETE CASCADE
);

-- Ajout colonne pour le calcul des niveaux (si la table existe déjà)
ALTER TABLE partie ADD COLUMN IF NOT EXISTS total_argent_genere NUMERIC(14,2) DEFAULT 0;

-- Index pour les performances
CREATE INDEX idx_partie_joueur ON partie(id_joueur);
CREATE INDEX idx_stock_partie ON stock_ressource(id_partie);
CREATE INDEX idx_possession_partie ON possession_infrastructure(id_partie);
CREATE INDEX idx_achat_partie ON achat_amelioration(id_partie);
