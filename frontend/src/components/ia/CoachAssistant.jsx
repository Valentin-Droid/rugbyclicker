import { useState, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';
import gameService from '../../services/gameService';

function CoachAssistant() {
  const { partie, loading } = useGame();
  const [recommandation, setRecommandation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const askCoach = useCallback(async () => {
    if (!partie?.id_partie) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await gameService.getCoachRecommendation(partie.id_partie);
      setRecommandation(result);
    } catch (err) {
      setError("L'assistant IA est momentanément indisponible.");
      console.error('[CoachAssistant] Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  }, [partie]);

  if (loading && !partie) return null;

  return (
    <div className="coach-assistant">
      <div className="coach-assistant__header">
        <span className="coach-assistant__icon">🧠</span>
        <h3 className="coach-assistant__title">Assistant Coach IA</h3>
        <span className="coach-assistant__badge">Gemma 3</span>
      </div>

      {!recommandation && !isLoading && (
        <button
          className="coach-assistant__ask-btn"
          onClick={askCoach}
          disabled={!partie}
        >
          🤖 Quelle est la meilleure action maintenant ?
        </button>
      )}

      {isLoading && (
        <div className="coach-assistant__loading">
          <div className="coach-assistant__spinner" />
          <span>L'assistant analyse ton club...</span>
        </div>
      )}

      {error && (
        <div className="coach-assistant__error">
          <span>⚠️ {error}</span>
          <button onClick={askCoach}>Réessayer</button>
        </div>
      )}

      {recommandation && !isLoading && (
        <div className="coach-assistant__result">
          <div className="coach-assistant__action">
            <span className="coach-assistant__action-icon">🎯</span>
            <strong>{recommandation.action}</strong>
          </div>
          <p className="coach-assistant__reason">{recommandation.raison}</p>
          <p className="coach-assistant__impact">📈 {recommandation.impact}</p>
          <button
            className="coach-assistant__refresh-btn"
            onClick={askCoach}
          >
            🔄 Demander un autre conseil
          </button>
        </div>
      )}
    </div>
  );
}

export default CoachAssistant;
