import { useState } from 'react';
import { useGame } from '../../hooks/useGame';

function NewGameModal() {
  const { createPartie } = useGame();
  const [nomClub, setNomClub] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = nomClub.trim();

    if (!trimmed) {
      setError('Le nom du club est requis');
      return;
    }
    if (trimmed.length > 100) {
      setError('Le nom du club ne peut pas dépasser 100 caractères');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createPartie(trimmed);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="new-game-modal-overlay">
      <div className="new-game-modal">
        <h2>Crée ton club</h2>
        <p className="new-game-subtitle">
          Aucune partie en cours. Donne un nom à ton club de rugby !
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nom-club">Nom de ton club</label>
            <input
              id="nom-club"
              type="text"
              value={nomClub}
              onChange={(e) => setNomClub(e.target.value)}
              placeholder="Ex: Stade Toulousain"
              maxLength={100}
              autoFocus
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer le club'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewGameModal;
