import { useGame } from "../../hooks/useGame";
import { FlaskIcon, ConstructionIcon } from "../common/GameIcons";
import { formatNumber } from "../../utils/format";
import { getCoutAchat } from "../../utils/costs";

function NextAction() {
	const { ressources, ameliorations, infrastructures } = useGame();

	const argent = parseFloat(
		ressources.find((r) => r.id_ressource === 1)?.quantite || 0,
	);

	// 1. Find cheapest affordable improvement not yet bought
	const affordableAmel = ameliorations
		.filter((a) => !a.achete && argent >= parseFloat(a.cout))
		.sort((a, b) => parseFloat(a.cout) - parseFloat(b.cout));

	// 2. Find cheapest affordable infrastructure not yet bought
	const affordableInfra = infrastructures
		.filter((i) => {
			const cout = getCoutAchat(parseFloat(i.cout_base), i.quantite || 0);
			return argent >= cout;
		})
		.sort((a, b) => {
			const costA = getCoutAchat(parseFloat(a.cout_base), a.quantite || 0);
			const costB = getCoutAchat(parseFloat(b.cout_base), b.quantite || 0);
			return costA - costB;
		});

	// 3. If nothing affordable, find the cheapest thing overall and show gap
	const allCosts = [];
	ameliorations.forEach((a) => {
		if (!a.achete) {
			allCosts.push({
				name: a.nom,
				cost: parseFloat(a.cout),
				type: "amélioration",
			});
		}
	});
	infrastructures.forEach((i) => {
		allCosts.push({
			name: i.nom,
			cost: getCoutAchat(parseFloat(i.cout_base), i.quantite || 0),
			type: "infrastructure",
		});
	});
	allCosts.sort((a, b) => a.cost - b.cost);

	if (affordableAmel.length > 0) {
		const amel = affordableAmel[0];
		return (
			<div className="next-action">
				<span className="next-action__icon">
					<FlaskIcon size={18} />
				</span>
				<span className="next-action__text">
					Achète l&apos;amélioration <strong>{amel.nom}</strong> pour booster ta
					progression !
				</span>
				<span className="next-action__cost">{formatNumber(amel.cout)}€</span>
			</div>
		);
	}

	if (affordableInfra.length > 0) {
		const infra = affordableInfra[0];
		return (
			<div className="next-action">
				<span className="next-action__icon">
					<ConstructionIcon size={18} />
				</span>
				<span className="next-action__text">
					Achète <strong>{infra.nom}</strong> pour générer des revenus passifs !
				</span>
				<span className="next-action__cost">
					{formatNumber(
						getCoutAchat(parseFloat(infra.cout_base), infra.quantite || 0),
					)}
					€
				</span>
			</div>
		);
	}

	if (allCosts.length > 0) {
		const cheapest = allCosts[0];
		const diff = Math.max(0, cheapest.cost - argent);
		return (
			<div className="next-action">
				<span className="next-action__icon">🏉</span>
				<span className="next-action__text">
					Continue de cliquer ! Encore <strong>{formatNumber(diff)}€</strong>{" "}
					nécessaires pour <strong>{cheapest.name}</strong>
				</span>
				<span className="next-action__cost">
					Objectif : {formatNumber(cheapest.cost)}€
				</span>
			</div>
		);
	}

	// Fallback: nothing to buy at all (shouldn't happen)
	return (
		<div className="next-action">
			<span className="next-action__icon">🏆</span>
			<span className="next-action__text">
				Félicitations ! Tu as tout débloqué. Continue à faire grandir ton club !
			</span>
		</div>
	);
}

export default NextAction;
