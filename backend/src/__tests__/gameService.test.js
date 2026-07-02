/**
 * Tests unitaires pour gameService.js
 *
 * Couvre : click, sync, getProductionPerSecond, getCoutAchat, getCoutUpgrade,
 * calculerNiveau, argentPourProchainNiveau.
 */

jest.mock('../models/db');
const pool = require('../models/db');
const { createMockClient } = require('./helpers');
const gameService = require('../services/gameService');

describe('gameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getCoutAchat
  // -----------------------------------------------------------------------
  describe('getCoutAchat', () => {
    it("devrait calculer le coût d'achat pour 0 possession (coutBase × 1.15^0 = coutBase)", () => {
      expect(gameService.getCoutAchat(15, 0)).toBe(15);
    });

    it("devrait augmenter le coût exponentiellement avec la quantité possédée", () => {
      const cout = gameService.getCoutAchat(15, 5);
      expect(cout).toBe(Math.floor(15 * Math.pow(1.15, 5)));
    });

    it("devrait retourner un entier (floor)", () => {
      expect(Number.isInteger(gameService.getCoutAchat(100000, 3))).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getCoutUpgrade
  // -----------------------------------------------------------------------
  describe('getCoutUpgrade', () => {
    it("devrait calculer le coût d'upgrade pour le niveau 1", () => {
      expect(gameService.getCoutUpgrade(15, 1)).toBe(Math.floor(15 * 5 * 1.5));
    });

    it("devrait augmenter avec le niveau", () => {
      expect(gameService.getCoutUpgrade(15, 5)).toBeGreaterThan(gameService.getCoutUpgrade(15, 1));
    });
  });

  // -----------------------------------------------------------------------
  // calculerNiveau
  // -----------------------------------------------------------------------
  describe('calculerNiveau', () => {
    it('devrait retourner 1 pour un total nul ou négatif', () => {
      expect(gameService.calculerNiveau(0)).toBe(1);
      expect(gameService.calculerNiveau(null)).toBe(1);
    });

    it('devrait augmenter logarithmiquement', () => {
      expect(gameService.calculerNiveau(100)).toBe(2);
      expect(gameService.calculerNiveau(200)).toBe(2);
      expect(gameService.calculerNiveau(300)).toBe(3);
      expect(gameService.calculerNiveau(400)).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // argentPourProchainNiveau
  // -----------------------------------------------------------------------
  describe('argentPourProchainNiveau', () => {
    it('devrait retourner 0 pour le niveau 1', () => {
      expect(gameService.argentPourProchainNiveau(1)).toBe(0);
    });
    it('devrait retourner 100 pour le niveau 2', () => {
      expect(gameService.argentPourProchainNiveau(2)).toBe(100);
    });
  });

  // -----------------------------------------------------------------------
  // getProductionPerSecond
  // -----------------------------------------------------------------------
  describe('getProductionPerSecond', () => {
    it("devrait retourner 0 quand la partie n'a pas d'infra", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ pps: 0 }] });
      expect(await gameService.getProductionPerSecond(1)).toBe(0);
    });

    it("devrait retourner la somme pondérée", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ pps: 25.5 }] });
      expect(await gameService.getProductionPerSecond(1)).toBe(25.5);
    });
  });

  // -----------------------------------------------------------------------
  // click
  // -----------------------------------------------------------------------
  describe('click', () => {
    it("devrait ajouter 1€ et 1 fan lors d'un clic simple sans bonus", async () => {
      // Séquence réelle (BEGIN/COMMIT gérés par le mock sans consommer) :
      // 0: getBonusAmeliorations → SELECT a.effet...
      // 1: UPDATE stock_ressource argent +gain
      // 2: UPDATE stock_ressource fans +1
      // 3: UPDATE partie total_argent_genere
      // 4: SELECT quantite FROM stock_ressource argent
      // 5: SELECT total_argent_genere, niveau FROM partie
      const queries = [
        { rows: [] },                                       // bonus: aucun
        { rows: [] },                                       // UPDATE argent
        { rows: [] },                                       // UPDATE fans
        { rows: [] },                                       // UPDATE partie
        { rows: [{ quantite: 1001 }] },                     // SELECT quantite
        { rows: [{ total_argent_genere: 501, niveau: 1 }] }, // SELECT niveau
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await gameService.click(1);
      expect(result.gain).toBe(1);
      expect(result.fans_gagnes).toBe(1);
      expect(result.nouvelle_quantite).toBe(1001);
    });

    it("devrait appliquer le bonus multiplicateurClic d'une amélioration", async () => {
      const queries = [
        { rows: [{ effet: 'multiplicateur_clic:3.0' }] },
        { rows: [] },
        { rows: [] },
        { rows: [] },
        { rows: [{ quantite: 1003 }] },
        { rows: [{ total_argent_genere: 503, niveau: 1 }] },
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await gameService.click(1);
      expect(result.gain).toBe(3); // CLIC_BASE(1) × 3
    });

    it("devrait monter de niveau quand le total_argent_genere atteint le seuil", async () => {
      // total_argent_genere actuel = 99, après click +1 → 100 → niveau 2
      const queries = [
        { rows: [] },                                       // bonus
        { rows: [] },                                       // UPDATE argent
        { rows: [] },                                       // UPDATE fans
        { rows: [] },                                       // UPDATE partie
        { rows: [{ quantite: 100 }] },                     // SELECT argent
        { rows: [{ total_argent_genere: 100, niveau: 1 }] }, // SELECT niveau → va upgrader
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await gameService.click(1);
      expect(result.gain).toBe(1);
    });

    it("devrait faire ROLLBACK en cas d'erreur DB", async () => {
      const error = new Error('DB error');
      const client = createMockClient([]);
      client.query.mockImplementation((sql) => {
        const s = (typeof sql === 'string' ? sql : '').trim().toUpperCase();
        if (s.startsWith('UPDATE STOCK_RESSOURCE')) return Promise.reject(error);
        if (s === 'BEGIN' || s === 'ROLLBACK') return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });
      pool.connect.mockResolvedValue(client);

      await expect(gameService.click(1)).rejects.toThrow('DB error');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  // -----------------------------------------------------------------------
  // sync
  // -----------------------------------------------------------------------
  describe('sync', () => {
    it("devrait calculer les gains hors-ligne basés sur la production", async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000); // il y a 1h

      // Séquence réelle : SELECT dernier_login, SELECT pps, getBonusAmeliorations,
      //   UPDATE argent, UPDATE partie, UPDATE fans, UPDATE dernier_login,
      //   SELECT total_argent_genere/niveau
      const queries = [
        { rows: [{ dernier_login: pastDate }] },     // dernier_login
        { rows: [{ pps: 10 }] },                      // pps
        { rows: [] },                                  // bonus
        { rows: [] },                                  // UPDATE argent
        { rows: [] },                                  // UPDATE partie
        { rows: [] },                                  // UPDATE fans
        { rows: [] },                                  // UPDATE dernier_login
        { rows: [{ total_argent_genere: 18500, niveau: 1 }] }, // SELECT niveau
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await gameService.sync(1);
      expect(result.secondes_ecoulees).toBe(3600);
      expect(result.gains_hors_ligne).toBe(18000); // floor(10*3600*0.5)
      expect(result.production_par_seconde).toBe(10);
    });

    it('devrait retourner 0 gains si la production est nulle', async () => {
      const pastDate = new Date(Date.now() - 100 * 1000);
      const queries = [
        { rows: [{ dernier_login: pastDate }] },
        { rows: [{ pps: 0 }] },
        { rows: [] },
        // pas d'UPDATE argent/fans car gains=0
        { rows: [] }, // UPDATE dernier_login
        { rows: [{ total_argent_genere: 500, niveau: 1 }] },
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await gameService.sync(1);
      expect(result.gains_hors_ligne).toBe(0);
    });

    it("devrait limiter le calcul à 24h (86400s)", async () => {
      const veryOldDate = new Date(Date.now() - 100000 * 1000);
      const queries = [
        { rows: [{ dernier_login: veryOldDate }] },
        { rows: [{ pps: 2 }] },
        { rows: [] },
        { rows: [] }, { rows: [] }, { rows: [] }, // UPDATEs argent/partie/fans
        { rows: [] }, // UPDATE dernier_login
        { rows: [{ total_argent_genere: 86900, niveau: 1 }] },
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await gameService.sync(1);
      expect(result.secondes_ecoulees).toBe(86400);
    });

    it('devrait appliquer le bonus multiplicateurProduction aux gains', async () => {
      const pastDate = new Date(Date.now() - 100 * 1000);
      const queries = [
        { rows: [{ dernier_login: pastDate }] },
        { rows: [{ pps: 10 }] },
        { rows: [{ effet: 'multiplicateur_production:2.0' }] }, // bonus ×2
        { rows: [] }, { rows: [] }, { rows: [] }, // UPDATEs
        { rows: [] }, // UPDATE dernier_login
        { rows: [{ total_argent_genere: 1500, niveau: 1 }] },
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await gameService.sync(1);
      expect(result.gains_hors_ligne).toBe(1000); // floor(10*2*100*0.5)
    });
  });
});
