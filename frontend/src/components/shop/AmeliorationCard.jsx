import { useState } from 'react';
import { useGame } from '../../hooks/useGame';

function formatNumber(value) {
  const num = parseFloat(value);
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
}

function traduireEffet(effet) {
  const [type, valeur] = effet.split(':');
  const mult = parseFloat(valeur);
  if (type === 'multiplicateur_production') {
    return `Production x${mult}`;
  }
  if (type === 'multiplicateur_clic') {
    return `Clic x${mult}`;
  }
  if (type === 'multiplicateur_global') {
    return `Global x${mult}`;
  }
  return effet;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AmeliorationCard({ amelioration }) {
  const { ressources, acheterAmelioration } = useGame();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const argent = parseFloat(ressources.find((r) => r.id_ressource === 1)?.quantite || 0);
  const cout = parseFloat(amelioration.cout);
  const dejaAchete = amelioration.achete;
  const canBuy = argent >= cout && !dejaAchete;

  const handleBuy = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await acheterAmelioration(amelioration.id_amelioration);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de l\'achat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`amel-card${dejaAchete ? ' amel-card--owned' : ''}`}>
      <div className="amel-card__header">
        <h4 className="amel-card__name">{amelioration.nom}</h4>
        <span className="amel-card__effet">{traduireEffet(amelioration.effet)}</span>
      </div>

      <div className="amel-card__action">
        {dejaAchete ? (
          <span className="amel-card__badge">
            Acquis
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
            title={!canBuy ? 'Pas assez d\'argent' : ''}
          >
            {loading ? 'Achat...' : `Acheter (${formatNumber(cout)}EUR)`}
          </button>
        )}
      </div>

      {errorMsg && <p className="shop-error">{errorMsg}</p>}
    </div>
  );
}

export default AmeliorationCard;
