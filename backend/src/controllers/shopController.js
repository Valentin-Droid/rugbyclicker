const partieService = require('../services/partieService');
const shopService = require('../services/shopService');

const shopController = {
  acheterInfrastructure: async (req, res, next) => {
    try {
      await partieService.verifyOwnership(req.params.id, req.joueurId);
      const result = await shopService.acheterInfrastructure(
        req.params.id,
        req.params.infraId
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  upgraderInfrastructure: async (req, res, next) => {
    try {
      await partieService.verifyOwnership(req.params.id, req.joueurId);
      const result = await shopService.upgraderInfrastructure(
        req.params.id,
        req.params.infraId
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  acheterAmelioration: async (req, res, next) => {
    try {
      await partieService.verifyOwnership(req.params.id, req.joueurId);
      const result = await shopService.acheterAmelioration(
        req.params.id,
        req.params.amelId
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = shopController;
