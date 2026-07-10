import { useState, useCallback, useMemo } from "react";
import { useGame } from "../../hooks/useGame";
import gameService from "../../services/gameService";
import {
	BrainIcon,
	BotIcon,
	TargetIcon,
	MessageIcon,
	ChartUpIcon,
	RefreshIcon,
	CartIcon,
} from "../common/GameIcons";

/* ─────────────────────────────────────────────────────
   Smart action parser : extrait le type, l'objet
   et le coût depuis la recommandation de l'IA
   ───────────────────────────────────────────────────── */
function parseAction(actionText) {
	if (!actionText) return { type: "unknown", label: actionText };

	// "Acheter X (cout)" ou "Acheter X"
	const buyMatch = actionText.match(
		/^Acheter\s+(?:l'|le\s+|la\s+|les\s+)?(.+?)(?:\s*\(([\d.,]+\s*€?)\))?$/,
	);
	if (buyMatch) {
		return {
			type: "buy",
			item: buyMatch[1].trim(),
			cost: buyMatch[2]?.replace(/\s?€/, "")?.trim() || null,
			label: actionText,
		};
	}

	// "Améliorer X (niveau A → B)" ou "Améliorer X"
	const upgradeMatch = actionText.match(
		/^Améliorer\s+(?:l'|le\s+|la\s+|les\s+)?(.+?)(?:\s*(\s*\(.+\)))?$/,
	);
	if (upgradeMatch) {
		const details = upgradeMatch[2]?.replace(/[()]/g, "").trim() || null;
		return {
			type: "upgrade",
			item: upgradeMatch[1].trim(),
			detail: details,
			label: actionText,
		};
	}

	// "Acheter l'amélioration X"
	const amelMatch = actionText.match(
		/^Acheter l'amélioration\s+(.+?)(?:\s*\(([\d.,]+\s*€?)\))?$/,
	);
	if (amelMatch) {
		return {
			type: "amelioration",
			item: amelMatch[1].trim(),
			cost: amelMatch[2]?.replace(/\s?€/, "")?.trim() || null,
			label: actionText,
		};
	}

	// "Continuer à cliquer"
	if (/continuer\s+[àa]\s+cliquer/i.test(actionText)) {
		return { type: "click", label: actionText };
	}

	return { type: "unknown", label: actionText };
}

/* ─────────────────────────────────────────────────────
   Helpers d'affichage
   ───────────────────────────────────────────────────── */
function formatCost(cost) {
	const num = parseFloat(cost);
	if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M €";
	if (num >= 1_000) return (num / 1_000).toFixed(1) + "K €";
	return Math.floor(num).toLocaleString() + " €";
}

const TYPE_CONFIG = {
	buy: { icon: "🏗️", badge: "Achat", color: "#4ade80" },
	upgrade: { icon: "⚡", badge: "Amélioration", color: "#facc15" },
	amelioration: { icon: "🔬", badge: "Recherche", color: "#a78bfa" },
	click: { icon: "👆", badge: "Patience", color: "#60a5fa" },
	unknown: { icon: "🎯", badge: "Conseil", color: "#c9a84c" },
};

/* ─────────────────────────────────────────────────────
   CoachAssistant
   ───────────────────────────────────────────────────── */
function CoachAssistant() {
	const { partie, loading } = useGame();
	const [recommandation, setRecommandation] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showResult, setShowResult] = useState(false);

	const parsed = useMemo(() => {
		if (!recommandation) return null;
		return parseAction(recommandation.action);
	}, [recommandation]);

	const typeCfg = parsed ? TYPE_CONFIG[parsed.type] : TYPE_CONFIG.unknown;

	const askCoach = useCallback(async () => {
		if (!partie?.id_partie) return;
		setIsLoading(true);
		setError(null);
		setShowResult(false);
		try {
			const result = await gameService.getCoachRecommendation(partie.id_partie);
			setRecommandation(result.data || result);
			// Déclenche l'animation d'entrée après un court délai
			setTimeout(() => setShowResult(true), 50);
		} catch (err) {
			setError("L'assistant IA est momentanément indisponible.");
			console.error("[CoachAssistant] Erreur:", err);
		} finally {
			setIsLoading(false);
		}
	}, [partie]);

	const scrollToShop = () => {
		const shop = document.querySelector(".shop-panel");
		if (shop) {
			shop.scrollIntoView({ behavior: "smooth", block: "start" });
			shop.classList.add("shop-panel--highlight");
			setTimeout(() => shop.classList.remove("shop-panel--highlight"), 2000);
		}
	};

	if (loading && !partie) return null;

	return (
		<div className="coach-assistant">
			{/* ── Header ─────────────────────────────── */}
			<div className="coach-assistant__header">
				<span className="coach-assistant__icon">
					<BrainIcon size={26} />
				</span>
				<h3 className="coach-assistant__title">Assistant Coach IA</h3>
				<span className="coach-assistant__badge">
					<span className="coach-assistant__badge-dot" />
					Gemma 3
				</span>
			</div>

			{/* ── Ask button ─────────────────────────── */}
			{!recommandation && !isLoading && (
				<button
					className="coach-assistant__ask-btn"
					onClick={askCoach}
					disabled={!partie}
				>
					<span className="coach-assistant__ask-emoji">
						<BotIcon size={20} />
					</span>
					Quelle est la meilleure action maintenant ?
				</button>
			)}

			{/* ── Loading state ──────────────────────── */}
			{isLoading && (
				<div className="coach-assistant__loading">
					<div className="coach-assistant__spinner" />
					<div className="coach-assistant__loading-text">
						<span>L&apos;assistant analyse ton club</span>
						<span className="coach-assistant__loading-dots" />
					</div>
				</div>
			)}

			{/* ── Error state ────────────────────────── */}
			{error && (
				<div className="coach-assistant__error">
					<span>⚠️ {error}</span>
					<button onClick={askCoach}>Réessayer</button>
				</div>
			)}

			{/* ── Result ─────────────────────────────── */}
			{recommandation && !isLoading && (
				<div
					className={`coach-assistant__result${showResult ? " coach-assistant__result--visible" : ""}`}
				>
					{/* Action card */}
					<div
						className={`coach-card coach-card--action coach-card--${parsed?.type || "unknown"}`}
					>
						<div
							className="coach-card__icon"
							style={{ background: typeCfg.color }}
						>
							<TargetIcon size={18} color="#000" />
						</div>
						<div className="coach-card__body">
							<div className="coach-card__badge-row">
								<span
									className="coach-card__type-badge"
									style={{ background: typeCfg.color }}
								>
									{typeCfg.badge}
								</span>
							</div>
							<p className="coach-card__title">
								{parsed?.type === "buy" && (
									<>
										Achète <strong>{parsed.item}</strong>
									</>
								)}
								{parsed?.type === "upgrade" && (
									<>
										Améliore <strong>{parsed.item}</strong>
										{parsed.detail && (
											<span className="coach-card__detail">
												{" "}
												({parsed.detail})
											</span>
										)}
									</>
								)}
								{parsed?.type === "amelioration" && (
									<>
										Débloque <strong>{parsed.item}</strong>
									</>
								)}
								{(parsed?.type === "click" || parsed?.type === "unknown") && (
									<strong>{parsed.label}</strong>
								)}
							</p>
							{parsed?.cost && (
								<span className="coach-card__cost">
									{formatCost(parsed.cost)}
								</span>
							)}
						</div>
						{parsed?.type === "buy" ||
						parsed?.type === "upgrade" ||
						parsed?.type === "amelioration" ? (
							<button
								className="coach-card__shop-btn"
								onClick={scrollToShop}
								aria-label="Aller à la boutique"
							>
								<CartIcon size={16} />
							</button>
						) : null}
					</div>

					{/* Reason card */}
					<div className="coach-card coach-card--reason">
						<div className="coach-card__quote-icon">
							<MessageIcon size={18} />
						</div>
						<p className="coach-card__text">{recommandation.raison}</p>
					</div>

					{/* Impact card */}
					<div className="coach-card coach-card--impact">
						<div className="coach-card__impact-icon">
							<ChartUpIcon size={18} />
						</div>
						<p className="coach-card__impact-text">
							{recommandation.impact.replace(/^Impact\s*:\s*/i, "")}
						</p>
					</div>

					{/* Refresh button */}
					<button className="coach-assistant__refresh-btn" onClick={askCoach}>
						<RefreshIcon
							size={14}
							style={{
								display: "inline",
								marginRight: "0.35rem",
								verticalAlign: "-2px",
							}}
						/>
						Demander un autre conseil
					</button>
				</div>
			)}
		</div>
	);
}

export default CoachAssistant;
