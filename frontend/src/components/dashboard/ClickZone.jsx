import { useState, useCallback } from 'react';
import { useGame } from '../../hooks/useGame';

function ClickZone() {
  const { click } = useGame();
  const [clicks, setClicks] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [disabled, setDisabled] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled) return;

    setDisabled(true);
    const gain = await click();

    setClicks((prev) => prev + 1);

    const id = Date.now() + Math.random();
    setFloatingTexts((prev) => [...prev, { id, text: `+${gain}` }]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    }, 800);

    setTimeout(() => {
      setDisabled(false);
    }, 100);
  }, [click, disabled]);

  return (
    <div className="click-zone">
      <button
        className="click-button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Cliquer pour gagner de l'argent"
      >
        <span className="click-emoji">🏉</span>
        <span className="click-text">CLIQUE !</span>
      </button>

      {floatingTexts.map((f) => (
        <span key={f.id} className="click-float">
          {f.text}
        </span>
      ))}

      <p className="click-counter">
        Clics cette session : <strong>{clicks}</strong>
      </p>
    </div>
  );
}

export default ClickZone;
