import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <header className="hero">
        <h1>🏉 RugbyClicker</h1>
        <p className="hero-subtitle">
          Deviens le meilleur manager de rugby ! Clique, investis et fais grandir ton club.
        </p>
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="cta-button">
          Jouer maintenant
        </Link>
      </header>

      <section className="how-it-works">
        <h2>Comment ça marche ?</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Clique pour gagner</h3>
            <p>Génère de l&apos;argent, des fans et du prestige en cliquant.</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Achète des infrastructures</h3>
            <p>Stade, centre d&apos;entraînement, boutique... Ils produisent pour toi !</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Progresse et domine</h3>
            <p>Débloque des améliorations et deviens une légende du rugby.</p>
          </div>
        </div>
      </section>

      <section className="home-ranking">
        <h2>🏆 Classement des clubs</h2>
        <p className="home-ranking__clubs">
          <strong>+ de 1 000</strong>
          clubs créés !
        </p>
        <div className="home-ranking__placeholder">
          <div className="ranking-card">
            <div className="ranking-card__rank">🥇</div>
            <div className="ranking-card__name">RC Toulon</div>
            <div className="ranking-card__level">Niveau 42</div>
          </div>
          <div className="ranking-card">
            <div className="ranking-card__rank">🥈</div>
            <div className="ranking-card__name">Stade Toulousain</div>
            <div className="ranking-card__level">Niveau 38</div>
          </div>
          <div className="ranking-card">
            <div className="ranking-card__rank">🥉</div>
            <div className="ranking-card__name">ASM Clermont</div>
            <div className="ranking-card__level">Niveau 35</div>
          </div>
        </div>
      </section>

      <nav className="auth-links">
        <Link to="/login">Connexion</Link>
        <Link to="/register">Inscription</Link>
      </nav>
    </div>
  );
}

export default Home;
