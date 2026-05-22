const router = require('express').Router();
const shopController = require('../controllers/shopController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/parties/{id}/infrastructures/{infraId}/acheter:
 *   post:
 *     tags: [Shop]
 *     summary: Acheter une infrastructure
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la partie
 *       - in: path
 *         name: infraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'infrastructure
 *     responses:
 *       200:
 *         description: Achat effectue
 *       400:
 *         description: Fonds insuffisants
 *       404:
 *         description: Partie ou infrastructure non trouvee
 */
router.post(
  '/:id/infrastructures/:infraId/acheter',
  authMiddleware,
  shopController.acheterInfrastructure
);

/**
 * @swagger
 * /api/parties/{id}/infrastructures/{infraId}/upgrader:
 *   post:
 *     tags: [Shop]
 *     summary: Ameliorer le niveau d'une infrastructure
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la partie
 *       - in: path
 *         name: infraId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'infrastructure
 *     responses:
 *       200:
 *         description: Amelioration effectuee
 *       400:
 *         description: Fonds insuffisants ou infrastructure non possedee
 *       404:
 *         description: Partie ou infrastructure non trouvee
 */
router.post(
  '/:id/infrastructures/:infraId/upgrader',
  authMiddleware,
  shopController.upgraderInfrastructure
);

/**
 * @swagger
 * /api/parties/{id}/ameliorations/{amelId}/acheter:
 *   post:
 *     tags: [Shop]
 *     summary: Acheter une amelioration (one-shot)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la partie
 *       - in: path
 *         name: amelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'amelioration
 *     responses:
 *       200:
 *         description: Amelioration achetee
 *       400:
 *         description: Fonds insuffisants
 *       409:
 *         description: Amelioration deja achetee
 *       404:
 *         description: Partie ou amelioration non trouvee
 */
router.post(
  '/:id/ameliorations/:amelId/acheter',
  authMiddleware,
  shopController.acheterAmelioration
);

module.exports = router;
