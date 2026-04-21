import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../api/authService';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = (() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;
    return score;
  })();

  const strengthLabels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!token) {
      setError('Lien de réinitialisation invalide');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({ token, newPassword });
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Le lien est invalide ou a expiré');
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
          <h2 className="text-xl font-semibold text-white mb-2">Nouveau mot de passe</h2>
          <p className="text-white/50 text-theme-sm mb-6">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>

          {success ? (
            <div className="space-y-5">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-theme-sm font-medium mb-1">✅ Mot de passe réinitialisé !</p>
                <p className="text-green-300/80 text-theme-xs">
                  Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-all duration-200 text-center shadow-lg shadow-brand-500/30"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-error-500/20 border border-error-500/30 rounded-lg text-error-300 text-theme-sm">
                  {error}
                </div>
              )}

              {!token ? (
                <div className="space-y-5">
                  <div className="p-4 bg-error-500/20 border border-error-500/30 rounded-lg">
                    <p className="text-error-300 text-theme-sm">
                      Lien de réinitialisation invalide. Veuillez demander un nouveau lien.
                    </p>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="block w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-all duration-200 text-center shadow-lg shadow-brand-500/30"
                  >
                    Demander un nouveau lien
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-theme-sm text-white/70 mb-1.5">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                      placeholder="Minimum 8 caractères"
                      required
                    />
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength ? strengthColors[passwordStrength] : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-theme-xs text-white/50">{strengthLabels[passwordStrength]}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-theme-sm text-white/70 mb-1.5">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-error-500 focus:border-error-400'
                          : 'border-white/20 focus:border-brand-400'
                      }`}
                      placeholder="Retapez le mot de passe"
                      required
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-theme-xs text-error-400 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                    className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-500/30"
                  >
                    {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                  </button>

                  <div className="text-center">
                    <Link to="/login" className="text-theme-sm text-brand-400 hover:text-brand-300 transition-colors">
                      ← Retour à la connexion
                    </Link>
                  </div>
                </form>
              )}
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

export default ResetPasswordPage;
