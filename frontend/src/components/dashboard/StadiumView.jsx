import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useGame } from '../../hooks/useGame';

/* ─────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────── */

function getStadiumStage(partie) {
  const level = partie?.niveau || 1;
  if (level >= 16) return 6;
  if (level >= 11) return 5;
  if (level >= 6) return 4;
  if (level >= 3) return 3;
  return 1;
}

function spawnParticles() {
  const particles = [];
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 60;
    particles.push({
      id: Date.now() + Math.random() + i,
      px: Math.cos(angle) * distance,
      py: Math.sin(angle) * distance,
    });
  }
  return particles;
}

/* ─────────────────────────────────────────────────────
   StadiumView
   ───────────────────────────────────────────────────── */

function StadiumView() {
  const { partie, infrastructures, productionParSeconde, click } = useGame();

  const stage = getStadiumStage(partie);

  /* ── Click state (migrated from ClickZone) ─────── */
  const [disabled, setDisabled] = useState(false);
  const [particles, setParticles] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [combo, setCombo] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const lastClickTime = useRef(0);
  const clickCountRef = useRef(0);
  const buttonRef = useRef(null);
  const fadeTimer = useRef(null);

  /* ── Auto-float state ──────────────────────────── */
  const [autoFloats, setAutoFloats] = useState([]);
  const autoFloatId = useRef(0);
  const [ppsUpdated, setPpsUpdated] = useState(false);
  const prevPps = useRef(productionParSeconde);

  /* ── Construction scaffold ─────────────────────── */
  const [showScaffold, setShowScaffold] = useState(false);
  const prevInfraMap = useRef({});

  /* ── Level-up pulse ────────────────────────────── */
  const [levelUpPulse, setLevelUpPulse] = useState(false);
  const prevLevel = useRef(partie?.niveau || 0);
  const pulseTimer = useRef(null);

  /* ── Stable pseudo-random spectator positions ──── */
  const spectatorSpans = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        x: (i * 37 + 13) % 100,
        y: (i * 23 + 7) % 80 + 10,
        delay: ((i * 0.4) % 3).toFixed(2),
        hue: (i * 31 + 15) % 40,
      })),
    []
  );

  /* ── Detect level-up → pulse stadium ───────────── */
  useEffect(() => {
    const lvl = partie?.niveau || 0;
    if (lvl > prevLevel.current && prevLevel.current > 0) {
      setLevelUpPulse(true);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setLevelUpPulse(false), 2500);
    }
    prevLevel.current = lvl;
    return () => pulseTimer.current && clearTimeout(pulseTimer.current);
  }, [partie?.niveau]);

  /* ── Detect infrastructure purchase → scaffold ──── */
  useEffect(() => {
    const prevMap = prevInfraMap.current;
    infrastructures.forEach((infra) => {
      const prev = prevMap[infra.id_infrastructure];
      const curr = infra.quantite || 0;
      if (prev !== undefined && curr > prev) {
        setShowScaffold(true);
        const t = setTimeout(() => setShowScaffold(false), 2000);
        return () => clearTimeout(t);
      }
      prevMap[infra.id_infrastructure] = curr;
    });
    if (Object.keys(prevMap).length === 0) {
      infrastructures.forEach(
        (infra) => (prevMap[infra.id_infrastructure] = infra.quantite || 0)
      );
    }
  }, [infrastructures]);

  /* ── PPS update flash ───────────────────────────── */
  useEffect(() => {
    if (productionParSeconde !== prevPps.current && prevPps.current > 0) {
      setPpsUpdated(true);
      const t = setTimeout(() => setPpsUpdated(false), 500);
      return () => clearTimeout(t);
    }
    prevPps.current = productionParSeconde;
  }, [productionParSeconde]);

  /* ── Auto-floats every 1s ───────────────────────── */
  useEffect(() => {
    if (productionParSeconde <= 0) return;

    const interval = setInterval(() => {
      const id = ++autoFloatId.current;
      const direction = (Math.random() - 0.5) * 80;
      setAutoFloats((prev) => {
        const next = [...prev, { id, text: `+${productionParSeconde.toFixed(1)}€`, dir: direction }];
        return next.length > 5 ? next.slice(-5) : next;
      });
      setTimeout(() => {
        setAutoFloats((prev) => prev.filter((f) => f.id !== id));
      }, 1500);
    }, 1000);

    return () => clearInterval(interval);
  }, [productionParSeconde]);

  /* ── Click handler (identical logic from ClickZone) ── */
  const handleClick = useCallback(async () => {
    if (disabled) return;

    const now = Date.now();
    setDisabled(true);
    const gain = await click();

    const fId = now + Math.random();
    setFloatingTexts((prev) => [...prev, { id: fId, text: `+${gain}€` }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== fId));
    }, 800);

    const newParticles = spawnParticles();
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 700);

    if (buttonRef.current) {
      buttonRef.current.classList.add('ripple');
      setTimeout(() => {
        if (buttonRef.current) buttonRef.current.classList.remove('ripple');
      }, 600);
    }

    if (now - lastClickTime.current < 500 && lastClickTime.current > 0) {
      clickCountRef.current += 1;
      setCombo({ id: now, count: clickCountRef.current + 1 });
      setTimeout(() => {
        setCombo((prev) => (prev?.id === now ? null : prev));
      }, 800);
    } else {
      clickCountRef.current = 0;
    }
    lastClickTime.current = now;

    setLastAction(`💰 +${gain}€ gagnés`);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setLastAction(null), 3000);

    setTimeout(() => setDisabled(false), 100);
  }, [click, disabled]);

  /* ── Render ──────────────────────────────────────── */
  const showCoinRain = productionParSeconde > 100;

  return (
    <div className={`stadium-view${levelUpPulse ? ' stadium--levelup-pulse' : ''}`}>
      <div className={`stadium-container stadium--stage-${stage}`}>
        {/* ── SKY ─────────────────────────────────── */}
        <div className="stadium-sky" />

        {/* ── STANDS (4 sides) ─────────────────────── */}
        <div className="stadium-stand stadium-stand--top" />
        <div className="stadium-stand stadium-stand--bottom" />
        <div className="stadium-stand stadium-stand--left" />
        <div className="stadium-stand stadium-stand--right" />

        {/* ── SPECTATORS ────────────────────────────── */}
        <div className="stadium-spectators">
          {spectatorSpans.map((s, i) => (
            <span
              key={i}
              className="stadium-spectator"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                animationDelay: `${s.delay}s`,
                backgroundColor: `hsl(${s.hue}, 70%, 50%)`,
              }}
            />
          ))}
        </div>

        {/* ── FLOODLIGHTS ──────────────────────────── */}
        <div className="stadium-floodlight stadium-floodlight--tl" />
        <div className="stadium-floodlight stadium-floodlight--tr" />
        <div className="stadium-floodlight stadium-floodlight--bl" />
        <div className="stadium-floodlight stadium-floodlight--br" />

        {/* ── PITCH ─────────────────────────────────── */}
        <div className="stadium-pitch">
          <div className="stadium-pitch-stripes" />
          <div className="stadium-club-logo">
            <span>{partie?.nom_club?.toUpperCase() || 'RUGBY CLICKER'}</span>
          </div>
        </div>

        {/* ── RUGBY POSTS ──────────────────────────── */}
        <div className="stadium-post stadium-post--left" />
        <div className="stadium-post stadium-post--right" />

        {/* ── SMOKE / LEGENDARY FX ─────────────────── */}
        <div className="stadium-smoke">
          <span />
          <span />
          <span />
        </div>

        {/* ── GIANT PPS COUNTER ────────────────────── */}
        <div className={`stadium-pps${ppsUpdated ? ' stadium-pps--flash' : ''}`}>
          +{productionParSeconde.toFixed(1)} €/s
        </div>

        {/* ── CLICKABLE BALL ────────────────────────── */}
        <button
          ref={buttonRef}
          className="stadium-ball"
          onClick={handleClick}
          disabled={disabled}
          aria-label="Cliquer pour gagner de l'argent"
        >
          <span className="stadium-ball-emoji">🏉</span>
        </button>

        {/* ── CLICK PARTICLES ───────────────────────── */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="stadium-particle"
            style={{ '--px': `${p.px}px`, '--py': `${p.py}px` }}
          >
            💰
          </span>
        ))}

        {/* ── CLICK FLOATS ──────────────────────────── */}
        {floatingTexts.map((f) => (
          <span key={f.id} className="stadium-click-float">
            {f.text}
          </span>
        ))}

        {/* ── AUTO-FLOATS ───────────────────────────── */}
        {autoFloats.map((f) => (
          <span
            key={f.id}
            className="stadium-auto-float"
            style={{ '--float-dir': `${f.dir}px` }}
          >
            {f.text}
          </span>
        ))}

        {/* ── COMBO ─────────────────────────────────── */}
        {combo && (
          <div className="stadium-combo" key={combo.id}>
            COMBO x{combo.count} !
          </div>
        )}

        {/* ── COIN RAIN (PPS > 100) ──────────────────── */}
        {showCoinRain && (
          <div className="stadium-coin-rain">
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="stadium-coin"
                style={{ animationDelay: `${i * 0.25}s` }}
              >
                💰
              </span>
            ))}
          </div>
        )}

        {/* ── CONSTRUCTION SCAFFOLD ─────────────────── */}
        {showScaffold && (
          <div className="stadium-scaffold">
            <div className="stadium-scaffold-bar stadium-scaffold-bar--1" />
            <div className="stadium-scaffold-bar stadium-scaffold-bar--2" />
            <div className="stadium-scaffold-bar stadium-scaffold-bar--3" />
            <div className="stadium-scaffold-bar stadium-scaffold-bar--4" />
            <div className="stadium-dust" />
          </div>
        )}

        {/* ── LAST ACTION ───────────────────────────── */}
        <div className="stadium-last-action">
          {lastAction || '\u00A0'}
        </div>
      </div>
    </div>
  );
}

export default StadiumView;
