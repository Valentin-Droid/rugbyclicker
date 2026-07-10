const coachService = require("../services/coachService");
const partieService = require("../services/partieService");

const coachController = {
	getRecommendation: async (req, res, next) => {
		try {
			const { id } = req.params;
			await partieService.verifyOwnership(id, req.joueurId);
			const recommandation = await coachService.getRecommendation(id);
			res.json(recommandation);
		} catch (err) {
			next(err);
		}
	},
};

module.exports = coachController;
