import { useRef, useEffect, useState } from 'react';
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

function useAnimatedValue(targetValue, duration = 300) {
  const [displayed, setDisplayed] = useState(targetValue);
  const prevTarget = useRef(targetValue);
  const rafRef = useRef(null);

  useEffect(() => {
    if (targetValue === prevTarget.current) return;

    const start = prevTarget.current;
    const end = targetValue;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayed(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    prevTarget.current = targetValue;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetValue, duration]);

  return displayed;
}

function AnimatedResourceValue({ targetValue, suffix }) {
  const displayed = useAnimatedValue(targetValue, 300);
  return <>{formatNumber(displayed)}{suffix}</>;
}

function ResourceBar() {
  const { ressources, productionParSeconde, infrastructures } = useGame();
  const prevPps = useRef(productionParSeconde);
  const prevValues = useRef({});
  const [flashStates, setFlashStates] = useState({});
  const flashTimers = useRef({});

  // Detect value changes and trigger flash
  useEffect(() => {
    const newFlash = { ...flashStates };
    ressources.forEach((r) => {
      const prev = prevValues.current[r.id_ressource];
      const curr = parseFloat(r.quantite);

      if (prev !== undefined && curr !== prev) {
        const flashClass = curr > prev ? 'resource-card--gain' : 'resource-card--loss';
        newFlash[r.id_ressource] = flashClass;

        if (flashTimers.current[r.id_ressource]) {
          clearTimeout(flashTimers.current[r.id_ressource]);
        }
        flashTimers.current[r.id_ressource] = setTimeout(() => {
          setFlashStates((prevSt) => {
            const updated = { ...prevSt };
            delete updated[r.id_ressource];
            return updated;
          });
        }, 300);
      }
      prevValues.current[r.id_ressource] = curr;
    });
    setFlashStates(newFlash);
  }, [ressources]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trend detection
  const trend = productionParSeconde > prevPps.current
    ? 'resource-trend--up'
    : productionParSeconde < prevPps.current
      ? 'resource-trend--down'
      : 'resource-trend--stable';

  useEffect(() => {
    prevPps.current = productionParSeconde;
  }, [productionParSeconde]);

  const trendIcon = productionParSeconde > prevPps.current ? '↑' :
    productionParSeconde < prevPps.current ? '↓' : '→';

  // Compute cheapest unowned infrastructure cost for fill bar
  const ownedInfraIds = new Set(
    infrastructures.filter((i) => (i.quantite || 0) > 0).map((i) => i.id_infrastructure)
  );
  const cheapestCost = infrastructures
    .filter((i) => !ownedInfraIds.has(i.id_infrastructure))
    .reduce((min, i) => {
      const cost = parseFloat(i.cout_base);
      return cost < min ? cost : min;
    }, Infinity);

  const cheapestUpgradeCost = infrastructures
    .filter((i) => (i.quantite || 0) > 0)
    .reduce((min, i) => {
      const coutBase = parseFloat(i.cout_base);
      const q = i.quantite || 0;
      const n = i.niveau || 1;
      const cost = Math.floor(coutBase * Math.pow(1.15, q) * Math.pow(1.5, n));
      return cost < min ? cost : min;
    }, Infinity);

  const nextMilestone = Math.min(
    cheapestCost === Infinity ? Infinity : cheapestCost,
    cheapestUpgradeCost === Infinity ? Infinity : cheapestUpgradeCost
  );

  return (
    <div className="resource-bar">
      {ressources.map((r) => {
        const rawValue = parseFloat(r.quantite);

        return (
          <div
            key={r.id_ressource}
            className={`resource-card${flashStates[r.id_ressource] ? ` ${flashStates[r.id_ressource]}` : ''}`}
          >
            <span className="resource-label">
              {ICONS[r.id_ressource] || '📦'} {r.nom}
            </span>
            <span className="resource-value">
              {r.id_ressource === 1 ? (
                <AnimatedResourceValue targetValue={rawValue} suffix="€" />
              ) : (
                `${formatNumber(rawValue)}${SUFFIXES[r.id_ressource] || ''}`
              )}
            </span>
            {r.id_ressource === 1 && (
              <>
                <span className="resource-pps">
                  +{productionParSeconde.toFixed(1)}/s
                  <span className={`resource-trend ${trend}`}>{trendIcon}</span>
                </span>
                {nextMilestone < Infinity && (
                  <div className="resource-fill-bar">
                    <div
                      className="resource-fill"
                      style={{
                        width: `${Math.min(100, (rawValue / nextMilestone) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ResourceBar;
