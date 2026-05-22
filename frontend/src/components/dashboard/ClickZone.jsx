import { useState, useCallback, useRef } from 'react';
import { useGame } from '../../hooks/useGame';

function getFloatColorClass(gain) {
  if (gain < 10) return 'click-float--small';
  if (gain <= 100) return 'click-float--medium';
  return 'click-float--large';
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

function ClickZone() {
  const { click } = useGame();
  const [clicks, setClicks] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [particles, setParticles] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [combo, setCombo] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const lastClickTime = useRef(0);
  const clickCountRef = useRef(0);
  const buttonRef = useRef(null);
  const fadeTimer = useRef(null);

  const handleClick = useCallback(async () => {
    if (disabled) return;

    const now = Date.now();

    setDisabled(true);
    const gain = await click();

    setClicks((prev) => prev + 1);

    // Floating +1
    const fId = now + Math.random();
    const gainColor = getFloatColorClass(gain);
    setFloatingTexts((prev) => [...prev, { id: fId, text: `+${gain}€`, cls: gainColor }]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== fId));
    }, 800);

    // Particles
    const newParticles = spawnParticles();
    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 700);

    // Ripple effect
    if (buttonRef.current) {
      buttonRef.current.classList.add('ripple');
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.classList.remove('ripple');
        }
      }, 600);
    }

    // Combo detection (< 500ms between clicks)
    if (now - lastClickTime.current < 500 && lastClickTime.current > 0) {
      clickCountRef.current += 1;
      const comboCount = clickCountRef.current + 1;
      setCombo({ id: now, count: comboCount });
      setTimeout(() => {
        setCombo((prev) => (prev && prev.id === now ? null : prev));
      }, 800);
    } else {
      clickCountRef.current = 0;
    }
    lastClickTime.current = now;

    // Last action
    setLastAction({ id: now, text: `💰 +${gain}€ gagnés` });
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setLastAction(null);
    }, 3000);

    setTimeout(() => {
      setDisabled(false);
    }, 100);
  }, [click, disabled]);

  return (
    <div className="click-zone">
      <button
        ref={buttonRef}
        className="click-button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Cliquer pour gagner de l'argent"
      >
        <span className="click-emoji">🏉</span>
        <span className="click-text">CLIQUE !</span>
      </button>

      {/* Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="click-particle"
          style={{ '--px': `${p.px}px`, '--py': `${p.py}px` }}
        >
          💰
        </span>
      ))}

      {/* Floating +1 texts */}
      {floatingTexts.map((f) => (
        <span key={f.id} className={`click-float ${f.cls}`}>
          {f.text}
        </span>
      ))}

      {/* Combo display */}
      {combo && (
        <div className="click-combo" key={combo.id}>
          COMBO x{combo.count} !
        </div>
      )}

      <p className="click-counter">
        Clics cette session : <strong>{clicks}</strong>
      </p>

      {/* Last action */}
      <div className="click-last-action">
        {lastAction ? lastAction.text : '\u00A0'}
      </div>
    </div>
  );
}

export default ClickZone;
