const partieService = require('../services/partieService');

const partieController = {
  list: async (req, res, next) => {
    try {
      const parties = await partieService.listByJoueur(req.joueurId);
      res.json({ parties });
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { nom_club } = req.body;
      const partie = await partieService.create(req.joueurId, nom_club);
      res.status(201).json({ partie });
    } catch (err) {
      next(err);
    }
  },

  getFullState: async (req, res, next) => {
    try {
      await partieService.verifyOwnership(req.params.id, req.joueurId);
      const etat = await partieService.getFullState(req.params.id);
      res.json(etat);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = partieController;
