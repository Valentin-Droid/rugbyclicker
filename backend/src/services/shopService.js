const pool = require('../models/db');
const COUT_MULTIPLIER = 1.15;
const UPGRADE_COST_MULT = 1.5;

const shopService = {
  // Achete une infrastructure (quantite +1)
  acheterInfrastructure: async (partieId, infrastructureId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const infraResult = await client.query(
        'SELECT cout_base FROM infrastructure WHERE id_infrastructure = $1',
        [infrastructureId]
      );
      if (infraResult.rows.length === 0) {
        throw Object.assign(new Error('Infrastructure non trouvee'), { statusCode: 404 });
      }

      const possessionResult = await client.query(
        'SELECT quantite, niveau FROM possession_infrastructure WHERE id_partie = $1 AND id_infrastructure = $2',
        [partieId, infrastructureId]
      );
      const quantite = possessionResult.rows.length > 0 ? possessionResult.rows[0].quantite : 0;
      const niveau = possessionResult.rows.length > 0 ? possessionResult.rows[0].niveau : 1;
      const coutBase = parseFloat(infraResult.rows[0].cout_base);

      const cout = Math.floor(
        coutBase * Math.pow(COUT_MULTIPLIER, quantite) * Math.pow(UPGRADE_COST_MULT, niveau - 1)
      );

      const soldeResult = await client.query(
        'SELECT quantite FROM stock_ressource WHERE id_partie = $1 AND id_ressource = 1',
        [partieId]
      );
      const solde = parseFloat(soldeResult.rows[0].quantite);
      if (solde < cout) {
        throw Object.assign(
          new Error(`Fonds insuffisants. Cout : ${cout}EUR, disponible : ${solde}EUR`),
          { statusCode: 400 }
        );
      }

      await client.query(
        'UPDATE stock_ressource SET quantite = quantite - $1 WHERE id_partie = $2 AND id_ressource = 1',
        [cout, partieId]
      );

      if (possessionResult.rows.length > 0) {
        await client.query(
          'UPDATE possession_infrastructure SET quantite = quantite + 1 WHERE id_partie = $1 AND id_infrastructure = $2',
          [partieId, infrastructureId]
        );
      } else {
        await client.query(
          'INSERT INTO possession_infrastructure (id_partie, id_infrastructure, quantite, niveau) VALUES ($1, $2, 1, 1)',
          [partieId, infrastructureId]
        );
      }

      const nouveauSolde = await client.query(
        'SELECT quantite FROM stock_ressource WHERE id_partie = $1 AND id_ressource = 1',
        [partieId]
      );

      const nouvellePossession = await client.query(
        'SELECT quantite, niveau FROM possession_infrastructure WHERE id_partie = $1 AND id_infrastructure = $2',
        [partieId, infrastructureId]
      );

      await client.query('COMMIT');

      return {
        cout,
        nouveau_solde: parseFloat(nouveauSolde.rows[0].quantite),
        nouvelle_quantite: nouvellePossession.rows[0].quantite,
        niveau: nouvellePossession.rows[0].niveau,
        prochain_cout: Math.floor(
          coutBase *
            Math.pow(COUT_MULTIPLIER, nouvellePossession.rows[0].quantite) *
            Math.pow(UPGRADE_COST_MULT, nouvellePossession.rows[0].niveau - 1)
        ),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Ameliore le niveau d'une infrastructure (niveau +1)
  upgraderInfrastructure: async (partieId, infrastructureId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const infraResult = await client.query(
        'SELECT cout_base FROM infrastructure WHERE id_infrastructure = $1',
        [infrastructureId]
      );
      if (infraResult.rows.length === 0) {
        throw Object.assign(new Error('Infrastructure non trouvee'), { statusCode: 404 });
      }

      const possessionResult = await client.query(
        'SELECT quantite, niveau FROM possession_infrastructure WHERE id_partie = $1 AND id_infrastructure = $2',
        [partieId, infrastructureId]
      );
      if (possessionResult.rows.length === 0 || possessionResult.rows[0].quantite < 1) {
        throw Object.assign(
          new Error('Vous devez posseder cette infrastructure avant de l\'ameliorer'),
          { statusCode: 400 }
        );
      }

      const quantite = possessionResult.rows[0].quantite;
      const niveau = possessionResult.rows[0].niveau;
      const coutBase = parseFloat(infraResult.rows[0].cout_base);

      const cout = Math.floor(
        coutBase * Math.pow(COUT_MULTIPLIER, quantite) * Math.pow(UPGRADE_COST_MULT, niveau)
      );

      const soldeResult = await client.query(
        'SELECT quantite FROM stock_ressource WHERE id_partie = $1 AND id_ressource = 1',
        [partieId]
      );
      const solde = parseFloat(soldeResult.rows[0].quantite);
      if (solde < cout) {
        throw Object.assign(
          new Error(`Fonds insuffisants. Cout : ${cout}EUR, disponible : ${solde}EUR`),
          { statusCode: 400 }
        );
      }

      await client.query(
        'UPDATE stock_ressource SET quantite = quantite - $1 WHERE id_partie = $2 AND id_ressource = 1',
        [cout, partieId]
      );

      await client.query(
        'UPDATE possession_infrastructure SET niveau = niveau + 1 WHERE id_partie = $1 AND id_infrastructure = $2',
        [partieId, infrastructureId]
      );

      const nouveauSolde = await client.query(
        'SELECT quantite FROM stock_ressource WHERE id_partie = $1 AND id_ressource = 1',
        [partieId]
      );

      const nouvellePossession = await client.query(
        'SELECT quantite, niveau FROM possession_infrastructure WHERE id_partie = $1 AND id_infrastructure = $2',
        [partieId, infrastructureId]
      );

      await client.query('COMMIT');

      const nouveauNiveau = nouvellePossession.rows[0].niveau;
      return {
        cout,
        nouveau_solde: parseFloat(nouveauSolde.rows[0].quantite),
        quantite: nouvellePossession.rows[0].quantite,
        niveau: nouveauNiveau,
        prochain_cout_upgrade: Math.floor(
          coutBase *
            Math.pow(COUT_MULTIPLIER, quantite) *
            Math.pow(UPGRADE_COST_MULT, nouveauNiveau)
        ),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Achete une amelioration (une seule fois possible)
  acheterAmelioration: async (partieId, ameliorationId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const amelResult = await client.query(
        'SELECT nom, cout FROM amelioration WHERE id_amelioration = $1',
        [ameliorationId]
      );
      if (amelResult.rows.length === 0) {
        throw Object.assign(new Error('Amelioration non trouvee'), { statusCode: 404 });
      }

      const dejaAchete = await client.query(
        'SELECT 1 FROM achat_amelioration WHERE id_partie = $1 AND id_amelioration = $2',
        [partieId, ameliorationId]
      );
      if (dejaAchete.rows.length > 0) {
        throw Object.assign(new Error('Cette amelioration a deja ete achetee'), { statusCode: 409 });
      }

      const cout = parseFloat(amelResult.rows[0].cout);
      const soldeResult = await client.query(
        'SELECT quantite FROM stock_ressource WHERE id_partie = $1 AND id_ressource = 1',
        [partieId]
      );
      if (parseFloat(soldeResult.rows[0].quantite) < cout) {
        throw Object.assign(
          new Error(`Fonds insuffisants. Cout : ${cout}EUR`),
          { statusCode: 400 }
        );
      }

      await client.query(
        'UPDATE stock_ressource SET quantite = quantite - $1 WHERE id_partie = $2 AND id_ressource = 1',
        [cout, partieId]
      );

      const achatResult = await client.query(
        'INSERT INTO achat_amelioration (id_partie, id_amelioration) VALUES ($1, $2) RETURNING date_achat',
        [partieId, ameliorationId]
      );

      const nouveauSolde = await client.query(
        'SELECT quantite FROM stock_ressource WHERE id_partie = $1 AND id_ressource = 1',
        [partieId]
      );

      await client.query('COMMIT');

      return {
        cout,
        nouveau_solde: parseFloat(nouveauSolde.rows[0].quantite),
        date_achat: achatResult.rows[0].date_achat,
        nom: amelResult.rows[0].nom,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = shopService;
