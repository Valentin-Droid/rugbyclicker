const authService = require('../services/authService');
const { generateToken } = require('../utils/jwt');

const authController = {
  register: async (req, res, next) => {
    try {
      const { pseudo, email, mot_de_passe } = req.body;

      const joueur = await authService.register(pseudo, email, mot_de_passe);
      const token = generateToken(joueur.id_joueur);

      res.status(201).json({ token, joueur });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, mot_de_passe } = req.body;

      const joueur = await authService.login(email, mot_de_passe);
      const token = generateToken(joueur.id_joueur);

      res.json({ token, joueur });
    } catch (err) {
      next(err);
    }
  },

  me: async (req, res, next) => {
    try {
      const joueur = await authService.getJoueurById(req.joueurId);
      res.json({ joueur });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
