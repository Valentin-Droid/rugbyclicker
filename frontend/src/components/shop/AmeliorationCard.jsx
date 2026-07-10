import { useState } from "react";
import { useGame } from "../../hooks/useGame";
import { formatNumber, formatDate } from "../../utils/format";

/**
 * Traduit un effet d'amélioration (ex: "multiplicateur_production:1.5") en label lisible.
 */
function traduireEffet(effet) {
	const [type, valeur] = effet.split(":");
	const mult = parseFloat(valeur);
	if (type === "multiplicateur_production") {
		return `Production ×${mult}`;
	}
	if (type === "multiplicateur_clic") {
		return `Clic ×${mult}`;
	}
	if (type === "multiplicateur_global") {
		return `Global ×${mult}`;
	}
	return effet;
}

function AmeliorationCard({ amelioration }) {
	const { ressources, acheterAmelioration } = useGame();
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const argent = parseFloat(
		ressources.find((r) => r.id_ressource === 1)?.quantite || 0,
	);
	const cout = parseFloat(amelioration.cout);
	const dejaAchete = amelioration.achete;
	const canBuy = argent >= cout && !dejaAchete;

	const handleBuy = async () => {
		setLoading(true);
		setErrorMsg("");
		try {
			await acheterAmelioration(amelioration.id_amelioration);
		} catch (err) {
			setErrorMsg(err.response?.data?.error || "Erreur lors de l'achat");
		} finally {
			setLoading(false);
		}
	};

	// Parse effect for before/after display
	const effetLabel = traduireEffet(amelioration.effet);

	return (
		<div className={`amel-card${dejaAchete ? " amel-card--owned" : ""}`}>
			<div className="amel-card__header">
				<h4 className="amel-card__name">
					{dejaAchete && "✅ "}
					{amelioration.nom}
				</h4>
				<span
					className={`amel-card__effet${dejaAchete ? " amel-card__effet--applied" : ""}`}
				>
					{effetLabel}
				</span>
			</div>

			{/* Before/after preview when not owned */}
			{!dejaAchete && canBuy && (
				<p className="amel-card__avap">
					Effet : {effetLabel} <strong>(actuel ×1.0)</strong>
				</p>
			)}

			{!dejaAchete && !canBuy && (
				<p className="amel-card__avap">
					{formatNumber(cout - argent)}€ manquants pour {effetLabel}
				</p>
			)}

			<div className="amel-card__action">
				{dejaAchete ? (
					<span className="amel-card__badge">
						✅ Acquis
						{amelioration.date_achat && (
							<span className="amel-card__date">
								{formatDate(amelioration.date_achat)}
							</span>
						)}
					</span>
				) : (
					<button
						className="infra-card__btn infra-card__buy"
						onClick={handleBuy}
						disabled={!canBuy || loading}
						title={!canBuy ? "Pas assez d'argent" : ""}
					>
						{loading ? "Achat..." : `Acheter (${formatNumber(cout)}€)`}
					</button>
				)}
			</div>

			{errorMsg && <p className="shop-error">{errorMsg}</p>}
		</div>
	);
}

export default AmeliorationCard;
