import { useGame } from '../../hooks/useGame';

function calculerNiveau(totalArgent) {
  if (!totalArgent || totalArgent <= 0) return 1;
  return Math.floor(Math.log2(totalArgent / 100 + 1)) + 1;
}

function argentPourNiveau(niveau) {
  return Math.floor(100 * (Math.pow(2, niveau - 1) - 1));
}

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

function ClubProgression() {
  const { partie } = useGame();

  if (!partie) return null;

  const totalArgent = partie.total_argent_genere || 0;
  const niveauActuel = partie.niveau || calculerNiveau(totalArgent);
  const argentNiveauActuel = argentPourNiveau(niveauActuel);
  const argentNiveauSuivant = argentPourNiveau(niveauActuel + 1);

  const progressionArgent = totalArgent - argentNiveauActuel;
  const argentNecessaire = argentNiveauSuivant - argentNiveauActuel;
  const pourcentage = argentNecessaire > 0
    ? Math.min(100, (progressionArgent / argentNecessaire) * 100)
    : 100;

  const reste = argentNecessaire - progressionArgent;

  return (
    <div className="progression-container">
      <div className="progression-labels">
        <span className="progression-niveau">Niveau {niveauActuel}</span>
        <span className="progression-niveau">Niveau {niveauActuel + 1}</span>
      </div>
      <div className="progression-bar">
        <div
          className="progression-fill"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
      <span className="progression-text">
        {reste > 0
          ? `Prochain niveau dans ${formatNumber(reste)}EUR`
          : 'Niveau max atteint'}
      </span>
    </div>
  );
}

export default ClubProgression;
