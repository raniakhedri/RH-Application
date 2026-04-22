import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../api/authService';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl font-bold text-white">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Antigone</h1>
          <p className="text-white/60 mt-1">Gestion des Ressources Humaines</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Mot de passe oublié</h2>
          <p className="text-white/50 text-theme-sm mb-6">
            Entrez l'adresse email associée à votre compte. Vous recevrez un lien pour réinitialiser votre mot de passe.
          </p>

          {sent ? (
            <div className="space-y-5">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-theme-sm font-medium mb-1">📧 Email envoyé !</p>
                <p className="text-green-300/80 text-theme-xs">
                  Si un compte est associé à cet email, vous recevrez un lien de réinitialisation valable 30 minutes.
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-200 text-center"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-error-500/20 border border-error-500/30 rounded-lg text-error-300 text-theme-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-theme-sm text-white/70 mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                    placeholder="exemple@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-500/30"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>

                <div className="text-center">
                  <Link to="/login" className="text-theme-sm text-brand-400 hover:text-brand-300 transition-colors">
                    ← Retour à la connexion
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-theme-sm mt-6">
          © 2026 Antigone-IT. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
