/**
 * Tests unitaires pour shopService.js
 *
 * Couvre : acheterInfrastructure, upgraderInfrastructure, acheterAmelioration.
 */

jest.mock('../models/db');
const pool = require('../models/db');
const { createMockClient } = require('./helpers');
const shopService = require('../services/shopService');

describe('shopService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // acheterInfrastructure
  // -----------------------------------------------------------------------
  describe('acheterInfrastructure', () => {
    it("devrait acheter une infrastructure pour la première fois", async () => {
      // Séquence réelle (hors BEGIN/COMMIT) :
      // 0: SELECT cout_base, 1: SELECT possession, 2: SELECT solde,
      // 3: UPDATE argent, 4: INSERT possession, 5: SELECT nouveau solde,
      // 6: SELECT nouvelle possession
      const queries = [
        { rows: [{ cout_base: 15 }] },
        { rows: [] },                                     // pas de possession
        { rows: [{ quantite: 1000 }] },
        { rows: [] },                                     // UPDATE argent
        { rows: [] },                                     // INSERT possession
        { rows: [{ quantite: 985 }] },
        { rows: [{ quantite: 1, niveau: 1 }] },
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await shopService.acheterInfrastructure(1, 1);
      expect(result.cout).toBe(15);
      expect(result.nouveau_solde).toBe(985);
      expect(result.nouvelle_quantite).toBe(1);
    });

    it("devrait calculer le coût croissant pour une infra déjà possédée", async () => {
      // Déjà 3 exemplaires, cout_base=100 → coût=floor(100*1.15^3)=152
      const queries = [
        { rows: [{ cout_base: 100 }] },
        { rows: [{ quantite: 3, niveau: 1 }] },
        { rows: [{ quantite: 5000 }] },
        { rows: [] }, // UPDATE argent
        { rows: [] }, // UPDATE possession (quantite+1)
        { rows: [{ quantite: 4848 }] },
        { rows: [{ quantite: 4, niveau: 1 }] },
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await shopService.acheterInfrastructure(1, 2);
      expect(result.cout).toBe(152);
      expect(result.nouvelle_quantite).toBe(4);
    });

    it("devrait lever une erreur 404 si l'infrastructure n'existe pas", async () => {
      const queries = [
        { rows: [] }, // SELECT cout_base → vide
      ];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.acheterInfrastructure(1, 999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Infrastructure non trouvee');
      }
    });

    it("devrait lever une erreur 400 si les fonds sont insuffisants", async () => {
      const queries = [
        { rows: [{ cout_base: 500000 }] },
        { rows: [] },                                     // pas de possession
        { rows: [{ quantite: 10 }] },                     // solde = 10 < 500000
      ];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.acheterInfrastructure(1, 4);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain('Fonds insuffisants');
      }
    });

    it("devrait faire ROLLBACK en cas d'erreur", async () => {
      const dbError = new Error('DB error');
      const client = createMockClient([]);
      let callCount = 0;
      client.query.mockImplementation((sql) => {
        const s = (typeof sql === 'string' ? sql : '').trim().toUpperCase();
        if (s === 'BEGIN' || s === 'ROLLBACK') return Promise.resolve({ rows: [] });
        callCount++;
        if (callCount === 1) return Promise.resolve({ rows: [{ cout_base: 15 }] });
        if (callCount === 2) return Promise.resolve({ rows: [] });
        if (callCount === 3) return Promise.resolve({ rows: [{ quantite: 1000 }] });
        return Promise.reject(dbError); // échec sur UPDATE argent
      });
      pool.connect.mockResolvedValue(client);

      await expect(shopService.acheterInfrastructure(1, 1)).rejects.toThrow('DB error');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  // -----------------------------------------------------------------------
  // upgraderInfrastructure
  // -----------------------------------------------------------------------
  describe('upgraderInfrastructure', () => {
    it("devrait upgrader le niveau d'une infrastructure possédée", async () => {
      const queries = [
        { rows: [{ cout_base: 15 }] },
        { rows: [{ quantite: 2, niveau: 1 }] },
        { rows: [{ quantite: 500 }] },
        { rows: [] }, // UPDATE argent
        { rows: [] }, // UPDATE niveau+1
        { rows: [{ quantite: 388 }] },
        { rows: [{ quantite: 2, niveau: 2 }] },
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await shopService.upgraderInfrastructure(1, 1);
      expect(result.cout).toBe(112); // floor(15*5*1.5^1)
      expect(result.niveau).toBe(2);
    });

    it("devrait lever une erreur 400 si l'infrastructure n'est pas possédée", async () => {
      const queries = [
        { rows: [{ cout_base: 15 }] },
        { rows: [] }, // possession vide
      ];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.upgraderInfrastructure(1, 1);
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toContain("Vous devez posseder");
      }
    });

    it("devrait lever une erreur 404 si l'infrastructure n'existe pas", async () => {
      const queries = [
        { rows: [] }, // SELECT cout_base → vide
      ];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.upgraderInfrastructure(1, 999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
      }
    });

    it("devrait lever une erreur 400 si les fonds sont insuffisants pour l'upgrade", async () => {
      const queries = [
        { rows: [{ cout_base: 8000 }] },
        { rows: [{ quantite: 1, niveau: 1 }] },
        { rows: [{ quantite: 100 }] },
      ];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.upgraderInfrastructure(1, 4);
      } catch (err) {
        expect(err.message).toContain('Fonds insuffisants');
      }
    });
  });

  // -----------------------------------------------------------------------
  // acheterAmelioration
  // -----------------------------------------------------------------------
  describe('acheterAmelioration', () => {
    it("devrait acheter une amélioration non encore possédée", async () => {
      const queries = [
        { rows: [{ nom: 'Marketing local', cout: 50 }] }, // SELECT amelioration
        { rows: [] },                                      // pas déjà achetée
        { rows: [{ quantite: 200 }] },                     // solde
        { rows: [] },                                      // UPDATE argent
        { rows: [{ date_achat: '2025-06-01' }] },          // INSERT achat
        { rows: [{ quantite: 150 }] },                     // nouveau solde
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await shopService.acheterAmelioration(1, 1);
      expect(result.cout).toBe(50);
      expect(result.nouveau_solde).toBe(150);
      expect(result.nom).toBe('Marketing local');
    });

    it("devrait lever une erreur 404 si l'amélioration n'existe pas", async () => {
      const queries = [{ rows: [] }];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.acheterAmelioration(1, 999);
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Amelioration non trouvee');
      }
    });

    it("devrait lever une erreur 409 si l'amélioration a déjà été achetée", async () => {
      const queries = [
        { rows: [{ nom: 'Marketing local', cout: 50 }] },
        { rows: [{ '?column?': 1 }] }, // déjà achetée
      ];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.acheterAmelioration(1, 1);
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.message).toContain('deja ete achetee');
      }
    });

    it("devrait lever une erreur 400 si les fonds sont insuffisants", async () => {
      const queries = [
        { rows: [{ nom: 'Hall of Fame', cout: 5000000 }] },
        { rows: [] },
        { rows: [{ quantite: 100 }] },
      ];
      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      try {
        await shopService.acheterAmelioration(1, 10);
      } catch (err) {
        expect(err.message).toContain('Fonds insuffisants');
      }
    });
  });
});
