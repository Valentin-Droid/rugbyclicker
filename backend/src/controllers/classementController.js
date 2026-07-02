const classementService = require('../services/classementService');

const classementController = {
  getTop20: async (req, res, next) => {
    try {
      const classement = await classementService.getTop20();
      res.json(classement);
    } catch (err) {
      next(err);
    }
  },

  getRank: async (req, res, next) => {
    try {
      const { id } = req.params;
      const rank = await classementService.getRank(parseInt(id, 10));
      res.json({ rang: rank });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = classementController;
