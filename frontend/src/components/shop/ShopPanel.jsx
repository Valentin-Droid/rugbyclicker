import { useState, useMemo } from 'react';
import { useGame } from '../../hooks/useGame';
import InfrastructureCard from './InfrastructureCard';
import AmeliorationCard from './AmeliorationCard';

function ShopPanel() {
  const { infrastructures, ameliorations, ressources } = useGame();
  const [tab, setTab] = useState('infrastructures');
  const [animKey, setAnimKey] = useState(0);

  const argent = parseFloat(ressources.find((r) => r.id_ressource === 1)?.quantite || 0);

  const switchTab = (newTab) => {
    if (newTab !== tab) {
      setTab(newTab);
      setAnimKey((k) => k + 1);
    }
  };

  const infraTriees = [...infrastructures].sort(
    (a, b) => parseFloat(a.cout_base) - parseFloat(b.cout_base)
  );

  const ameliorationsTriees = [...ameliorations].sort(
    (a, b) => parseFloat(a.cout) - parseFloat(b.cout)
  );

  // Count affordable non-owned ameliorations
  const availableAmels = ameliorations.filter(
    (a) => !a.achete && argent >= parseFloat(a.cout)
  ).length;

  // Find cheapest affordable and barely affordable infras
  const { cheapestAffordable, barelyAffordable } = useMemo(() => {
    let cheapest = null;
    let barely = null;

    infraTriees.forEach((i) => {
      const cout = Math.floor(
        parseFloat(i.cout_base) *
        Math.pow(1.15, i.quantite || 0)
      );
      if (cheapest === null && argent >= cout && (i.quantite || 0) === 0) {
        cheapest = i.id_infrastructure;
      }
      if (barely === null && argent < cout && cout <= argent * 2 && (i.quantite || 0) === 0) {
        barely = i.id_infrastructure;
      }
    });

    return { cheapestAffordable: cheapest, barelyAffordable: barely };
  }, [infraTriees, argent]);

  return (
    <div className="shop-panel">
      <div className="shop-tabs">
        <button
          className={`shop-tab${tab === 'infrastructures' ? ' shop-tab--active' : ''}`}
          onClick={() => switchTab('infrastructures')}
        >
          🏗️ Infrastructures
          <span className="shop-tab-badge">{infrastructures.length}</span>
        </button>
        <button
          className={`shop-tab${tab === 'ameliorations' ? ' shop-tab--active' : ''}`}
          onClick={() => switchTab('ameliorations')}
        >
          🔬 Améliorations
          <span className="shop-tab-badge">{ameliorations.length}</span>
          {availableAmels > 0 && (
            <span className="shop-tab-badge" style={{ background: 'var(--color-success)', color: 'white', marginLeft: '2px' }}>
              {availableAmels} dispo
            </span>
          )}
        </button>
      </div>

      <div className="shop-content" key={animKey}>
        {tab === 'infrastructures' &&
          infraTriees.map((infra) => (
            <InfrastructureCard
              key={infra.id_infrastructure}
              infrastructure={infra}
              isCheapest={infra.id_infrastructure === cheapestAffordable}
              isBarelyAffordable={infra.id_infrastructure === barelyAffordable}
            />
          ))}

        {tab === 'ameliorations' &&
          ameliorationsTriees.map((amel) => (
            <AmeliorationCard key={amel.id_amelioration} amelioration={amel} />
          ))}
      </div>
    </div>
  );
}

export default ShopPanel;
