import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../../hooks/useGame';

/* ─────────────────────────────────────────────────────
   Event definitions
   ───────────────────────────────────────────────────── */

const EVENTS = [
  {
    type: 'ballon-dor',
    emoji: '🏉',
    label: "Ballon d'Or !",
    className: 'random-event--golden',
    description: "Un ballon d'or brille sur le stade !",
    effect: 'argent',
  },
  {
    type: 'supporter',
    emoji: '📣',
    label: 'Supporter !',
    className: 'random-event--supporter',
    description: 'Un supporter enflammé apparaît !',
    effect: 'fans',
  },
  {
    type: 'sponsor',
    emoji: '💼',
    label: 'Sponsor !',
    className: 'random-event--sponsor',
    description: 'Un sponsor propose un partenariat !',
    effect: 'boost',
  },
  {
    type: 'etoile',
    emoji: '⭐',
    label: 'Étoile filante !',
    className: 'random-event--star',
    description: 'Une étoile filante traverse le ciel !',
    effect: 'prestige',
  },
];

function getRandomDelay() {
  return 25000 + Math.floor(Math.random() * 65000); // 25-90s
}

function getRandomPosition() {
  return {
    top: `${15 + Math.floor(Math.random() * 60)}%`,
    left: `${25 + Math.floor(Math.random() * 50)}%`,
  };
}

/* ─────────────────────────────────────────────────────
   RandomEvent Component
   ───────────────────────────────────────────────────── */

function RandomEvent() {
  const { partie, productionParSeconde, click } = useGame();
  const level = partie?.niveau || 1;

  const [currentEvent, setCurrentEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [exploding, setExploding] = useState(false);
  const [explosionParticles, setExplosionParticles] = useState([]);

  const timerRef = useRef(null);
  const dismissRef = useRef(null);

  /* ── Pick a random event and spawn ────────────────── */
  const spawnEvent = useCallback(() => {
    // Only start spawning at level 2+
    if (level < 2) return;

    const eventDef = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const pos = getRandomPosition();

    setCurrentEvent({ ...eventDef, position: pos });
    setVisible(true);
    setExploding(false);
    setExplosionParticles([]);

    // Auto-dismiss after 8s
    if (dismissRef.current) clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setCurrentEvent(null), 400);
      scheduleNext();
    }, 8000);
  }, [level]);

  /* ── Schedule next event ──────────────────────────── */
  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (level >= 2) {
      timerRef.current = setTimeout(() => {
        spawnEvent();
      }, getRandomDelay());
    }
  }, [spawnEvent, level]);

  /* ── Start / restart on level change ──────────────── */
  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [scheduleNext]);

  /* ── Explosion particles helper ───────────────────── */
  const createExplosion = (color) => {
    const particles = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const dist = 30 + Math.random() * 50;
      particles.push({
        id: i,
        px: Math.cos(angle) * dist,
        py: Math.sin(angle) * dist,
        color,
      });
    }
    return particles;
  };

  /* ── Handle click on event ────────────────────────── */
  const handleEventClick = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!currentEvent || exploding) return;

      const colorMap = {
        'ballon-dor': 'var(--color-gold)',
        supporter: '#ff6b6b',
        sponsor: '#4ecdc4',
        etoile: '#a78bfa',
      };

      // Explosion animation
      setExploding(true);
      const color = colorMap[currentEvent.type] || 'var(--color-gold)';
      setExplosionParticles(createExplosion(color));

      // Apply effect based on type
      if (currentEvent.type === 'ballon-dor') {
        await click(); // Give money through click API
        // Show a second float for the bonus
      }

      // Clean up event
      if (dismissRef.current) clearTimeout(dismissRef.current);
      setTimeout(() => {
        setVisible(false);
        setExploding(false);
        setExplosionParticles([]);
        setTimeout(() => setCurrentEvent(null), 400);
        scheduleNext();
      }, 700);
    },
    [currentEvent, exploding, click, scheduleNext]
  );

  /* ── Don't render anything at level 1 ─────────────── */
  if (!currentEvent || !visible) return null;

  return (
    <div
      className={`random-event ${currentEvent.className}${
        exploding ? ' random-event--exploding' : ''
      }`}
      style={{
        top: currentEvent.position.top,
        left: currentEvent.position.left,
      }}
      onClick={handleEventClick}
      role="button"
      tabIndex={0}
      aria-label={currentEvent.label}
    >
      {/* Event emoji */}
      <span className="random-event__emoji">{currentEvent.emoji}</span>

      {/* Label */}
      <span className="random-event__label">{currentEvent.label}</span>

      {/* Explosion particles */}
      {explosionParticles.map((p) => (
        <span
          key={p.id}
          className="random-event__particle"
          style={{
            '--px': `${p.px}px`,
            '--py': `${p.py}px`,
            '--particle-color': p.color,
          }}
        />
      ))}

      {/* Glow ring */}
      <span className="random-event__glow" />
    </div>
  );
}

export default RandomEvent;
