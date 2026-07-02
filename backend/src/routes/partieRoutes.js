const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const partieController = require('../controllers/partieController');
const gameController = require('../controllers/gameController');
const coachController = require('../controllers/coachController');
const eventController = require('../controllers/eventController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { createPartieSchema } = require('../validators/partieValidator');

// Rate limiter pour la route coach : 5 requêtes par minute max (protège Ollama)
const coachLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
});

/**
 * @swagger
 * /api/parties:
 *   get:
 *     tags: [Parties]
 *     summary: Lister les parties du joueur
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des parties
 */
router.get('/', authMiddleware, partieController.list);

/**
 * @swagger
 * /api/parties:
 *   post:
 *     tags: [Parties]
 *     summary: Créer une nouvelle partie
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom_club]
 *             properties:
 *               nom_club:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Partie créée
 *       400:
 *         description: Données invalides
 */
router.post('/', authMiddleware, validate(createPartieSchema), partieController.create);

/**
 * @swagger
 * /api/parties/{id}:
 *   get:
 *     tags: [Parties]
 *     summary: Charger l'état complet d'une partie
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: État complet de la partie
 *       404:
 *         description: Partie non trouvée
 */
router.get('/:id', authMiddleware, partieController.getFullState);

/**
 * @swagger
 * /api/parties/{id}/click:
 *   post:
 *     tags: [Jeu]
 *     summary: Action de clic manuel (ajoute 1 Argent)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gain du clic
 */
router.post('/:id/click', authMiddleware, gameController.click);

/**
 * @swagger
 * /api/parties/{id}/sync:
 *   post:
 *     tags: [Jeu]
 *     summary: Synchroniser les gains hors-ligne
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Résultat de la synchronisation
 */
router.post('/:id/sync', authMiddleware, gameController.sync);

/**
 * @swagger
 * /api/parties/{id}/coach:
 *   post:
 *     tags: [IA]
 *     summary: Obtenir une recommandation de l'assistant IA (Ollama)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recommandation IA (action, raison, impact)
 */
router.post('/:id/coach', authMiddleware, coachLimiter, coachController.getRecommendation);

/**
 * @swagger
 * /api/parties/{id}/event:
 *   post:
 *     tags: [Jeu]
 *     summary: Appliquer un événement aléatoire (Ballon d'Or, Supporter, Sponsor, Étoile)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventType, level]
 *             properties:
 *               eventType:
 *                 type: string
 *               level:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Gain appliqué
 */
router.post('/:id/event', authMiddleware, eventController.applyEvent);

module.exports = router;
