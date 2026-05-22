const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

// Migration automatique au démarrage : augmente la précision NUMERIC pour les idle games
const runMigrations = async () => {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE stock_ressource ALTER COLUMN quantite TYPE NUMERIC(24,2)`
    );
    await client.query(
      `ALTER TABLE partie ALTER COLUMN total_argent_genere TYPE NUMERIC(24,2)`
    );
    console.log('✅ Migrations exécutées avec succès');
  } catch (err) {
    // Si les colonnes sont déjà en NUMERIC(24,2), PostgreSQL ne lève pas d'erreur.
    // On loggue uniquement les vraies erreurs.
    if (err.code !== '42710' && err.code !== '42P07') {
      console.error('❌ Erreur de migration:', err.message);
    }
  } finally {
    client.release();
  }
};

module.exports = pool;
module.exports.runMigrations = runMigrations;
