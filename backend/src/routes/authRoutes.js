const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidator');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
