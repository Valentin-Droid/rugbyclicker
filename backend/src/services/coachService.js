const { Ollama } = require('ollama');
const pool = require('../models/db');
const gameService = require('./gameService');

const ollama = new Ollama({ host: 'http://localhost:11434' });
const MODEL = 'gemma3:1b';

/**
 * Construit un prompt structuré avec l'état complet de la partie
 * pour que le modèle puisse générer une recommandation pertinente.
 */
function buildPrompt(etatPartie) {
  const {
    nomClub,
    niveau,
    ressources,
    infrastructures,
    ameliorations,
    productionParSeconde,
  } = etatPartie;

  const argent = ressources.find(r => r.id_ressource === 1)?.quantite || 0;
  const fans = ressources.find(r => r.id_ressource === 2)?.quantite || 0;
  const prestige = ressources.find(r => r.id_ressource === 3)?.quantite || 0;

  // Infrastructures : celles déjà possédées et celles pas encore achetées
  const infrasDispo = infrastructures
    .map(i => {
      const cout = gameService.getCoutAchat(
        parseFloat(i.cout_base),
        i.quantite || 0
      );
      return `- ${i.nom} : ${i.quantite || 0} possédée(s), coût prochain achat = ${cout}€, production = ${i.production_base}€/s`;
    })
    .join('\n');

  // Améliorations : achetées ou non
  const amelsDispo = ameliorations
    .map(a => {
      const status = a.achete ? '✅ Déjà achetée' : `❌ Pas encore achetée — coût = ${a.cout}€`;
      return `- ${a.nom} : ${status} (effet : ${a.effet})`;
    })
    .join('\n');

  return `Tu es l'assistant coach d'un jeu de gestion de club de rugby appelé RugbyClicker.
Le joueur a besoin d'un conseil stratégique pour optimiser sa progression.

ÉTAT ACTUEL DU CLUB :
- Nom du club : ${nomClub}
- Niveau : ${niveau}
- Argent : ${argent}€
- Fans : ${fans}
- Prestige : ${prestige}
- Production passive : ${productionParSeconde}€/seconde

INFRASTRUCTURES DISPONIBLES :
${infrasDispo}

AMÉLIORATIONS DISPONIBLES :
${amelsDispo}

CONSIGNE : Analyse l'état du club et donne UNE SEULE recommandation d'action prioritaire.
Réponds dans ce format JSON exact (et rien d'autre) :
{
  "action": "Nom de l'action conseillée (ex: Acheter Centre d'entraînement, Améliorer Stade, Continuer à cliquer, etc.)",
  "raison": "Explication courte : pourquoi cette action est la meilleure maintenant",
  "impact": "Impact estimé à court terme (ex: +8€/s de production passive, doublement des revenus, etc.)"
}`;
}

const coachService = {
  /**
   * POST /parties/:id/coach
   * Analyse l'état de la partie et retourne une recommandation générée par Ollama.
   */
  getRecommendation: async (partieId) => {
    // Récupérer l'état complet de la partie
    const partieResult = await pool.query(
      'SELECT id_partie, nom_club, niveau FROM partie WHERE id_partie = $1',
      [partieId]
    );
    if (partieResult.rows.length === 0) {
      throw new Error('Partie introuvable');
    }
    const partie = partieResult.rows[0];

    const ressourcesResult = await pool.query(
      `SELECT r.id_ressource, r.nom, COALESCE(sr.quantite, 0) as quantite
       FROM ressource r
       LEFT JOIN stock_ressource sr ON sr.id_ressource = r.id_ressource AND sr.id_partie = $1`,
      [partieId]
    );

    const infrastructuresResult = await pool.query(
      `SELECT i.id_infrastructure, i.nom, i.cout_base, i.production_base,
              COALESCE(pi.quantite, 0) as quantite, COALESCE(pi.niveau, 1) as niveau
       FROM infrastructure i
       LEFT JOIN possession_infrastructure pi ON pi.id_infrastructure = i.id_infrastructure AND pi.id_partie = $1`,
      [partieId]
    );

    const ameliorationsResult = await pool.query(
      `SELECT a.id_amelioration, a.nom, a.cout, a.effet,
              CASE WHEN aa.id_partie IS NOT NULL THEN true ELSE false END as achete
       FROM amelioration a
       LEFT JOIN achat_amelioration aa ON aa.id_amelioration = a.id_amelioration AND aa.id_partie = $1`,
      [partieId]
    );

    const pps = await gameService.getProductionPerSecond(partieId);

    const etatPartie = {
      nomClub: partie.nom_club,
      niveau: partie.niveau,
      ressources: ressourcesResult.rows,
      infrastructures: infrastructuresResult.rows,
      ameliorations: ameliorationsResult.rows,
      productionParSeconde: pps,
    };

    const prompt = buildPrompt(etatPartie);

    try {
      const response = await ollama.chat({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        stream: false,
      });

      const contenu = response.message.content.trim();

      // Parser la réponse JSON
      try {
        const recommandation = JSON.parse(contenu);
        return recommandation;
      } catch {
        // Si le modèle ne retourne pas du JSON valide, on nettoie
        const cleaned = contenu.replace(/```json|```/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          return {
            action: 'Analyser manuellement',
            raison: contenu.substring(0, 200),
            impact: 'Voir la raison ci-dessus',
          };
        }
      }
    } catch (err) {
      console.error('[coachService] Erreur Ollama:', err.message);
      // Fallback si Ollama est injoignable
      return {
        action: 'Continuer à cliquer',
        raison: "L'assistant IA est temporairement indisponible. Continue à accumuler des ressources en attendant.",
        impact: 'Gains par clic immédiats',
      };
    }
  },
};

module.exports = coachService;
