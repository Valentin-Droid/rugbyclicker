const pool = require('../models/db');

const CLIC_BASE = 1;
const COUT_MULTIPLIER = 1.15;
const UPGRADE_COST_MULT = 1.5;
const OFFLINE_PENALTY = 0.5;

const gameService = {
  click: async (partieId) => {
    const result = await pool.query(
      'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 1 RETURNING quantite',
      [CLIC_BASE, partieId]
    );
    return { gain: CLIC_BASE, nouvelle_quantite: result.rows[0].quantite };
  },

  getProductionPerSecond: async (partieId) => {
    const result = await pool.query(
      `SELECT COALESCE(SUM(pi.quantite * i.production_base * pi.niveau), 0) as pps
       FROM possession_infrastructure pi
       JOIN infrastructure i ON i.id_infrastructure = pi.id_infrastructure
       WHERE pi.id_partie = $1`,
      [partieId]
    );
    return parseFloat(result.rows[0].pps);
  },

  sync: async (partieId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const partieResult = await client.query(
        'SELECT dernier_login FROM partie WHERE id_partie = $1',
        [partieId]
      );
      const dernierLogin = new Date(partieResult.rows[0].dernier_login);
      const now = new Date();
      const secondesEcoulees = Math.floor((now - dernierLogin) / 1000);

      const ppsResult = await client.query(
        `SELECT COALESCE(SUM(pi.quantite * i.production_base * pi.niveau), 0) as pps
         FROM possession_infrastructure pi
         JOIN infrastructure i ON i.id_infrastructure = pi.id_infrastructure
         WHERE pi.id_partie = $1`,
        [partieId]
      );
      const pps = parseFloat(ppsResult.rows[0].pps);
      const gainsHorsLigne = Math.floor(pps * secondesEcoulees * OFFLINE_PENALTY);

      if (gainsHorsLigne > 0) {
        await client.query(
          'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 1',
          [gainsHorsLigne, partieId]
        );
      }

      await client.query(
        'UPDATE partie SET dernier_login = $1 WHERE id_partie = $2',
        [now, partieId]
      );

      await client.query('COMMIT');

      return {
        secondes_ecoulees: secondesEcoulees,
        gains_hors_ligne: gainsHorsLigne,
        production_par_seconde: pps,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getCoutAchat: (coutBase, quantiteActuelle, niveauActuel) => {
    return Math.floor(
      coutBase *
        Math.pow(COUT_MULTIPLIER, quantiteActuelle) *
        Math.pow(UPGRADE_COST_MULT, niveauActuel - 1)
    );
  },
};

module.exports = gameService;
