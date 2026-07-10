/**
 * Utilitaires de formatage partagés — RugbyClicker
 * Source unique pour formater les nombres, dates, et coûts.
 */

/**
 * Formate un nombre en notation compacte (K, M).
 * @example formatNumber(1500) → "1.5K"
 * @example formatNumber(2500000) → "2.5M"
 */
export function formatNumber(value) {
	const num = parseFloat(value);
	if (Number.isNaN(num)) return "0";
	if (num >= 1_000_000) {
		return (num / 1_000_000).toFixed(1) + "M";
	}
	if (num >= 1_000) {
		return (num / 1_000).toFixed(1) + "K";
	}
	return Math.floor(num).toString();
}

/**
 * Formate une production (€/s) avec notation compacte pour les grandes valeurs.
 * @example formatProduction(12.5) → "12.5/s"
 * @example formatProduction(2500) → "2.5K/s"
 */
export function formatProduction(value) {
	if (value >= 1000) return formatNumber(value) + "/s";
	if (value >= 100) return Math.floor(value) + "/s";
	return value.toFixed(1) + "/s";
}

/**
 * Formate une date ISO en français (JJ/MM/AAAA HH:MM).
 */
export function formatDate(dateStr) {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Formate un montant de prestige (notation compacte).
 */
export function formatPrestige(value) {
	return formatNumber(value);
}
