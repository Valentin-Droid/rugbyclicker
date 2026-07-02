const coachService = require('../services/coachService');

const coachController = {
  getRecommendation: async (req, res, next) => {
    try {
      const { id } = req.params;
      const recommandation = await coachService.getRecommendation(id);
      res.json(recommandation);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = coachController;
