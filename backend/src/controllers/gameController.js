const partieService = require('../services/partieService');
const gameService = require('../services/gameService');

const gameController = {
  click: async (req, res, next) => {
    try {
      await partieService.verifyOwnership(req.params.id, req.joueurId);
      const result = await gameService.click(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  sync: async (req, res, next) => {
    try {
      await partieService.verifyOwnership(req.params.id, req.joueurId);
      const result = await gameService.sync(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = gameController;
