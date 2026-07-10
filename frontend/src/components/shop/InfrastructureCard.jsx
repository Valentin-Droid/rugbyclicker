import { useState, useRef, useEffect } from "react";
import { useGame } from "../../hooks/useGame";
import { formatNumber } from "../../utils/format";
import { getCoutAchat, getCoutUpgrade } from "../../utils/costs";

const ICONS = {
	Terrain: "🏟️",
	Stade: "🏟️",
	Boutique: "🛍️",
	"Centre de formation": "🎓",
	Infirmerie: "🏥",
	"Salle de musculation": "💪",
	"Centre media": "📺",
	"Espace VIP": "👑",
};

function getIcon(nom) {
	for (const [key, icon] of Object.entries(ICONS)) {
		if (nom.includes(key)) return icon;
	}
	return "🏗️";
}

function InfrastructureCard({
	infrastructure,
	isCheapest,
	isBarelyAffordable,
}) {
	const { ressources, acheterInfrastructure, upgraderInfrastructure } =
		useGame();
	const [buyLoading, setBuyLoading] = useState(false);
	const [upgradeLoading, setUpgradeLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [buySuccess, setBuySuccess] = useState(false);
	const buySuccessTimer = useRef(null);
	const [showTooltip, setShowTooltip] = useState(false);
	const [hoverPreview, setHoverPreview] = useState(false);
	const cardRef = useRef(null);
	const iconRef = useRef(null);

	const argent = parseFloat(
		ressources.find((r) => r.id_ressource === 1)?.quantite || 0,
	);
	const quantite = infrastructure.quantite || 0;
	const niveau = infrastructure.niveau || 1;
	const coutBase = parseFloat(infrastructure.cout_base);
	const productionBase = parseFloat(infrastructure.production_base);

	const coutAchat = getCoutAchat(coutBase, quantite);
	const coutUpgrade = getCoutUpgrade(coutBase, niveau);

	const productionActuelle = quantite * productionBase * niveau;
	const productionApresAchat = (quantite + 1) * productionBase * niveau;
	const productionApresUpgrade = quantite * productionBase * (niveau + 1);

	const canBuy = argent >= coutAchat;
	const canUpgrade = quantite >= 1 && argent >= coutUpgrade;
	const manqueAchat = Math.max(0, coutAchat - argent);

	const icon = getIcon(infrastructure.nom);

	const handleBuy = async () => {
		setBuyLoading(true);
		setErrorMsg("");
		try {
			await acheterInfrastructure(infrastructure.id_infrastructure);
			setBuySuccess(true);
			if (iconRef.current) {
				iconRef.current.classList.add("infra-card__icon--bounce");
				setTimeout(() => {
					if (iconRef.current)
						iconRef.current.classList.remove("infra-card__icon--bounce");
				}, 500);
			}
			if (buySuccessTimer.current) clearTimeout(buySuccessTimer.current);
			buySuccessTimer.current = setTimeout(() => setBuySuccess(false), 1000);
		} catch (err) {
			setErrorMsg(err.response?.data?.error || "Erreur lors de l'achat");
		} finally {
			setBuyLoading(false);
		}
	};

	const handleUpgrade = async () => {
		setUpgradeLoading(true);
		setErrorMsg("");
		try {
			await upgraderInfrastructure(infrastructure.id_infrastructure);
			if (iconRef.current) {
				iconRef.current.classList.add("infra-card__icon--bounce");
				setTimeout(() => {
					if (iconRef.current)
						iconRef.current.classList.remove("infra-card__icon--bounce");
				}, 500);
			}
		} catch (err) {
			setErrorMsg(err.response?.data?.error || "Erreur lors de l'amelioration");
		} finally {
			setUpgradeLoading(false);
		}
	};

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (buySuccessTimer.current) clearTimeout(buySuccessTimer.current);
		};
	}, []);
	const tooltipLines = [];
	if (!canBuy) {
		tooltipLines.push(`Coût : ${formatNumber(coutAchat)}€`);
		tooltipLines.push(`Tu as : ${formatNumber(argent)}€`);
		tooltipLines.push(`Il te manque : ${formatNumber(manqueAchat)}€`);
	} else {
		tooltipLines.push(
			`Production actuelle : ${formatNumber(productionActuelle)}/s`,
		);
		tooltipLines.push(`Après achat : ${formatNumber(productionApresAchat)}/s`);
	}

	return (
		<div
			ref={cardRef}
			className={`infra-card${buySuccess ? " infra-card--purchased" : ""}`}
		>
			<div className="infra-card__header">
				<h4 className="infra-card__name">
					<span ref={iconRef} className="infra-card__icon">
						{icon}
					</span>
					{infrastructure.nom}
				</h4>
				{infrastructure.description && (
					<p className="infra-card__desc">{infrastructure.description}</p>
				)}
				{isCheapest && quantite === 0 && (
					<span className="infra-card__badge infra-card__badge--accessible">
						✅ Accessible
					</span>
				)}
				{isBarelyAffordable && quantite === 0 && !canBuy && (
					<span className="infra-card__badge infra-card__badge--soon">
						🟠 Bientôt
					</span>
				)}
			</div>

			<div className="infra-card__stats">
				<span className="infra-card__stat">
					Possédé : {quantite} × Niv.{niveau}
				</span>
				<span className="infra-card__stat">
					Production : {formatNumber(productionActuelle)}/s
				</span>
			</div>

			{/* Hover preview for buy */}
			{hoverPreview && quantite === 0 && (
				<p className="infra-card__preview">
					⚠️ Aucune production actuellement — achète pour débloquer !
				</p>
			)}
			{hoverPreview && quantite > 0 && (
				<p className="infra-card__preview">
					Production passera de {formatNumber(productionActuelle)}/s à{" "}
					{formatNumber(productionApresAchat)}/s
				</p>
			)}

			<div className="infra-card__actions">
				<div
					className="tooltip-wrapper"
					onMouseEnter={() => setShowTooltip(true)}
					onMouseLeave={() => setShowTooltip(false)}
				>
					<button
						className="infra-card__btn infra-card__buy"
						onClick={handleBuy}
						disabled={!canBuy || buyLoading}
						onMouseEnter={() => setHoverPreview(true)}
						onMouseLeave={() => setHoverPreview(false)}
					>
						{buyLoading
							? "Achat..."
							: buySuccess
								? "✅ Acheté !"
								: `Acheter (${formatNumber(coutAchat)}€)`}
					</button>
					{showTooltip && (
						<div className="tooltip">
							{tooltipLines.map((line, i) => (
								<div key={i}>{line}</div>
							))}
						</div>
					)}
				</div>

				<button
					className="infra-card__btn infra-card__upgrade"
					onClick={handleUpgrade}
					disabled={!canUpgrade || upgradeLoading}
					title={
						quantite === 0
							? "Achète d'abord cette infrastructure"
							: !canUpgrade
								? "Pas assez d'argent"
								: ""
					}
				>
					{upgradeLoading
						? "Upgrade..."
						: `Upgrader (${formatNumber(coutUpgrade)}€)`}
				</button>
			</div>

			{/* Upgrade preview */}
			{quantite >= 1 && (
				<p className="infra-card__upgrade-preview">
					Niv.{niveau} → Niv.{niveau + 1} : Prod. ×1.5 (
					{formatNumber(productionActuelle)}/s →{" "}
					{formatNumber(productionApresUpgrade)}/s)
				</p>
			)}

			{errorMsg && <p className="shop-error">{errorMsg}</p>}
		</div>
	);
}

export default InfrastructureCard;
