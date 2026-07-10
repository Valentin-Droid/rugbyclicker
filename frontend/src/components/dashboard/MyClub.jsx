import { useRef, useEffect, useState, useMemo } from "react";
import { useGame } from "../../hooks/useGame";
import { formatProduction } from "../../utils/format";

const INFRA_ICONS = {
	"Salle de musculation": "💪",
	"Salle de muscu": "💪",
	Infirmerie: "🏥",
	Boutique: "🛍️",
	Terrain: "🏟️",
	"Centre de formation": "🏫",
	Stade: "🏟️",
	"Bureau de recrutement": "📋",
	"Espace partenaires": "🤝",
	Académie: "🎓",
};

function getIcon(nom) {
	if (!nom) return "📦";
	for (const [key, icon] of Object.entries(INFRA_ICONS)) {
		if (nom.toLowerCase().includes(key.toLowerCase())) return icon;
	}
	return "📦";
}

function MyClub() {
	const { infrastructures } = useGame();

	const [flashIds, setFlashIds] = useState(new Set());
	const prevMap = useRef({});
	const flashTimers = useRef({});

	/* ── Sort owned (qty > 0) by total production desc ── */
	const ownedInfras = useMemo(() => {
		const withProd = infrastructures
			.filter((i) => (i.quantite || 0) > 0)
			.map((i) => ({
				...i,
				totalProduction:
					(i.quantite || 0) * (i.production_base || 0) * (i.niveau || 1),
			}));
		withProd.sort((a, b) => b.totalProduction - a.totalProduction);
		return withProd;
	}, [infrastructures]);

	/* ── Detect new purchases → flash ────────────────── */
	useEffect(() => {
		const pm = prevMap.current;
		const newFlash = new Set();

		infrastructures.forEach((infra) => {
			const prev = pm[infra.id_infrastructure];
			const curr = infra.quantite || 0;
			const prevLvl = pm[`${infra.id_infrastructure}_lvl`];
			const currLvl = infra.niveau || 1;

			if (prev !== undefined && curr > prev) {
				newFlash.add(infra.id_infrastructure);
			}
			if (prevLvl !== undefined && currLvl > prevLvl) {
				newFlash.add(infra.id_infrastructure);
			}

			pm[infra.id_infrastructure] = curr;
			pm[`${infra.id_infrastructure}_lvl`] = currLvl;
		});

		if (newFlash.size > 0) {
			setFlashIds(newFlash);
			newFlash.forEach((id) => {
				if (flashTimers.current[id]) clearTimeout(flashTimers.current[id]);
				flashTimers.current[id] = setTimeout(() => {
					setFlashIds((prev) => {
						const next = new Set(prev);
						next.delete(id);
						return next;
					});
				}, 2000);
			});
		}

		return () => {
			Object.values(flashTimers.current).forEach(clearTimeout);
		};
	}, [infrastructures]);

	/* ── Empty state ──────────────────────────────────── */
	if (ownedInfras.length === 0) {
		return (
			<div className="my-club">
				<h3 className="my-club__title">🏟️ Mon Club</h3>
				<p className="my-club__empty">
					Achète ta première infrastructure dans la boutique ! →
				</p>
			</div>
		);
	}

	return (
		<div className="my-club">
			<h3 className="my-club__title">🏟️ Mon Club</h3>
			<div className="my-club__divider" />
			<ul className="my-club__list">
				{ownedInfras.map((infra) => {
					const isFlashing = flashIds.has(infra.id_infrastructure);
					return (
						<li
							key={infra.id_infrastructure}
							className={`my-club__item${isFlashing ? " my-club__item--flash" : ""}`}
						>
							<span className="my-club__icon">{getIcon(infra.nom)}</span>
							<div className="my-club__info">
								<span className="my-club__name">{infra.nom}</span>
								<span className="my-club__meta">
									×{infra.quantite || 0} · Niv.{infra.niveau || 1}
								</span>
							</div>
							<span className="my-club__prod">
								{formatProduction(infra.totalProduction)}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export default MyClub;
