import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployesPage from './pages/EmployesPage';
import DemandesPage from './pages/DemandesPage';
import NewDemandePage from './pages/NewDemandePage';
import ValidationsPage from './pages/ValidationsPage';
import NewDemandePapierPage from './pages/NewDemandePapierPage';
import DemandesPapierPage from './pages/DemandesPapierPage';
import PointagePage from './pages/PointagePage';
import ProjetsPage from './pages/ProjetsPage';
import TachesPage from './pages/TachesPage';
import EquipesPage from './pages/EquipesPage';
import ReferentielsPage from './pages/ReferentielsPage';
import CalendrierPage from './pages/CalendrierPage';
import ComptesPage from './pages/ComptesPage';
import RolesPage from './pages/RolesPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MonProfilPage from './pages/MonProfilPage';
import MonCalendrierPage from './pages/MonCalendrierPage';
import MesDemandesPage from './pages/MesDemandesPage';

import MesTachesPage from './pages/MesTachesPage';
import ProjetTachesPage from './pages/ProjetTachesPage';

import MesDemandesPapierPage from './pages/MesDemandesPapierPage';
import OrganigrammePage from './pages/OrganigrammePage';
import SuiviTempsReelPage from './pages/SuiviTempsReelPage';
import RapportsInactivitePage from './pages/RapportsInactivitePage';
import HistoriqueAgentPage from './pages/HistoriqueAgentPage';
import TousProjetsAdminPage from './pages/TousProjetsAdminPage';
import DashboardRHPage from './pages/DashboardRHPage';
import { NotificationProvider } from './context/NotificationContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PermissionRoute: React.FC<{ permission: string; children: React.ReactNode }> = ({ permission, children }) => {
  const { user } = useAuth();
  const hasPermission = user?.permissions?.includes(permission);
  if (!hasPermission) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employes" element={<PermissionRoute permission="VIEW_EMPLOYES"><EmployesPage /></PermissionRoute>} />
          <Route path="organigramme" element={<PermissionRoute permission="VIEW_EMPLOYES"><OrganigrammePage /></PermissionRoute>} />
          <Route path="demandes" element={<PermissionRoute permission="VIEW_DEMANDES"><DemandesPage /></PermissionRoute>} />
          <Route path="demandes/new" element={<PermissionRoute permission="VIEW_DEMANDES"><NewDemandePage /></PermissionRoute>} />
          <Route path="demandes/edit/:id" element={<NewDemandePage />} />
          <Route path="mes-demandes" element={<MesDemandesPage />} />
          <Route path="mes-demandes/papier" element={<MesDemandesPapierPage />} />
          <Route path="validations" element={<PermissionRoute permission="VIEW_VALIDATIONS"><ValidationsPage /></PermissionRoute>} />
          <Route path="projets" element={<PermissionRoute permission="VIEW_PROJETS"><ProjetsPage /></PermissionRoute>} />
          <Route path="taches" element={<PermissionRoute permission="VIEW_PROJETS"><TachesPage /></PermissionRoute>} />
          <Route path="equipes" element={<PermissionRoute permission="VIEW_EQUIPES"><EquipesPage /></PermissionRoute>} />
          <Route path="referentiels" element={<PermissionRoute permission="VIEW_REFERENTIELS"><ReferentielsPage /></PermissionRoute>} />
          <Route path="calendrier" element={<PermissionRoute permission="VIEW_CALENDRIER"><CalendrierPage /></PermissionRoute>} />
          <Route path="mon-calendrier" element={<MonCalendrierPage />} />
          <Route path="comptes" element={<PermissionRoute permission="VIEW_COMPTES"><ComptesPage /></PermissionRoute>} />
          <Route path="roles" element={<PermissionRoute permission="VIEW_ROLES"><RolesPage /></PermissionRoute>} />
          <Route path="mon-profil" element={<MonProfilPage />} />
          <Route path="demandes/papier" element={<NewDemandePapierPage />} />
          <Route path="demandes/liste-papier" element={<DemandesPapierPage />} />
          <Route path="mes-taches" element={<MesTachesPage />} />
          <Route path="mes-demandes-papier" element={<MesDemandesPapierPage />} />
          <Route path="projets/:projetId/taches" element={<PermissionRoute permission="VIEW_PROJETS"><ProjetTachesPage /></PermissionRoute>} />
          <Route path="suivi-temps-reel" element={<PermissionRoute permission="VIEW_MONITORING"><SuiviTempsReelPage /></PermissionRoute>} />
          <Route path="rapports-inactivite" element={<PermissionRoute permission="VIEW_MONITORING"><RapportsInactivitePage /></PermissionRoute>} />
          <Route path="historique-agent" element={<PermissionRoute permission="VIEW_MONITORING"><HistoriqueAgentPage /></PermissionRoute>} />
          <Route path="admin/projets" element={<PermissionRoute permission="VIEW_TOUS_PROJETS"><TousProjetsAdminPage /></PermissionRoute>} />
          <Route path="dashboard-rh" element={<PermissionRoute permission="VIEW_DASHBOARD_RH"><DashboardRHPage /></PermissionRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </NotificationProvider>
  );
};

export default App;
