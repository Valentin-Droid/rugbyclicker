import { useRef, useEffect, useState } from "react";
import { useGame } from "../../hooks/useGame";
import { formatNumber } from "../../utils/format";

/**
 * Formules de niveau — DOIVENT être synchronisées avec backend/src/services/gameService.js
 * @see backend/src/services/gameService.js #calculerNiveau #argentPourProchainNiveau
 */
function argentPourNiveau(niveau) {
	return Math.floor(100 * (2 ** (niveau - 1) - 1));
}

function ClubProgression() {
	const { partie } = useGame();
	const [showLevelUp, setShowLevelUp] = useState(false);
	const [levelUpData, setLevelUpData] = useState(null);
	const [fadeOut, setFadeOut] = useState(false);
	const prevNiveau = useRef(null);

	if (!partie) return null;

	const totalArgent = partie.total_argent_genere || 0;
	// Le niveau est la source de vérité — maintenu par le backend
	const niveauActuel = partie.niveau || 1;
	const argentNiveauActuel = argentPourNiveau(niveauActuel);
	const argentNiveauSuivant = argentPourNiveau(niveauActuel + 1);

	const progressionArgent = totalArgent - argentNiveauActuel;
	const argentNecessaire = argentNiveauSuivant - argentNiveauActuel;
	const pourcentage =
		argentNecessaire > 0
			? Math.min(100, (progressionArgent / argentNecessaire) * 100)
			: 100;

	const reste = argentNecessaire - progressionArgent;

	// Level-up detection
	useEffect(() => {
		if (prevNiveau.current !== null && niveauActuel > prevNiveau.current) {
			setLevelUpData({ niveau: niveauActuel });
			setShowLevelUp(true);
			setFadeOut(false);

			const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
			const hideTimer = setTimeout(() => {
				setShowLevelUp(false);
				setLevelUpData(null);
			}, 2000);

			return () => {
				clearTimeout(fadeTimer);
				clearTimeout(hideTimer);
			};
		}
		prevNiveau.current = niveauActuel;
	}, [niveauActuel]);

	return (
		<>
			<div className="progression-container">
				<div className="progression-labels">
					<span className="progression-niveau">Niveau {niveauActuel}</span>
					<span className="progression-percent">
						{Math.round(pourcentage)}%
					</span>
					<span className="progression-niveau">Niveau {niveauActuel + 1}</span>
				</div>
				<div className="progression-bar">
					<div
						className="progression-fill"
						style={{ width: `${pourcentage}%` }}
					/>
					<span className="progression-tooltip">
						Prochain niveau : {formatNumber(reste > 0 ? reste : 0)}€
					</span>
				</div>
				<span className="progression-text">
					{reste > 0
						? `Prochain niveau dans ${formatNumber(reste)}€`
						: "Niveau max atteint"}
				</span>
			</div>

			{/* Level-up overlay */}
			{showLevelUp && levelUpData && (
				<div className={`levelup-overlay${fadeOut ? " fade-out" : ""}`}>
					<div className="levelup-title">
						🎉 NIVEAU {levelUpData.niveau} ATTEINT !
					</div>
					<div className="levelup-prestige">
						+{10 * levelUpData.niveau} ⭐ Prestige !
					</div>
				</div>
			)}
		</>
	);
}

export default ClubProgression;
