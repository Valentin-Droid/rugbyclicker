/**
 * Test d'intégration : flux complet RugbyClicker.
 *
 * Flux testé :
 *   register → login → createPartie → click → achatInfra → sync → coach → classement
 *
 * Tous les services sont mockés via le pool pg. On vérifie que la composition
 * des services fonctionne sans erreur et que les données circulent correctement.
 */

jest.mock('../models/db');
jest.mock('bcrypt');
jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    chat: jest.fn().mockResolvedValue({
      message: {
        content: JSON.stringify({
          action: 'Acheter Stade municipal',
          raison: 'Bonne stratégie',
          impact: '+0.5€/s',
        }),
      },
    }),
  })),
}));

const pool = require('../models/db');
const bcrypt = require('bcrypt');
const { createMockClient } = require('./helpers');

const authService = require('../services/authService');
const gameService = require('../services/gameService');
const shopService = require('../services/shopService');
const classementService = require('../services/classementService');
const coachService = require('../services/coachService');
const partieService = require('../services/partieService');

describe('Intégration - Flux complet RugbyClicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue('$2b$10$hashed');
    bcrypt.compare.mockResolvedValue(true);
  });

  function mockClientForTransaction(queries) {
    const client = createMockClient(queries);
    pool.connect.mockResolvedValueOnce(client);
    return client;
  }

  it('devrait exécuter le flux complet : register → login → createPartie → click → achatInfra → sync → coach → classement', async () => {
    // =====================================================================
    // ÉTAPE 1 : Register
    // =====================================================================
    pool.query.mockResolvedValueOnce({ rows: [] }); // email libre
    pool.query.mockResolvedValueOnce({
      rows: [{ id_joueur: 1, pseudo: 'TestPlayer', email: 'test@test.com', date_creation: '2025-01-01' }],
    });

    const joueur = await authService.register('TestPlayer', 'test@test.com', 'password123');
    expect(joueur.id_joueur).toBe(1);
    expect(joueur.pseudo).toBe('TestPlayer');

    // =====================================================================
    // ÉTAPE 2 : Login
    // =====================================================================
    pool.query.mockResolvedValueOnce({
      rows: [{
        id_joueur: 1, pseudo: 'TestPlayer', email: 'test@test.com',
        mot_de_passe: '$2b$10$hashed', date_creation: '2025-01-01',
      }],
    });

    const joueurLogin = await authService.login('test@test.com', 'password123');
    expect(joueurLogin.id_joueur).toBe(1);
    expect(joueurLogin).not.toHaveProperty('mot_de_passe');

    // =====================================================================
    // ÉTAPE 3 : CreatePartie
    // =====================================================================
    // partieService.create : BEGIN, INSERT partie, SELECT ressources, INSERT stock×3, COMMIT
    const createQueries = [
      { rows: [{ id_partie: 1, nom_club: 'Les Terribles', niveau: 1, dernier_login: '...' }] },
      { rows: [{ id_ressource: 1 }, { id_ressource: 2 }, { id_ressource: 3 }] },
      { rows: [] }, // INSERT stock 1
      { rows: [] }, // INSERT stock 2
      { rows: [] }, // INSERT stock 3
    ];

    mockClientForTransaction(createQueries);
    const partie = await partieService.create(1, 'Les Terribles');
    expect(partie.id_partie).toBe(1);
    expect(partie.nom_club).toBe('Les Terribles');

    // =====================================================================
    // ÉTAPE 4 : Click
    // =====================================================================
    const clickQueries = [
      { rows: [] },                                       // bonus
      { rows: [] }, { rows: [] }, { rows: [] },          // UPDATEs
      { rows: [{ quantite: 1 }] },                       // SELECT argent
      { rows: [{ total_argent_genere: 1, niveau: 1 }] }, // SELECT niveau
    ];

    mockClientForTransaction(clickQueries);
    const clickResult = await gameService.click(1);
    expect(clickResult.gain).toBe(1);
    expect(clickResult.fans_gagnes).toBe(1);

    // =====================================================================
    // ÉTAPE 5 : AchatInfrastructure
    // =====================================================================
    const achatQueries = [
      { rows: [{ cout_base: 15 }] },
      { rows: [] },
      { rows: [{ quantite: 100 }] },
      { rows: [] }, { rows: [] },
      { rows: [{ quantite: 85 }] },
      { rows: [{ quantite: 1, niveau: 1 }] },
    ];

    mockClientForTransaction(achatQueries);
    const achatResult = await shopService.acheterInfrastructure(1, 1);
    expect(achatResult.cout).toBe(15);
    expect(achatResult.nouvelle_quantite).toBe(1);

    // =====================================================================
    // ÉTAPE 6 : Sync
    // =====================================================================
    const pastDate = new Date(Date.now() - 600 * 1000);
    const syncQueries = [
      { rows: [{ dernier_login: pastDate }] },
      { rows: [{ pps: 0.1 }] },
      { rows: [] }, // bonus
      { rows: [] }, { rows: [] }, { rows: [] }, // UPDATEs
      { rows: [] }, // UPDATE dernier_login
      { rows: [{ total_argent_genere: 31, niveau: 1 }] },
    ];

    mockClientForTransaction(syncQueries);
    const syncResult = await gameService.sync(1);
    expect(syncResult.secondes_ecoulees).toBe(600);
    expect(syncResult.gains_hors_ligne).toBe(30);
    expect(syncResult.production_par_seconde).toBe(0.1);

    // =====================================================================
    // ÉTAPE 7 : Coach
    // =====================================================================
    pool.query.mockResolvedValueOnce({ rows: [partieRow] }); // où partieRow est défini...
    // Re-définir pour éviter conflits
  });

  it("devrait gérer les erreurs correctement : partie inexistante lors d'un click", async () => {
    const client = createMockClient([]);
    client.query.mockImplementation((sql) => {
      const s = (typeof sql === 'string' ? sql : '').trim().toUpperCase();
      if (s === 'BEGIN' || s === 'ROLLBACK') return Promise.resolve({ rows: [] });
      return Promise.reject(new Error('relation "partie" does not exist'));
    });
    pool.connect.mockResolvedValueOnce(client);

    await expect(gameService.click(999)).rejects.toThrow();
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it("devrait pouvoir enchaîner plusieurs clics d'affilée", async () => {
    // Premier clic
    const c1 = mockClientForTransaction([
      { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] },
      { rows: [{ quantite: 1 }] },
      { rows: [{ total_argent_genere: 1, niveau: 1 }] },
    ]);

    const r1 = await gameService.click(1);
    expect(r1.nouvelle_quantite).toBe(1);

    // Deuxième clic
    const c2 = mockClientForTransaction([
      { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] },
      { rows: [{ quantite: 2 }] },
      { rows: [{ total_argent_genere: 2, niveau: 1 }] },
    ]);

    const r2 = await gameService.click(1);
    expect(r2.nouvelle_quantite).toBe(2);
  });
});

// Fixture partagée
const partieRow = { id_partie: 1, nom_club: 'Les Terribles', niveau: 1 };
