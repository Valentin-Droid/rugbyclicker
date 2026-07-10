/**
 * Calculs de coûts — RugbyClicker
 * Formules synchronisées avec backend/src/services/gameService.js
 *
 * COÛT D'ACHAT : coutBase × 1.15^quantité
 * COÛT D'UPGRADE : coutBase × 5 × 1.5^niveau
 */

const COUT_MULTIPLIER = 1.15;
const UPGRADE_MULTIPLIER = 1.5;

/**
 * Calcule le coût d'achat du prochain exemplaire d'une infrastructure.
 * @param {number} coutBase - Coût de base de l'infrastructure
 * @param {number} quantite - Quantité déjà possédée
 * @returns {number} Coût arrondi à l'entier inférieur
 */
export function getCoutAchat(coutBase, quantite) {
	return Math.floor(coutBase * COUT_MULTIPLIER ** quantite);
}

/**
 * Calcule le coût d'amélioration (upgrade) d'une infrastructure.
 * @param {number} coutBase - Coût de base de l'infrastructure
 * @param {number} niveau - Niveau actuel
 * @returns {number} Coût arrondi à l'entier inférieur
 */
export function getCoutUpgrade(coutBase, niveau) {
	return Math.floor(coutBase * 5 * UPGRADE_MULTIPLIER ** niveau);
}
