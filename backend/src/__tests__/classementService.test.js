/**
 * Tests unitaires pour classementService.js
 *
 * Couvre : getTop20, getRank.
 * Cas d'erreur : partie inexistante (getRank retourne null).
 */

jest.mock('../models/db');
const pool = require('../models/db');
const classementService = require('../services/classementService');

describe('classementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getTop20
  // -----------------------------------------------------------------------
  describe('getTop20', () => {
    it('devrait retourner le top 20 des clubs classés par prestige décroissant', async () => {
      const mockRows = [
        { rang: 1, nom_club: 'Les Champions', niveau: 10, prestige: 5000, total_argent_genere: 1000000, pseudo: 'Player1' },
        { rang: 2, nom_club: 'Les Tigres', niveau: 8, prestige: 3000, total_argent_genere: 500000, pseudo: 'Player2' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockRows });

      const result = await classementService.getTop20();

      expect(result).toHaveLength(2);
      expect(result[0].rang).toBe(1);
      expect(result[0].nom_club).toBe('Les Champions');
      expect(result[0].prestige).toBe(5000);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('devrait retourner un tableau vide si aucun club', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await classementService.getTop20();
      expect(result).toEqual([]);
    });

    it('devrait passer les paramètres SQL corrects', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await classementService.getTop20();

      const sql = pool.query.mock.calls[0][0];
      expect(sql).toContain('ROW_NUMBER()');
      expect(sql).toContain('LIMIT 20');
      expect(sql).toContain('ORDER BY');
    });
  });

  // -----------------------------------------------------------------------
  // getRank
  // -----------------------------------------------------------------------
  describe('getRank', () => {
    it("devrait retourner le rang d'une partie existante", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ rang: 5 }] });

      const rang = await classementService.getRank(1);
      expect(rang).toBe(5);
    });

    it("devrait retourner null si la partie n'existe pas", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const rang = await classementService.getRank(999);
      expect(rang).toBeNull();
    });

    it("devrait retourner null si le rang est undefined", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{}] }); // pas de propriété 'rang'

      const rang = await classementService.getRank(1);
      expect(rang).toBeNull();
    });

    it('devrait utiliser la sous-requête ROW_NUMBER pour calculer le rang', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ rang: 42 }] });

      await classementService.getRank(1);

      const sql = pool.query.mock.calls[0][0];
      expect(sql).toContain('ROW_NUMBER()');
      expect(sql).toContain('ORDER BY');
      expect(pool.query.mock.calls[0][1]).toEqual([1]); // paramètre partieId
    });
  });
});
