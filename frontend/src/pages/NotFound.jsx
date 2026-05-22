import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Page introuvable</p>
      <Link to="/">Retour à l&apos;accueil</Link>
    </div>
  );
}

export default NotFound;
