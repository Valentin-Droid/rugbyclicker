/**
 * Tests unitaires pour coachService.js
 *
 * Couvre : getRecommendation (succès Ollama, fallback algorithmique,
 * JSON invalide, partie introuvable).
 */

// Mock partagé pour le chat Ollama - toutes les instances partagent cette fonction
const mockChat = jest.fn();

jest.mock('../models/db');
jest.mock('../services/gameService');
jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    chat: mockChat,
  })),
}));

const pool = require('../models/db');
const gameService = require('../services/gameService');
const coachService = require('../services/coachService');

describe('coachService', () => {
  const partieRow = { id_partie: 1, nom_club: 'Les Terribles', niveau: 5 };
  const ressourcesRows = [
    { id_ressource: 1, nom: 'Argent', quantite: 5000 },
    { id_ressource: 2, nom: 'Fans', quantite: 300 },
    { id_ressource: 3, nom: 'Prestige', quantite: 10 },
  ];
  const infrastructuresRows = [
    { id_infrastructure: 1, nom: "Terrain d'entraînement", cout_base: 15, production_base: 0.1, quantite: 2, niveau: 1 },
    { id_infrastructure: 2, nom: 'Stade municipal', cout_base: 100, production_base: 0.5, quantite: 0, niveau: 1 },
  ];
  const ameliorationsRows = [
    { id_amelioration: 1, nom: 'Marketing local', cout: 50, effet: 'multiplicateur_production:1.5', achete: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les mocks gameService
    gameService.getCoutAchat.mockReturnValue(99999); // tout est cher par défaut
    gameService.getCoutUpgrade.mockReturnValue(99999);
    gameService.getProductionPerSecond.mockResolvedValue(0);
  });

  function setupPartieState() {
    pool.query
      .mockResolvedValueOnce({ rows: [partieRow] })
      .mockResolvedValueOnce({ rows: ressourcesRows })
      .mockResolvedValueOnce({ rows: infrastructuresRows })
      .mockResolvedValueOnce({ rows: ameliorationsRows });
  }

  // -----------------------------------------------------------------------
  // getRecommendation
  // -----------------------------------------------------------------------
  describe('getRecommendation', () => {
    it("devrait retourner une recommandation JSON valide depuis Ollama", async () => {
      setupPartieState();
      gameService.getProductionPerSecond.mockResolvedValue(2.5);

      const recommandation = {
        action: 'Acheter Stade municipal',
        raison: 'Augmente la production passive.',
        impact: '+0.5€/s de production passive',
      };

      mockChat.mockResolvedValueOnce({
        message: { content: JSON.stringify(recommandation) },
      });

      const result = await coachService.getRecommendation(1);

      expect(result).toEqual(recommandation);
      expect(gameService.getProductionPerSecond).toHaveBeenCalledWith(1);
      expect(mockChat).toHaveBeenCalledTimes(1);

      const chatCall = mockChat.mock.calls[0][0];
      expect(chatCall.model).toBe('gemma3:1b');
      expect(chatCall.messages[0].content).toContain('Les Terribles');
      expect(chatCall.format).toBe('json');
    });

    it("devrait utiliser le fallback algorithmique si Ollama est injoignable", async () => {
      setupPartieState();
      gameService.getProductionPerSecond.mockResolvedValue(0);

      // Configurer des coûts réalistes pour que le fallback fonctionne
      gameService.getCoutAchat
        .mockReturnValueOnce(19)   // terrain: floor(15*1.15^2)
        .mockReturnValueOnce(100); // stade: floor(100*1.15^0)
      gameService.getCoutUpgrade.mockReturnValue(112);

      mockChat.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await coachService.getRecommendation(1);

      // Le fallback algorithmique retourne une recommandation structurée
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('raison');
      expect(result).toHaveProperty('impact');
      expect(typeof result.action).toBe('string');
    });

    it("devrait nettoyer le JSON si le modèle retourne du markdown", async () => {
      setupPartieState();
      gameService.getProductionPerSecond.mockResolvedValue(0);

      const recommandation = { action: 'Acheter', raison: 'Raison', impact: 'Impact' };
      mockChat.mockResolvedValueOnce({
        message: { content: '```json\n' + JSON.stringify(recommandation) + '\n```' },
      });

      const result = await coachService.getRecommendation(1);
      expect(result.action).toBe('Acheter');
      expect(result.raison).toBe('Raison');
    });

    it("devrait utiliser le contenu brut comme raison si le parsing JSON échoue complètement", async () => {
      setupPartieState();
      gameService.getProductionPerSecond.mockResolvedValue(0);

      mockChat.mockResolvedValueOnce({
        message: { content: 'Pas du JSON du tout, juste du texte.' },
      });

      const result = await coachService.getRecommendation(1);
      expect(result.action).toBe('Analyser manuellement');
      expect(result.raison).toBe('Pas du JSON du tout, juste du texte.');
    });

    it("devrait lever une erreur si la partie n'existe pas", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await expect(coachService.getRecommendation(999)).rejects.toThrow('Partie introuvable');
    });
  });
});
