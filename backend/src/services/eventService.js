const pool = require('../models/db');

// Événements aléatoires côté serveur (pas de table DB, logique pure)
const EVENT_DEFINITIONS = [
  {
    type: 'ballon-dor',
    emoji: '🏉',
    label: "Ballon d'Or !",
    className: 'random-event--golden',
    description: "Un ballon d'or brille sur le stade !",
    effect: 'argent',
    gain: (level) => 500 + level * 250,
  },
  {
    type: 'supporter',
    emoji: '📣',
    label: 'Supporter !',
    className: 'random-event--supporter',
    description: 'Un supporter enflammé apparaît !',
    effect: 'fans',
    gain: (level) => 100 + level * 50,
  },
  {
    type: 'sponsor',
    emoji: '💼',
    label: 'Sponsor !',
    className: 'random-event--sponsor',
    description: 'Un sponsor propose un partenariat !',
    effect: 'boost',
    gain: (level) => 2.0, // multiplicateur de production pendant 30s
  },
  {
    type: 'etoile',
    emoji: '⭐',
    label: 'Étoile filante !',
    className: 'random-event--star',
    description: 'Une étoile filante traverse le ciel !',
    effect: 'prestige',
    gain: (level) => 10 + level * 5,
  },
];

const eventService = {
  /**
   * Retourne un événement aléatoire parmi les 4 types possibles.
   */
  getRandomEvent: () => {
    const idx = Math.floor(Math.random() * EVENT_DEFINITIONS.length);
    return EVENT_DEFINITIONS[idx];
  },

  /**
   * Applique l'effet d'un événement sur la partie.
   * Retourne le gain effectif.
   */
  applyEvent: async (partieId, eventType, level) => {
    const eventDef = EVENT_DEFINITIONS.find((e) => e.type === eventType);
    if (!eventDef) throw new Error(`Type d'événement inconnu : ${eventType}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const gain = eventDef.gain(level);

      switch (eventDef.effect) {
        case 'argent': {
          // Ballon d'Or : +X argent
          await client.query(
            'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 1',
            [Math.floor(gain), partieId]
          );
          await client.query(
            'UPDATE partie SET total_argent_genere = COALESCE(total_argent_genere, 0) + $1 WHERE id_partie = $2',
            [Math.floor(gain), partieId]
          );
          break;
        }
        case 'fans': {
          // Supporter : +X fans
          await client.query(
            'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 2',
            [Math.floor(gain), partieId]
          );
          break;
        }
        case 'boost': {
          // Sponsor : boost de production (on ajoute de l'argent équivalent à 30s de prod × multiplicateur)
          const ppsResult = await client.query(
            `SELECT COALESCE(SUM(pi.quantite * i.production_base * pi.niveau), 0) as pps
             FROM possession_infrastructure pi
             JOIN infrastructure i ON i.id_infrastructure = pi.id_infrastructure
             WHERE pi.id_partie = $1`,
            [partieId]
          );
          const pps = parseFloat(ppsResult.rows[0].pps);
          const bonusArgent = Math.floor(pps * 30 * gain); // 30s × multiplicateur
          await client.query(
            'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 1',
            [bonusArgent, partieId]
          );
          break;
        }
        case 'prestige': {
          // Étoile : +X prestige
          await client.query(
            'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 3',
            [Math.floor(gain), partieId]
          );
          break;
        }
      }

      await client.query('COMMIT');
      return { effect: eventDef.effect, gain: Math.floor(gain) };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = eventService;
