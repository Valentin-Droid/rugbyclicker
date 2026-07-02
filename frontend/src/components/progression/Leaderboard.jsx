import { useState, useEffect, useCallback } from 'react';
import gameService from '../../services/gameService';

function formatPrestige(value) {
  const num = parseFloat(value || 0);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return Math.floor(num).toString();
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

  const getMedal = (rang) => {
    if (rang === 1) return '🥇';
    if (rang === 2) return '🥈';
    if (rang === 3) return '🥉';
    return `#${rang}`;
  };

  return (
    <div className="leaderboard">
      <button
        className="leaderboard__toggle"
        onClick={() => setOpen(!open)}
      >
        🏆 Classement {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="leaderboard__panel">
          {loading ? (
            <div className="leaderboard__loading">Chargement...</div>
          ) : classement.length === 0 ? (
            <div className="leaderboard__empty">
              Aucun club classé pour le moment. Sois le premier !
            </div>
          ) : (
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
                  <tr key={club.rang} className={club.rang <= 3 ? 'leaderboard__top' : ''}>
                    <td className="leaderboard__rank">{getMedal(club.rang)}</td>
                    <td className="leaderboard__club">{club.nom_club}</td>
                    <td>{club.niveau}</td>
                    <td className="leaderboard__prestige">{formatPrestige(club.prestige)}</td>
                    <td className="leaderboard__manager">{club.pseudo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
