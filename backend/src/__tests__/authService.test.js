/**
 * Tests unitaires pour authService.js
 *
 * Couvre : register, login, getJoueurById.
 * Cas d'erreur : email déjà utilisé, mot de passe invalide, joueur non trouvé.
 */

jest.mock('../models/db');
jest.mock('bcrypt');

const pool = require('../models/db');
const bcrypt = require('bcrypt');
const authService = require('../services/authService');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    bcrypt.compare.mockResolvedValue(true);
  });

  // -----------------------------------------------------------------------
  // register
  // -----------------------------------------------------------------------
  describe('register', () => {
    it("devrait inscrire un nouveau joueur avec succès", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // check email → libre
      pool.query.mockResolvedValueOnce({
        rows: [{ id_joueur: 1, pseudo: 'TestJoueur', email: 'test@example.com', date_creation: '2025-06-01' }],
      });

      const result = await authService.register('TestJoueur', 'test@example.com', 'password123');
      expect(result.id_joueur).toBe(1);
      expect(result.pseudo).toBe('TestJoueur');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it("devrait lever une erreur 409 si l'email est déjà utilisé", async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id_joueur: 99 }] });

      try {
        await authService.register('ExistingUser', 'deja@example.com', 'pass');
        fail('Devrait avoir lancé une erreur');
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Cet email est déjà utilisé');
      }
    });

    it('devrait hacher le mot de passe avant insertion', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      pool.query.mockResolvedValueOnce({
        rows: [{ id_joueur: 1, pseudo: 'P', email: 'p@e.com', date_creation: '...' }],
      });

      await authService.register('P', 'p@e.com', 'secret');
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
    });
  });

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------
  describe('login', () => {
    it("devrait connecter un joueur avec des identifiants valides", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id_joueur: 1, pseudo: 'RugbyFan42', email: 'rugbyfan@example.com',
          mot_de_passe: '$2b$10$hash', date_creation: '2025-01-01',
        }],
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await authService.login('rugbyfan@example.com', 'correct');
      expect(result.id_joueur).toBe(1);
      expect(result.pseudo).toBe('RugbyFan42');
      expect(result).not.toHaveProperty('mot_de_passe');
    });

    it("devrait lever une erreur 401 si l'email n'existe pas", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      try {
        await authService.login('inconnu@example.com', 'pass');
        fail('Devrait avoir lancé une erreur');
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Email ou mot de passe incorrect');
      }
    });

    it('devrait lever une erreur 401 si le mot de passe est invalide', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id_joueur: 1, pseudo: 'RugbyFan42', email: 'rugbyfan@example.com',
          mot_de_passe: '$2b$10$hash', date_creation: '2025-01-01',
        }],
      });
      bcrypt.compare.mockResolvedValueOnce(false);

      try {
        await authService.login('rugbyfan@example.com', 'mauvais');
        fail('Devrait avoir lancé une erreur');
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Email ou mot de passe incorrect');
      }
    });
  });

  // -----------------------------------------------------------------------
  // getJoueurById
  // -----------------------------------------------------------------------
  describe('getJoueurById', () => {
    it('devrait retourner le joueur par son ID', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id_joueur: 1, pseudo: 'RugbyFan42', email: 'rugbyfan@example.com', date_creation: '2025-01-01' }],
      });

      const joueur = await authService.getJoueurById(1);
      expect(joueur.id_joueur).toBe(1);
    });

    it("devrait lever une erreur 404 si le joueur n'existe pas", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      try {
        await authService.getJoueurById(999);
        fail('Devrait avoir lancé une erreur');
      } catch (err) {
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Joueur non trouvé');
      }
    });
  });
});
