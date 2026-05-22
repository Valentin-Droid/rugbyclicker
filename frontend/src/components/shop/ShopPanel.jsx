import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import InfrastructureCard from './InfrastructureCard';
import AmeliorationCard from './AmeliorationCard';

function ShopPanel() {
  const { infrastructures, ameliorations } = useGame();
  const [tab, setTab] = useState('infrastructures');

  const infraTriees = [...infrastructures].sort(
    (a, b) => parseFloat(a.cout_base) - parseFloat(b.cout_base)
  );

  const ameliorationsTriees = [...ameliorations].sort(
    (a, b) => parseFloat(a.cout) - parseFloat(b.cout)
  );

  return (
    <div className="shop-panel">
      <div className="shop-tabs">
        <button
          className={`shop-tab${tab === 'infrastructures' ? ' shop-tab--active' : ''}`}
          onClick={() => setTab('infrastructures')}
        >
          Infrastructures
        </button>
        <button
          className={`shop-tab${tab === 'ameliorations' ? ' shop-tab--active' : ''}`}
          onClick={() => setTab('ameliorations')}
        >
          Ameliorations
        </button>
      </div>

      <div className="shop-content">
        {tab === 'infrastructures' &&
          infraTriees.map((infra) => (
            <InfrastructureCard key={infra.id_infrastructure} infrastructure={infra} />
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
