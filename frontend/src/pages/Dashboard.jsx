import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Bienvenue {user?.pseudo} !</h1>
        <button onClick={logout} className="logout-button">
          Déconnexion
        </button>
      </header>

      <main className="dashboard-content">
        <section className="stats-placeholder">
          <h2>Tableau de bord</h2>
          <p>Les statistiques de ton club apparaîtront ici.</p>
        </section>

        <section className="resources-placeholder">
          <h2>Ressources</h2>
          <div className="resource-cards">
            <div className="resource-card">
              <span className="resource-label">Argent</span>
              <span className="resource-value">0 €</span>
            </div>
            <div className="resource-card">
              <span className="resource-label">Fans</span>
              <span className="resource-value">0</span>
            </div>
            <div className="resource-card">
              <span className="resource-label">Prestige</span>
              <span className="resource-value">0</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
