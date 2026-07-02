const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const classementController = require('../controllers/classementController');

/**
 * @swagger
 * /api/classement:
 *   get:
 *     tags: [Classement]
 *     summary: Top 20 des clubs par prestige
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Classement global
 */
router.get('/', authMiddleware, classementController.getTop20);

/**
 * @swagger
 * /api/classement/{id}:
 *   get:
 *     tags: [Classement]
 *     summary: Rang d'une partie spécifique dans le classement
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
 *         description: Rang du club
 */
router.get('/:id', authMiddleware, classementController.getRank);

module.exports = router;
