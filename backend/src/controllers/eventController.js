const eventService = require("../services/eventService");
const partieService = require("../services/partieService");

const eventController = {
	/**
	 * POST /api/parties/:id/event
	 * Reçoit un événement cliqué côté frontend, applique l'effet sur la partie,
	 * et retourne le gain.
	 */
	applyEvent: async (req, res, next) => {
		try {
			const { id } = req.params;
			const { eventType } = req.body;

			if (!eventType) {
				return res.status(400).json({ error: "eventType requis" });
			}

			await partieService.verifyOwnership(parseInt(id, 10), req.joueurId);

			// Le niveau est lu depuis la DB par le service — on ne fait pas confiance au client
			const result = await eventService.applyEvent(parseInt(id, 10), eventType);

			res.json(result);
		} catch (err) {
			next(err);
		}
	},
};

module.exports = eventController;
