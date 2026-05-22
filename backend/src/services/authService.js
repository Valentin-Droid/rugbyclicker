const bcrypt = require('bcrypt');
const pool = require('../models/db');

const authService = {
  register: async (pseudo, email, motDePasse) => {
    const existing = await pool.query(
      'SELECT id_joueur FROM joueur WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      const error = new Error('Cet email est déjà utilisé');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const result = await pool.query(
      'INSERT INTO joueur (pseudo, email, mot_de_passe) VALUES ($1, $2, $3) RETURNING id_joueur, pseudo, email, date_creation',
      [pseudo, email, hashedPassword]
    );

    return result.rows[0];
  },

  login: async (email, motDePasse) => {
    const result = await pool.query(
      'SELECT id_joueur, pseudo, email, mot_de_passe, date_creation FROM joueur WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      throw error;
    }

    const joueur = result.rows[0];
    const isValid = await bcrypt.compare(motDePasse, joueur.mot_de_passe);

    if (!isValid) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      throw error;
    }

    const { mot_de_passe, ...joueurSansMdp } = joueur;
    return joueurSansMdp;
  },

  getJoueurById: async (id) => {
    const result = await pool.query(
      'SELECT id_joueur, pseudo, email, date_creation FROM joueur WHERE id_joueur = $1',
      [id]
    );

    if (result.rows.length === 0) {
      const error = new Error('Joueur non trouvé');
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  },
};

module.exports = authService;
