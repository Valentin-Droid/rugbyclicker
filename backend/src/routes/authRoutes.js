const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidator');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription d'un nouveau joueur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pseudo, email, mot_de_passe]
 *             properties:
 *               pseudo:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               mot_de_passe:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Compte créé, retourne JWT + joueur
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion d'un joueur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, mot_de_passe]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               mot_de_passe:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne JWT + joueur
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Récupère le profil du joueur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil du joueur
 *       401:
 *         description: Non authentifié
 */
router.get('/me', authMiddleware, authController.me);

module.exports = router;
