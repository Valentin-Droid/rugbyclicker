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

function getCoutAchat(coutBase, quantite, niveau) {
  return Math.floor(coutBase * Math.pow(1.15, quantite) * Math.pow(1.5, niveau - 1));
}

function getCoutUpgrade(coutBase, quantite, niveau) {
  return Math.floor(coutBase * Math.pow(1.15, quantite) * Math.pow(1.5, niveau));
}

function InfrastructureCard({ infrastructure }) {
  const { ressources, acheterInfrastructure, upgraderInfrastructure } = useGame();
  const [buyLoading, setBuyLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const argent = parseFloat(ressources.find((r) => r.id_ressource === 1)?.quantite || 0);
  const quantite = infrastructure.quantite || 0;
  const niveau = infrastructure.niveau || 1;
  const coutBase = parseFloat(infrastructure.cout_base);

  const coutAchat = getCoutAchat(coutBase, quantite, niveau);
  const coutUpgrade = getCoutUpgrade(coutBase, quantite, niveau);

  const productionActuelle = quantite * parseFloat(infrastructure.production_base) * niveau;
  const canBuy = argent >= coutAchat;
  const canUpgrade = quantite >= 1 && argent >= coutUpgrade;

  const handleBuy = async () => {
    setBuyLoading(true);
    setErrorMsg('');
    try {
      await acheterInfrastructure(infrastructure.id_infrastructure);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de l\'achat');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    setErrorMsg('');
    try {
      await upgraderInfrastructure(infrastructure.id_infrastructure);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de l\'amelioration');
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="infra-card">
      <div className="infra-card__header">
        <h4 className="infra-card__name">{infrastructure.nom}</h4>
        {infrastructure.description && (
          <p className="infra-card__desc">{infrastructure.description}</p>
        )}
      </div>

      <div className="infra-card__stats">
        <span className="infra-card__stat">
          Possede : {quantite} &times; Niv.{niveau}
        </span>
        <span className="infra-card__stat">
          Production : {formatNumber(productionActuelle)}/s
        </span>
      </div>

      <div className="infra-card__actions">
        <button
          className="infra-card__btn infra-card__buy"
          onClick={handleBuy}
          disabled={!canBuy || buyLoading}
          title={!canBuy ? 'Pas assez d\'argent' : ''}
        >
          {buyLoading ? 'Achat...' : `Acheter (${formatNumber(coutAchat)}EUR)`}
        </button>

        <button
          className="infra-card__btn infra-card__upgrade"
          onClick={handleUpgrade}
          disabled={!canUpgrade || upgradeLoading}
          title={
            quantite === 0
              ? 'Achetez d\'abord cette infrastructure'
              : !canUpgrade
                ? 'Pas assez d\'argent'
                : ''
          }
        >
          {upgradeLoading
            ? 'Upgrade...'
            : `Upgrader (${formatNumber(coutUpgrade)}EUR)`}
        </button>
      </div>

      {errorMsg && <p className="shop-error">{errorMsg}</p>}
    </div>
  );
}

export default InfrastructureCard;
