import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

const AgentDownloadBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [agentInfo, setAgentInfo] = useState<{
    available: boolean;
    fileName?: string;
    fileSizeMB?: string;
    version?: string;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà téléchargé l'agent
    const dismissed = localStorage.getItem('agent_download_dismissed');
    if (dismissed) return;

    // Vérifier si l'agent est disponible
    checkAgentAvailability();
  }, []);

  const checkAgentAvailability = async () => {
    try {
      const response = await axios.get('/api/agent/download/info');
      if (response.data.available) {
        setAgentInfo(response.data);
        setShowBanner(true);
      }
    } catch {
      // Silently fail
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await axios.get('/api/agent/download', {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', agentInfo?.fileName || 'Antigone-RH-Agent-Setup.exe');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Marquer comme téléchargé
      localStorage.setItem('agent_download_dismissed', 'downloaded');
      
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    } catch {
      alert('Erreur lors du téléchargement. Réessayez.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('agent_download_dismissed', 'dismissed');
    setShowBanner(false);
  };

  if (!showBanner || !agentInfo) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 shadow-lg" style={{ zIndex: 1000 }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🖥️</span>
          <div>
            <p className="font-semibold text-sm">
              Agent de Monitoring - Installation requise
            </p>
            <p className="text-xs text-blue-100">
              Installez l'agent Antigone RH sur votre poste pour activer le pointage automatique 
              et le suivi de présence. ({agentInfo.fileSizeMB} MB)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-semibold 
                       hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Téléchargement...
              </span>
            ) : (
              '⬇️ Télécharger l\'agent'
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white px-2 py-1 text-lg"
            title="Fermer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentDownloadBanner;
