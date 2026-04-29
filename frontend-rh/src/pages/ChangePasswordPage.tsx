import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { compteService } from '../api/compteService';
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck } from 'react-icons/hi';

const ChangePasswordPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isForced = user?.mustChangePassword;

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthLabel = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength] || '';
  const strengthColor = ['', 'bg-red-500', 'bg-brand-', 'bg-yellow-500', 'bg-green-400', 'bg-green-600'][strength] || '';

  const isValid = oldPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!user?.compteId) {
      setError('Erreur: compte non identifié');
      return;
    }

    setLoading(true);
    try {
      const response = await compteService.changePassword(user.compteId, {
        oldPassword,
        newPassword,
      });
      if (response.data.success) {
        // Update user context to remove mustChangePassword
        const updatedUser = { ...user, mustChangePassword: false };
        login(updatedUser);
        navigate(isForced ? '/dashboard' : '/mon-profil');
      } else {
        setError(response.data.message || 'Erreur lors du changement');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du changement du mot de passe');
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
        {/* Header icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-lg mb-4">
            <HiOutlineLockClosed className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Changement de mot de passe</h1>
          <p className="text-white/60 mt-2 text-sm">
            {isForced
              ? 'Pour des raisons de sécurité, vous devez changer votre mot de passe avant de continuer.'
              : 'Sécurisez votre compte en modifiant votre mot de passe.'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">

          {error && (
            <div className="mb-5 p-3 bg-error-500/10 border border-error-500/30 rounded-lg text-error-500 dark:text-error-400 text-theme-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Old password */}
            <div>
              <label className="block text-theme-sm mb-1.5 text-white/70">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe actuel"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-lg transition-all focus:outline-none focus:ring-2 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-brand-500/20 focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                >
                  {showOld ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-theme-sm mb-1.5 text-white/70">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-lg transition-all focus:outline-none focus:ring-2 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-brand-500/20 focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                >
                  {showNew ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>

              {/* Password strength bar */}
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= strength ? strengthColor : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/50">
                    Force : {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-theme-sm mb-1.5 text-white/70">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez le nouveau mot de passe"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-lg transition-all focus:outline-none focus:ring-2 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:ring-brand-500/20 focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                >
                  {showConfirm ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-error-500">Les mots de passe ne correspondent pas</p>
              )}
              {confirmPassword.length > 0 && newPassword === confirmPassword && (
                <p className="mt-1 text-xs text-success-500 flex items-center gap-1">
                  <HiOutlineShieldCheck size={14} /> Les mots de passe correspondent
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                isValid && !loading
                  ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/25'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Modification en cours...
                </span>
              ) : (
                'Changer le mot de passe'
              )}
            </button>

            {/* Cancel (only if not forced) */}
            {!isForced && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-3 rounded-lg font-medium text-white/50 hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
