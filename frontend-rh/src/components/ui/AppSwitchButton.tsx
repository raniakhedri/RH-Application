import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { relayAuthSnapshotForSwitch } from '../../utils/authStorage';

const resolveAppKind = (): 'projects' | 'rh' => {
  const appKind = (import.meta.env.VITE_APP_KIND as string | undefined)?.trim().toLowerCase();
  return appKind === 'rh' ? 'rh' : 'projects';
};

type AppKind = 'projects' | 'rh';

const shellStyle: React.CSSProperties = {
  position: 'fixed',
  right: '24px',
  bottom: '24px',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(232, 230, 224, 0.95)',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)'
};

const baseButtonStyle: React.CSSProperties = {
  minWidth: '112px',
  height: '44px',
  borderRadius: '999px',
  border: 'none',
  padding: '0 16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.01em',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const activeButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #E86A2E 0%, #F5A87A 100%)',
  color: '#ffffff',
  boxShadow: '0 8px 18px rgba(232, 106, 46, 0.28)',
  transform: 'translateY(-1px)'
};

const inactiveButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#8d8a84'
};

const hoverButtonStyle: React.CSSProperties = {
  background: '#f5f4f1',
  color: '#1a1814'
};

const AppSwitchButton: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hoveredOption, setHoveredOption] = React.useState<AppKind | null>(null);

  if (!isAuthenticated) return null;

  const appKind = resolveAppKind();
  const targetLabel = appKind === 'projects' ? 'RH' : 'Projets';

  const switchTo = (targetApp: AppKind) => {
    if (targetApp === appKind) {
      return;
    }

    const targetUrl = targetApp === 'rh'
      ? (import.meta.env.VITE_RH_APP_URL as string | undefined)?.trim()
      : (import.meta.env.VITE_PROJECTS_APP_URL as string | undefined)?.trim();

    const fallbackPath = targetApp === 'rh' ? '/dashboard-rh' : '/dashboard';

    if (targetUrl) {
      relayAuthSnapshotForSwitch();
      window.location.href = targetUrl;
      return;
    }

    navigate(fallbackPath);
  };

  const getButtonStyle = (option: AppKind): React.CSSProperties => {
    const isActive = option === appKind;
    const isHovered = hoveredOption === option;
    return {
      ...baseButtonStyle,
      ...(isActive ? activeButtonStyle : inactiveButtonStyle),
      ...(isHovered && !isActive ? hoverButtonStyle : {}),
      cursor: isActive ? 'default' : 'pointer'
    };
  };

  return (
    <div
      style={{
        ...shellStyle,
        transform: 'translateZ(0)'
      }}
    >
      <button
        type="button"
        onClick={() => switchTo('projects')}
        onMouseEnter={() => setHoveredOption('projects')}
        onMouseLeave={() => setHoveredOption(null)}
        style={getButtonStyle('projects')}
        disabled={appKind === 'projects'}
        title="Aller vers Projets"
      >
        <span aria-hidden="true">💼</span>
        <span>Projets</span>
      </button>

      <span
        aria-hidden="true"
        style={{
          width: '1px',
          height: '20px',
          background: '#e8e6e0',
          flexShrink: 0
        }}
      />

      <button
        type="button"
        onClick={() => switchTo('rh')}
        onMouseEnter={() => setHoveredOption('rh')}
        onMouseLeave={() => setHoveredOption(null)}
        style={getButtonStyle('rh')}
        disabled={appKind === 'rh'}
        title="Aller vers RH"
      >
        <span aria-hidden="true">👥</span>
        <span>RH</span>
      </button>

      <span
        style={{
          position: 'absolute',
          right: '0',
          bottom: '62px',
          transform: 'translateY(4px)',
          background: '#1a1814',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          padding: '5px 10px',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          opacity: hoveredOption ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
          boxShadow: '0 8px 18px rgba(0,0,0,0.18)'
        }}
      >
        {`Aller vers ${targetLabel}`}
      </span>
    </div>
  );
};

export default AppSwitchButton;
