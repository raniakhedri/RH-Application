import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/authService';
import Logo3D from '../components/ui/Logo3D';
import { relayAuthSnapshotForSwitch } from '../utils/authStorage';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const projectsAppUrl = (import.meta.env.VITE_PROJECTS_APP_URL as string | undefined)?.trim();
  // Track whether auth was set during THIS page visit (not loaded from stale storage)
  const justLoggedIn = useRef(false);

  // Clear any stale auth state from a previous session when login page mounts
  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redirectToProjectsHome = useCallback(() => {
    if (projectsAppUrl) {
      relayAuthSnapshotForSwitch();
      window.location.href = projectsAppUrl;
      return;
    }
    navigate('/dashboard', { replace: true });
  }, [navigate, projectsAppUrl]);

  // Only redirect when the user freshly logged in during this page visit
  useEffect(() => {
    if (!isAuthenticated || !justLoggedIn.current) return;
    if (user?.mustChangePassword) {
      navigate('/change-password', { replace: true });
      return;
    }
    redirectToProjectsHome();
  }, [isAuthenticated, user?.mustChangePassword, navigate, redirectToProjectsHome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1) Try employee login
    try {
      const response = await authService.login({ username, password });
      if (response.data.success && response.data.data) {
        justLoggedIn.current = true;
        login(response.data.data);
        // useEffect (watching isAuthenticated + justLoggedIn.current) will handle redirect
        return;
      }
      // 200 OK but credentials wrong — don't fall through to client login
      setError(response.data.message || 'Identifiants invalides');
      setLoading(false);
      return;
    } catch {
      // 4xx/network error → try client login below
    }

    // 2) Try client login
    try {
      const clientRes = await authService.clientLogin(username, password);
      if (clientRes.data.success && clientRes.data.data) {
        const c = clientRes.data.data;
        justLoggedIn.current = true;
        login({
          compteId: 0,
          employeId: 0,
          username: c.loginClient,
          nom: c.nom,
          prenom: '',
          email: c.email || '',
          roles: c.roles,
          permissions: c.permissions,
          mustChangePassword: false,
          genre: null,
          message: '',
          imageUrl: null,
          isClient: true,
          clientId: c.clientId,
          clientPages: c.clientPages ?? [],
        });
        // useEffect will handle redirect
        return;
      }
      setError(clientRes.data.message || 'Identifiants invalides');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Identifiants invalides');
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
          <div className="inline-flex items-center justify-center mb-4">
            <Logo3D size={80} />
          </div>
          <h1 className="text-3xl font-bold text-white">Antigone</h1>
          <p className="text-white/60 mt-1">Gestion des Ressources Humaines</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 bg-error-500/20 border border-error-500/30 rounded-lg text-error-300 text-theme-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-theme-sm text-white/70 mb-1.5">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                placeholder="Entrez votre identifiant"
                required
              />
            </div>

            <div>
              <label className="block text-theme-sm text-white/70 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                  placeholder="Entrez votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.243 4.243l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-theme-sm text-brand-400 hover:text-brand-300 transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-brand-500/30"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-theme-sm mt-6">
          © 2026 Antigone-IT. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
