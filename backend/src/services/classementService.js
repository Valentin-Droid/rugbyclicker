const pool = require('../models/db');

const classementService = {
  /**
   * Retourne le top 20 des clubs classés par prestige décroissant.
   * Inclut le rang, le nom du club, le niveau, le prestige et le pseudo du joueur.
   */
  getTop20: async () => {
    const result = await pool.query(
      `SELECT
         ROW_NUMBER() OVER (ORDER BY COALESCE(sr.quantite, 0) DESC, p.total_argent_genere DESC) as rang,
         p.nom_club,
         p.niveau,
         COALESCE(sr.quantite, 0) as prestige,
         p.total_argent_genere,
         j.pseudo
       FROM partie p
       JOIN joueur j ON j.id_joueur = p.id_joueur
       LEFT JOIN stock_ressource sr ON sr.id_partie = p.id_partie AND sr.id_ressource = 3
       ORDER BY prestige DESC, p.total_argent_genere DESC
       LIMIT 20`
    );
    return result.rows;
  },

  /**
   * Retourne le rang d'une partie spécifique dans le classement global.
   */
  getRank: async (partieId) => {
    const result = await pool.query(
      `SELECT rang FROM (
         SELECT p.id_partie,
           ROW_NUMBER() OVER (ORDER BY COALESCE(sr.quantite, 0) DESC, p.total_argent_genere DESC) as rang
         FROM partie p
         LEFT JOIN stock_ressource sr ON sr.id_partie = p.id_partie AND sr.id_ressource = 3
       ) sub
       WHERE sub.id_partie = $1`,
      [partieId]
    );
    return result.rows[0]?.rang || null;
  },
};

module.exports = classementService;
