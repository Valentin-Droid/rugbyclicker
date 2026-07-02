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

/**
 * Fallback algorithmique intelligent quand Ollama est injoignable.
 * Analyse l'état de la partie et produit une recommandaction prioritaire
 * basée sur le meilleur rapport qualité/prix (comme NextAction.jsx côté frontend).
 */
function generateFallbackRecommendation(etatPartie) {
  const argent = etatPartie.ressources.find(r => r.id_ressource === 1)?.quantite || 0;
  const productionParSeconde = etatPartie.productionParSeconde;

  // 1. Meilleure infrastructure à acheter (rapport production/coût)
  let bestBuy = null;
  for (const infra of etatPartie.infrastructures) {
    const cout = gameService.getCoutAchat(parseFloat(infra.cout_base), infra.quantite || 0);
    const prod = parseFloat(infra.production_base);
    const ratio = cout > 0 ? prod / cout : 0;
    const affordable = argent >= cout;
    if (!bestBuy || (affordable && !bestBuy.affordable) ||
        (affordable === bestBuy.affordable && ratio > bestBuy.ratio)) {
      bestBuy = { nom: infra.nom, cout, ratio, affordable, type: 'achat', prod };
    }
  }

  // 2. Meilleure upgrade pour les infrastructures possédées
  let bestUpgrade = null;
  for (const infra of etatPartie.infrastructures) {
    if ((infra.quantite || 0) === 0) continue;
    const cout = gameService.getCoutUpgrade(parseFloat(infra.cout_base), infra.niveau || 1);
    const gainProd = parseFloat(infra.production_base) * (infra.quantite || 0);
    const ratio = cout > 0 ? gainProd / cout : 0;
    const affordable = argent >= cout;
    if (!bestUpgrade || (affordable && !bestUpgrade.affordable) ||
        (affordable === bestUpgrade.affordable && ratio > bestUpgrade.ratio)) {
      bestUpgrade = { nom: infra.nom, cout, ratio, affordable, type: 'upgrade',
        niveauActuel: infra.niveau || 1, gainProd };
    }
  }

  // 3. Meilleure amélioration (la moins chère non achetée)
  let bestAmel = null;
  for (const amel of etatPartie.ameliorations) {
    if (amel.achete) continue;
    const cout = parseFloat(amel.cout);
    const affordable = argent >= cout;
    if (!bestAmel || (affordable && !bestAmel.affordable) ||
        (affordable === bestAmel.affordable && cout < bestAmel.cout)) {
      bestAmel = { nom: amel.nom, cout, ratio: 0, affordable, type: 'amelioration', effet: amel.effet };
    }
  }

  // Collecter et trier : abordables d'abord, puis meilleur ratio
  const candidates = [bestBuy, bestUpgrade, bestAmel].filter(Boolean);
  candidates.sort((a, b) => {
    if (a.affordable !== b.affordable) return a.affordable ? -1 : 1;
    if (a.type === 'amelioration' && b.type !== 'amelioration') return 1;
    if (b.type === 'amelioration' && a.type !== 'amelioration') return -1;
    return b.ratio - a.ratio;
  });

  if (candidates.length === 0) {
    return {
      action: 'Continuer à cliquer',
      raison: `Aucune action disponible. Production passive : ${productionParSeconde}€/s.`,
      impact: 'Accumule des ressources en cliquant',
    };
  }

  const selected = candidates[0];

  if (selected.affordable) {
    switch (selected.type) {
      case 'achat':
        return {
          action: `Acheter ${selected.nom}`,
          raison: `Tu as ${argent}€ et cette infrastructure coûte ${selected.cout}€. Meilleur rapport production/coût.`,
          impact: `+${selected.prod}€/s de production passive`,
        };
      case 'upgrade':
        return {
          action: `Améliorer ${selected.nom} (niveau ${selected.niveauActuel} → ${selected.niveauActuel + 1})`,
          raison: `Coût ${selected.cout}€. L'amélioration double la production de chaque unité de ${selected.nom}.`,
          impact: `+${selected.gainProd}€/s supplémentaires`,
        };
      case 'amelioration':
        return {
          action: `Acheter l'amélioration ${selected.nom}`,
          raison: `Coût ${selected.cout}€. Effet permanent : ${selected.effet}.`,
          impact: `Bonus : ${selected.effet}`,
        };
    }
  }

  // Rien d'abordable — indiquer la cible la plus proche
  const manque = selected.cout - argent;
  return {
    action: 'Continuer à cliquer',
    raison: `Aucune action abordable (${argent}€). Prochaine cible : ${selected.nom} à ${selected.cout}€ (manque ${manque}€).`,
    impact: `Économise jusqu'à ${selected.cout}€ pour débloquer ${selected.nom}`,
  };
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
      const error = new Error('Partie introuvable');
      error.statusCode = 404;
      throw error;
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
      let recommandation = null;
      try {
        recommandation = JSON.parse(contenu);
      } catch {
        const cleaned = contenu.replace(/```json|```/g, '').trim();
        try {
          recommandation = JSON.parse(cleaned);
        } catch {
          // fallback — on garde le texte brut
        }
      }

      // Valider que les 3 champs attendus sont présents
      if (recommandation && recommandation.action && recommandation.raison && recommandation.impact) {
        return recommandation;
      }

      // Si le JSON est incomplet ou absent, fallback algorithmique
      console.warn('[coachService] Réponse Ollama invalide ou incomplète, fallback algorithmique');
      return generateFallbackRecommendation(etatPartie);
    } catch (err) {
      console.error('[coachService] Erreur Ollama:', err.message);
      // Fallback algorithmique intelligent quand Ollama est injoignable
      return generateFallbackRecommendation(etatPartie);
    }
  },
};

module.exports = coachService;
