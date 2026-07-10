import { useState, useEffect, useCallback } from "react";
import gameService from "../../services/gameService";
import { TrophyIcon } from "../common/GameIcons";
import { formatNumber } from "../../utils/format";

function getMedal(rang) {
	if (rang === 1) return "🥇";
	if (rang === 2) return "🥈";
	if (rang === 3) return "🥉";
	return `#${rang}`;
}

function renderPanelContent(loading, classement) {
	if (loading) {
		return <div className="leaderboard__loading">Chargement...</div>;
	}
	if (classement.length === 0) {
		return (
			<div className="leaderboard__empty">
				Aucun club classé pour le moment. Sois le premier !
			</div>
		);
	}
	return (
		<table className="leaderboard__table">
			<thead>
				<tr>
					<th>#</th>
					<th>Club</th>
					<th>Niv.</th>
					<th>Prestige</th>
					<th>Manager</th>
				</tr>
			</thead>
			<tbody>
				{classement.map((club) => (
					<tr
						key={club.rang}
						className={club.rang <= 3 ? "leaderboard__top" : ""}
					>
						<td className="leaderboard__rank">{getMedal(club.rang)}</td>
						<td className="leaderboard__club">{club.nom_club}</td>
						<td>{club.niveau}</td>
						<td className="leaderboard__prestige">
							{formatNumber(club.prestige)}
						</td>
						<td className="leaderboard__manager">{club.pseudo}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

function Leaderboard() {
	const [classement, setClassement] = useState([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);

	const fetchClassement = useCallback(async () => {
		setLoading(true);
		try {
			const res = await gameService.getClassement();
			setClassement(res.data);
		} catch {
			// Silencieux — le classement n'est pas critique
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (open) fetchClassement();
	}, [open, fetchClassement]);

	return (
		<div className="leaderboard">
			<button
				type="button"
				className="leaderboard__toggle"
				onClick={() => setOpen(!open)}
			>
				<TrophyIcon
					size={16}
					style={{
						display: "inline",
						marginRight: "0.35rem",
						verticalAlign: "-2px",
					}}
				/>
				Classement {open ? "▲" : "▼"}
			</button>

			{open && (
				<div className="leaderboard__panel">
					{renderPanelContent(loading, classement)}
				</div>
			)}
		</div>
	);
}

export default Leaderboard;
