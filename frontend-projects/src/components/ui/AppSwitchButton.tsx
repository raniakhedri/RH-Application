import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { relayAuthSnapshotForSwitch } from '../../utils/authStorage';

const resolveAppKind = (): 'projects' | 'rh' => {
  const appKind = (import.meta.env.VITE_APP_KIND as string | undefined)?.trim().toLowerCase();
  return appKind === 'rh' ? 'rh' : 'projects';
};

const AppSwitchButton: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return null;
  if (user?.isClient) return null;  // Clients never switch apps

  const appKind = resolveAppKind();
  const targetUrl = appKind === 'projects'
    ? (import.meta.env.VITE_RH_APP_URL as string | undefined)?.trim()
    : (import.meta.env.VITE_PROJECTS_APP_URL as string | undefined)?.trim();

  const fallbackPath = appKind === 'projects' ? '/dashboard-rh' : '/dashboard';
  const targetLabel = appKind === 'projects' ? 'RH' : 'Projets';

  const handleSwitch = () => {
    if (targetUrl) {
      relayAuthSnapshotForSwitch();
      window.location.href = targetUrl;
      return;
    }
    navigate(fallbackPath);
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      title={`Basculer vers ${targetLabel}`}
      className="fixed bottom-6 right-6 z-[10000] rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-300"
    >
      {`Aller vers ${targetLabel}`}
    </button>
  );
};

export default AppSwitchButton;
