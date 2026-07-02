/**
 * Tests unitaires pour eventService.js
 *
 * Couvre : getRandomEvent (4 types), applyEvent pour chaque effet.
 * Cas d'erreur : type d'événement inconnu.
 */

jest.mock('../models/db');
const pool = require('../models/db');
const { createMockClient } = require('./helpers');
const eventService = require('../services/eventService');

describe('eventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getRandomEvent
  // -----------------------------------------------------------------------
  describe('getRandomEvent', () => {
    it('devrait retourner un événement valide parmi les 4 types', () => {
      const event = eventService.getRandomEvent();
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('emoji');
      expect(event).toHaveProperty('effect');
      expect(event).toHaveProperty('gain');
      expect(typeof event.gain).toBe('function');

      const typesValides = ['ballon-dor', 'supporter', 'sponsor', 'etoile'];
      expect(typesValides).toContain(event.type);
    });

    it('devrait avoir la fonction gain qui accepte un niveau', () => {
      const event = eventService.getRandomEvent();
      const gain = event.gain(5);
      expect(typeof gain).toBe('number');
      expect(gain).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // applyEvent
  // -----------------------------------------------------------------------
  describe('applyEvent', () => {
    it("devrait appliquer l'effet 'argent' (ballon-d'or)", async () => {
      // applyEvent pour ballon-dor : BEGIN, UPDATE argent, UPDATE partie, COMMIT
      const queries = [
        { rows: [] }, // UPDATE argent
        { rows: [] }, // UPDATE partie
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await eventService.applyEvent(1, 'ballon-dor', 5);
      expect(result.effect).toBe('argent');
      expect(result.gain).toBe(1750); // 500 + 5*250
    });

    it("devrait appliquer l'effet 'fans' (supporter)", async () => {
      const queries = [
        { rows: [] }, // UPDATE fans
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await eventService.applyEvent(1, 'supporter', 3);
      expect(result.effect).toBe('fans');
      expect(result.gain).toBe(250); // 100 + 3*50
    });

    it("devrait appliquer l'effet 'boost' (sponsor) : boost de production", async () => {
      // boost: BEGIN, SELECT pps, UPDATE argent, COMMIT
      const queries = [
        { rows: [{ pps: 10 }] }, // SELECT pps
        { rows: [] },            // UPDATE argent (bonus = floor(10*30*2.0) = 600)
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await eventService.applyEvent(1, 'sponsor', 1);
      expect(result.effect).toBe('boost');
    });

    it("devrait appliquer l'effet 'prestige' (étoile)", async () => {
      const queries = [
        { rows: [] }, // UPDATE prestige
      ];

      const client = createMockClient(queries);
      pool.connect.mockResolvedValue(client);

      const result = await eventService.applyEvent(1, 'etoile', 4);
      expect(result.effect).toBe('prestige');
      expect(result.gain).toBe(30); // 10 + 4*5
    });

    it("devrait lever une erreur pour un type d'événement inconnu", async () => {
      await expect(
        eventService.applyEvent(1, 'type_invalide', 1)
      ).rejects.toThrow("Type d'événement inconnu");
    });

    it("devrait faire ROLLBACK en cas d'erreur DB", async () => {
      const dbError = new Error('DB error');
      const client = createMockClient([]);
      client.query.mockImplementation((sql) => {
        const s = (typeof sql === 'string' ? sql : '').trim().toUpperCase();
        if (s.startsWith('UPDATE STOCK_RESSOURCE')) return Promise.reject(dbError);
        if (s === 'BEGIN' || s === 'ROLLBACK') return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      });
      pool.connect.mockResolvedValue(client);

      await expect(eventService.applyEvent(1, 'ballon-dor', 1)).rejects.toThrow('DB error');
      expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
