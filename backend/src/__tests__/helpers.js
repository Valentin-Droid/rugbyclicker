/**
 * Helpers partagés pour les tests unitaires RugbyClicker.
 *
 * Fournit une factory de mock pour le pool pg et un mock pour le client connect(),
 * ainsi que des factories de données pour les fixtures courantes.
 */

/**
 * Crée un mock de client PostgreSQL (celui retourné par pool.connect()).
 * Chaque appel à query() retourne la valeur spécifiée dans `queryResults`.
 *
 * @param {object[]} queryResults - tableau de valeurs de retour pour query(),
 *   dans l'ordre des appels. Chaque élément = { rows: [...] }.
 * @returns {object} mock client avec query(), release(), et query() BEGIN/COMMIT support.
 */
function createMockClient(queryResults = []) {
  let callIndex = 0;

  const client = {
    query: jest.fn((_sql, _params) => {
      // Les BEGIN / COMMIT / ROLLBACK ne retournent rien de spécial
      // mais on veut pouvoir les intercepter si nécessaire
      const sql = typeof _sql === 'string' ? _sql.trim().toUpperCase() : '';
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      const result = queryResults[callIndex] || { rows: [] };
      callIndex++;
      return Promise.resolve(result);
    }),
    release: jest.fn(),
    _callIndex: () => callIndex,
  };

  return client;
}

/**
 * Crée un mock de pool pg.
 *
 * @param {object[]} poolQueryResults - valeurs retournées par pool.query() direct
 * @param {object[]} clientQueryResults - valeurs retournées par le client (connect)
 * @returns {object} mock pool avec query(), connect().
 */
function createMockPool(poolQueryResults = [], clientQueryResults = []) {
  let poolCallIndex = 0;
  const mockClient = createMockClient(clientQueryResults);

  const pool = {
    query: jest.fn((_sql, _params) => {
      const result = poolQueryResults[poolCallIndex] || { rows: [] };
      poolCallIndex++;
      return Promise.resolve(result);
    }),
    connect: jest.fn(() => Promise.resolve(mockClient)),
    runMigrations: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    _mockClient: mockClient,
    _poolCallIndex: () => poolCallIndex,
  };

  return pool;
}

// ---------------------------------------------------------------------------
// Fixtures de données
// ---------------------------------------------------------------------------

const FIXTURES = {
  joueur: {
    id_joueur: 1,
    pseudo: 'RugbyFan42',
    email: 'rugbyfan@example.com',
    mot_de_passe: '$2b$10$hashedpasswordhere...',
    date_creation: '2025-01-01T00:00:00.000Z',
  },

  joueurSansMdp: {
    id_joueur: 1,
    pseudo: 'RugbyFan42',
    email: 'rugbyfan@example.com',
    date_creation: '2025-01-01T00:00:00.000Z',
  },

  partie: {
    id_partie: 1,
    nom_club: 'Les Terribles',
    niveau: 1,
    dernier_login: '2025-06-01T12:00:00.000Z',
    total_argent_genere: 500,
    id_joueur: 1,
  },

  stockArgent: {
    id_partie: 1,
    id_ressource: 1,
    quantite: 1000,
  },

  stockFans: {
    id_partie: 1,
    id_ressource: 2,
    quantite: 50,
  },

  stockPrestige: {
    id_partie: 1,
    id_ressource: 3,
    quantite: 0,
  },

  infrastructure: {
    id_infrastructure: 1,
    nom: "Terrain d'entraînement",
    cout_base: 15,
    production_base: 0.1,
    description: 'Un terrain basique',
  },

  possession: {
    id_partie: 1,
    id_infrastructure: 1,
    quantite: 2,
    niveau: 1,
  },

  amelioration: {
    id_amelioration: 1,
    nom: 'Marketing local',
    cout: 50,
    effet: 'multiplicateur_production:1.5',
    type_cible: 'global',
  },

  ressources: [
    { id_ressource: 1, nom: 'Argent', description: 'Monnaie principale', quantite: 1000 },
    { id_ressource: 2, nom: 'Fans', description: 'Popularité', quantite: 50 },
    { id_ressource: 3, nom: 'Prestige', description: 'Ressource rare', quantite: 0 },
  ],

  infrastructures: [
    { id_infrastructure: 1, nom: "Terrain d'entraînement", cout_base: 15, production_base: 0.1, description: '...', quantite: 2, niveau: 1 },
    { id_infrastructure: 2, nom: 'Stade municipal', cout_base: 100, production_base: 0.5, description: '...', quantite: 0, niveau: 1 },
  ],

  ameliorations: [
    { id_amelioration: 1, nom: 'Marketing local', cout: 50, effet: 'multiplicateur_production:1.5', type_cible: 'global', achete: false, date_achat: null },
  ],
};

module.exports = { createMockPool, createMockClient, FIXTURES };
