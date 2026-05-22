const pool = require('../models/db');

const CLIC_BASE = 1;
const COUT_MULTIPLIER = 1.15;
const OFFLINE_PENALTY = 0.5;
const MAX_OFFLINE_SECONDS = 86400; // 24 heures max

// Parse les effets des ameliorations achetees par une partie
// Retourne { multiplicateurProduction, multiplicateurClic }
const getBonusAmeliorations = async (partieId, client) => {
  const result = await (client || pool).query(
    `SELECT a.effet FROM amelioration a
     JOIN achat_amelioration aa ON aa.id_amelioration = a.id_amelioration
     WHERE aa.id_partie = $1`,
    [partieId]
  );
  let multiplicateurProduction = 1;
  let multiplicateurClic = 1;
  for (const row of result.rows) {
    const [type, valeur] = row.effet.split(':');
    const multiplicateur = parseFloat(valeur);

    if (type === 'multiplicateur_production') {
      multiplicateurProduction *= multiplicateur;
    } else if (type === 'multiplicateur_clic') {
      multiplicateurClic *= multiplicateur;
    } else if (type === 'multiplicateur_global') {
      multiplicateurProduction *= multiplicateur;
      multiplicateurClic *= multiplicateur;
    }
  }
  return { multiplicateurProduction, multiplicateurClic };
};

// Calcule le niveau du club base sur total_argent_genere
const calculerNiveau = (totalArgent) => {
  if (!totalArgent || totalArgent <= 0) return 1;
  return Math.floor(Math.log2(totalArgent / 100 + 1)) + 1;
};

// Calcule l'argent total necessaire pour le prochain niveau
const argentPourProchainNiveau = (niveau) => {
  return Math.floor(100 * (Math.pow(2, niveau - 1) - 1));
};

const gameService = {
  click: async (partieId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bonus = await getBonusAmeliorations(partieId, client);
      const gainBase = CLIC_BASE * bonus.multiplicateurClic;
      const gain = Math.floor(gainBase);

      await client.query(
        'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 1',
        [gain, partieId]
      );

      // +1 Fan par clic
      await client.query(
        'UPDATE stock_ressource SET quantite = quantite + 1 WHERE id_partie = $1 AND id_ressource = 2',
        [partieId]
      );

      await client.query(
        'UPDATE partie SET total_argent_genere = COALESCE(total_argent_genere, 0) + $1 WHERE id_partie = $2',
        [gain, partieId]
      );

      const quantiteResult = await client.query(
        'SELECT quantite FROM stock_ressource WHERE id_partie = $1 AND id_ressource = 1',
        [partieId]
      );

      // Mise a jour du niveau
      const totalResult = await client.query(
        'SELECT total_argent_genere, niveau FROM partie WHERE id_partie = $1',
        [partieId]
      );
      const nouveauNiveau = calculerNiveau(parseFloat(totalResult.rows[0].total_argent_genere));
      if (nouveauNiveau > totalResult.rows[0].niveau) {
        await client.query(
          'UPDATE partie SET niveau = $1 WHERE id_partie = $2',
          [nouveauNiveau, partieId]
        );
        // Ajout de Prestige : +10 * nouveau_niveau
        await client.query(
          'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 3',
          [10 * nouveauNiveau, partieId]
        );
        // +100 × nouveau_niveau Fans à chaque level-up
        await client.query(
          'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 2',
          [100 * nouveauNiveau, partieId]
        );
      }

      await client.query('COMMIT');
      return { gain, fans_gagnes: 1, nouvelle_quantite: quantiteResult.rows[0].quantite };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
      const secondesEcoulees = Math.min(
        Math.floor((now - dernierLogin) / 1000),
        MAX_OFFLINE_SECONDS
      );

      const ppsResult = await client.query(
        `SELECT COALESCE(SUM(pi.quantite * i.production_base * pi.niveau), 0) as pps
         FROM possession_infrastructure pi
         JOIN infrastructure i ON i.id_infrastructure = pi.id_infrastructure
         WHERE pi.id_partie = $1`,
        [partieId]
      );
      const ppsBase = parseFloat(ppsResult.rows[0].pps);

      const bonus = await getBonusAmeliorations(partieId, client);
      const pps = ppsBase * bonus.multiplicateurProduction;
      const gainsHorsLigne = Math.floor(pps * secondesEcoulees * OFFLINE_PENALTY);

      if (gainsHorsLigne > 0) {
        await client.query(
          'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 1',
          [gainsHorsLigne, partieId]
        );
        await client.query(
          'UPDATE partie SET total_argent_genere = COALESCE(total_argent_genere, 0) + $1 WHERE id_partie = $2',
          [gainsHorsLigne, partieId]
        );
      }

      // Fans générés = 10% des gains hors-ligne
      const fansHorsLigne = Math.floor(gainsHorsLigne / 10);
      if (fansHorsLigne > 0) {
        await client.query(
          'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 2',
          [fansHorsLigne, partieId]
        );
      }

      await client.query(
        'UPDATE partie SET dernier_login = $1 WHERE id_partie = $2',
        [now, partieId]
      );

      // Mise a jour du niveau
      const totalResult = await client.query(
        'SELECT total_argent_genere, niveau FROM partie WHERE id_partie = $1',
        [partieId]
      );
      const nouveauNiveau = calculerNiveau(parseFloat(totalResult.rows[0].total_argent_genere));
      if (nouveauNiveau > totalResult.rows[0].niveau) {
        await client.query(
          'UPDATE partie SET niveau = $1 WHERE id_partie = $2',
          [nouveauNiveau, partieId]
        );
        await client.query(
          'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 3',
          [10 * nouveauNiveau, partieId]
        );
        // +100 × nouveau_niveau Fans à chaque level-up
        await client.query(
          'UPDATE stock_ressource SET quantite = quantite + $1 WHERE id_partie = $2 AND id_ressource = 2',
          [100 * nouveauNiveau, partieId]
        );
      }

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

  getCoutAchat: (coutBase, quantiteActuelle) => {
    return Math.floor(coutBase * Math.pow(COUT_MULTIPLIER, quantiteActuelle));
  },

  getCoutUpgrade: (coutBase, niveauActuel) => {
    return Math.floor(coutBase * 5 * Math.pow(1.5, niveauActuel));
  },

  calculerNiveau,
  argentPourProchainNiveau,
};

module.exports = gameService;
module.exports.getBonusAmeliorations = getBonusAmeliorations;
