-- Ressources du jeu
INSERT INTO ressource (nom, description) VALUES
('Argent', 'Monnaie principale, utilisée pour tous les achats'),
('Fans', 'Popularité du club, débloque des paliers de prestige'),
('Prestige', 'Ressource rare, obtenue en montant de niveau');

-- Infrastructures (coût_base croissant, production_base en Argent/sec)
INSERT INTO infrastructure (nom, cout_base, production_base, description) VALUES
('Terrain d''entraînement', 15, 0.1, 'Un terrain basique pour les premières séances'),
('Stade municipal', 100, 0.5, 'Un petit stade qui attire les premiers spectateurs'),
('Boutique du club', 500, 3, 'Vente de maillots et goodies'),
('Centre de formation', 2000, 12, 'Forme les jeunes talents du club'),
('Infirmerie', 8000, 45, 'Soigne les joueurs et réduit les blessures'),
('Salle de musculation', 25000, 150, 'Améliore la condition physique'),
('Centre média', 100000, 600, 'Augmente la visibilité médiatique'),
('Espace VIP', 500000, 2500, 'Attire des sponsors prestigieux');

-- Améliorations (une seule fois, coût fixe)
INSERT INTO amelioration (nom, cout, effet, type_cible) VALUES
('Marketing local', 50, 'multiplicateur_production:1.5', 'global'),
('Staff médical', 300, 'multiplicateur_production:2.0', 'global'),
('Partenariat équipementier', 1500, 'multiplicateur_clic:2.0', 'clic'),
('Stage intensif', 5000, 'multiplicateur_production:3.0', 'global'),
('Académie espoirs', 15000, 'multiplicateur_production:4.0', 'global'),
('Contrat TV', 50000, 'multiplicateur_production:5.0', 'global'),
('Légende du club', 200000, 'multiplicateur_clic:5.0', 'clic'),
('Stade connecté', 500000, 'multiplicateur_production:8.0', 'global'),
('Centre de recherche', 1000000, 'multiplicateur_production:12.0', 'global'),
('Hall of Fame', 5000000, 'multiplicateur_global:3.0', 'global');
