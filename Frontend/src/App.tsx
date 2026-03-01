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
import PointagePage from './pages/PointagePage';
import ProjetsPage from './pages/ProjetsPage';
import TachesPage from './pages/TachesPage';
import EquipesPage from './pages/EquipesPage';
import ReferentielsPage from './pages/ReferentielsPage';
import CalendrierPage from './pages/CalendrierPage';
import ComptesPage from './pages/ComptesPage';
import RolesPage from './pages/RolesPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MonProfilPage from './pages/MonProfilPage';
import MonCalendrierPage from './pages/MonCalendrierPage';
import MesDemandesPage from './pages/MesDemandesPage';

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
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
        <Route path="demandes" element={<PermissionRoute permission="VIEW_DEMANDES"><DemandesPage /></PermissionRoute>} />
        <Route path="demandes/new" element={<PermissionRoute permission="VIEW_DEMANDES"><NewDemandePage /></PermissionRoute>} />
        <Route path="mes-demandes" element={<MesDemandesPage />} />
        <Route path="validations" element={<PermissionRoute permission="VIEW_VALIDATIONS"><ValidationsPage /></PermissionRoute>} />
        <Route path="pointage" element={<PermissionRoute permission="VIEW_POINTAGE"><PointagePage /></PermissionRoute>} />
        <Route path="projets" element={<PermissionRoute permission="VIEW_PROJETS"><ProjetsPage /></PermissionRoute>} />
        <Route path="taches" element={<PermissionRoute permission="VIEW_PROJETS"><TachesPage /></PermissionRoute>} />
        <Route path="equipes" element={<PermissionRoute permission="VIEW_EQUIPES"><EquipesPage /></PermissionRoute>} />
        <Route path="referentiels" element={<PermissionRoute permission="VIEW_REFERENTIELS"><ReferentielsPage /></PermissionRoute>} />
        <Route path="calendrier" element={<PermissionRoute permission="VIEW_CALENDRIER"><CalendrierPage /></PermissionRoute>} />
        <Route path="mon-calendrier" element={<MonCalendrierPage />} />
        <Route path="comptes" element={<PermissionRoute permission="VIEW_COMPTES"><ComptesPage /></PermissionRoute>} />
        <Route path="roles" element={<PermissionRoute permission="VIEW_ROLES"><RolesPage /></PermissionRoute>} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="mon-profil" element={<MonProfilPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
