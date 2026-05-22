import { useGame } from '../../hooks/useGame';

const ICONS = {
  1: '💰',
  2: '👥',
  3: '⭐',
};

const SUFFIXES = {
  1: '€',
  2: '',
  3: '',
};

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

function ResourceBar() {
  const { ressources, productionParSeconde } = useGame();

  return (
    <div className="resource-bar">
      {ressources.map((r) => (
        <div key={r.id_ressource} className="resource-card">
          <span className="resource-label">
            {ICONS[r.id_ressource] || '📦'} {r.nom}
          </span>
          <span className="resource-value">
            {formatNumber(r.quantite)}{SUFFIXES[r.id_ressource] || ''}
          </span>
          {r.id_ressource === 1 && (
            <span className="resource-pps">
              +{productionParSeconde.toFixed(1)}/s
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default ResourceBar;
