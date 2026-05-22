const pool = require('../models/db');

const partieService = {
  listByJoueur: async (joueurId) => {
    const result = await pool.query(
      'SELECT id_partie, nom_club, niveau, dernier_login FROM partie WHERE id_joueur = $1 ORDER BY id_partie',
      [joueurId]
    );
    return result.rows;
  },

  create: async (joueurId, nomClub) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const partieResult = await client.query(
        'INSERT INTO partie (nom_club, id_joueur) VALUES ($1, $2) RETURNING id_partie, nom_club, niveau, dernier_login',
        [nomClub, joueurId]
      );
      const partie = partieResult.rows[0];

      const ressources = await client.query('SELECT id_ressource FROM ressource');
      for (const res of ressources.rows) {
        await client.query(
          'INSERT INTO stock_ressource (id_partie, id_ressource, quantite) VALUES ($1, $2, 0)',
          [partie.id_partie, res.id_ressource]
        );
      }

      await client.query('COMMIT');
      return partie;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getFullState: async (partieId) => {
    const partieResult = await pool.query(
      'SELECT id_partie, nom_club, niveau, dernier_login, COALESCE(total_argent_genere, 0) as total_argent_genere FROM partie WHERE id_partie = $1',
      [partieId]
    );

    if (partieResult.rows.length === 0) {
      const error = new Error('Partie non trouvée');
      error.statusCode = 404;
      throw error;
    }

    const partie = partieResult.rows[0];

    const stockResult = await pool.query(
      `SELECT r.id_ressource, r.nom, r.description, COALESCE(sr.quantite, 0) as quantite
       FROM ressource r
       LEFT JOIN stock_ressource sr ON sr.id_ressource = r.id_ressource AND sr.id_partie = $1
       ORDER BY r.id_ressource`,
      [partieId]
    );

    const infraResult = await pool.query(
      `SELECT i.id_infrastructure, i.nom, i.cout_base, i.production_base, i.description,
              COALESCE(pi.quantite, 0) as quantite, COALESCE(pi.niveau, 1) as niveau
       FROM infrastructure i
       LEFT JOIN possession_infrastructure pi ON pi.id_infrastructure = i.id_infrastructure AND pi.id_partie = $1
       ORDER BY i.id_infrastructure`,
      [partieId]
    );

    const ameliorationsResult = await pool.query(
      `SELECT a.id_amelioration, a.nom, a.cout, a.effet, a.type_cible,
              CASE WHEN aa.id_amelioration IS NOT NULL THEN true ELSE false END as achete,
              aa.date_achat
       FROM amelioration a
       LEFT JOIN achat_amelioration aa ON aa.id_amelioration = a.id_amelioration AND aa.id_partie = $1
       ORDER BY a.id_amelioration`,
      [partieId]
    );

    return {
      ...partie,
      ressources: stockResult.rows,
      infrastructures: infraResult.rows,
      ameliorations: ameliorationsResult.rows,
    };
  },

  verifyOwnership: async (partieId, joueurId) => {
    const result = await pool.query(
      'SELECT id_partie FROM partie WHERE id_partie = $1 AND id_joueur = $2',
      [partieId, joueurId]
    );

    if (result.rows.length === 0) {
      const error = new Error('Partie non trouvée ou accès non autorisé');
      error.statusCode = 404;
      throw error;
    }

    return true;
  },
};

module.exports = partieService;
