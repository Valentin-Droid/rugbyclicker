import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ pseudo: '', email: '', mot_de_passe: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.mot_de_passe.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (form.pseudo.length < 3) {
      setError('Le pseudo doit contenir au moins 3 caractères');
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const serverError = err.response?.data;
      if (serverError?.details) {
        setError(serverError.details.map((d) => d.message).join(', '));
      } else {
        setError(serverError?.error || 'Erreur lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Inscription</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="pseudo">Pseudo</label>
          <input
            type="text"
            id="pseudo"
            name="pseudo"
            value={form.pseudo}
            onChange={handleChange}
            required
            minLength={3}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="mot_de_passe">Mot de passe</label>
          <input
            type="password"
            id="mot_de_passe"
            name="mot_de_passe"
            value={form.mot_de_passe}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Inscription...' : 'Créer mon compte'}
        </button>
      </form>
      <p className="auth-redirect">
        Déjà un compte ? <Link to="/login">Connexion</Link>
      </p>
    </div>
  );
}

export default Register;
