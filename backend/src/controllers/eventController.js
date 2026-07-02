const eventService = require('../services/eventService');

const eventController = {
  /**
   * POST /api/parties/:id/event
   * Reçoit un événement cliqué côté frontend, applique l'effet sur la partie,
   * et retourne le gain.
   */
  applyEvent: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { eventType, level } = req.body;

      if (!eventType) {
        return res.status(400).json({ error: "eventType requis" });
      }

      const result = await eventService.applyEvent(
        parseInt(id, 10),
        eventType,
        level || 1
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = eventController;
