import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../hooks/useGame';
import useInterval from '../hooks/useInterval';
import NewGameModal from '../components/dashboard/NewGameModal';
import ResourceBar from '../components/dashboard/ResourceBar';
import ClickZone from '../components/dashboard/ClickZone';
import ShopPanel from '../components/shop/ShopPanel';
import ClubProgression from '../components/progression/ClubProgression';
import NextAction from '../components/dashboard/NextAction';

function Dashboard() {
  const { user, logout } = useAuth();
  const {
    partie,
    loading,
    error,
    loadOrCreatePartie,
    tick,
    loadGameState,
  } = useGame();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadOrCreatePartie();
  }, [loadOrCreatePartie]);

  useInterval(tick, 1000);

  useInterval(() => {
    if (partie) {
      loadGameState(partie.id_partie);
    }
  }, 30000);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner" />
          <p>Chargement de ta partie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>🏉 RugbyClicker</h1>
          <button onClick={logout} className="logout-button">
            Déconnexion
          </button>
        </header>
        <main className="dashboard-content">
          <div className="error-message">{error}</div>
        </main>
      </div>
    );
  }

  if (!partie) {
    return <NewGameModal />;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>🏉 {partie.nom_club}</h1>
          <span className="header-level">Niveau {partie.niveau}</span>
        </div>
        <div className="header-user">
          <span className="header-pseudo">{user?.pseudo}</span>
          <button onClick={logout} className="logout-button">
            Déconnexion
          </button>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          ☰
        </button>
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-nav open">
          <span style={{ color: 'var(--color-gold)', padding: '0.5rem 0', fontWeight: 600 }}>
            {user?.pseudo}
          </span>
          <button onClick={logout} style={{ color: 'var(--color-gold)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, padding: '0.5rem 0', textAlign: 'left' }}>
            Déconnexion
          </button>
        </nav>
      )}

      <NextAction />

      <main className="dashboard-grid">
        <div className="dashboard-col dashboard-col-left">
          <ResourceBar />
        </div>

        <div className="dashboard-col dashboard-col-center">
          <ClickZone />
        </div>

        <div className="dashboard-col dashboard-col-right">
          <ShopPanel />
        </div>
      </main>

      <footer className="dashboard-footer">
        <ClubProgression />
      </footer>
    </div>
  );
}

export default Dashboard;
