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
import MonCalendrierPage from './pages/MonCalendrierPage';
import MesDemandesPage from './pages/MesDemandesPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
        <Route path="employes" element={<EmployesPage />} />
        <Route path="demandes" element={<DemandesPage />} />
        <Route path="demandes/new" element={<NewDemandePage />} />
        <Route path="mes-demandes" element={<MesDemandesPage />} />
        <Route path="validations" element={<ValidationsPage />} />
        <Route path="pointage" element={<PointagePage />} />
        <Route path="projets" element={<ProjetsPage />} />
        <Route path="taches" element={<TachesPage />} />
        <Route path="equipes" element={<EquipesPage />} />
        <Route path="referentiels" element={<ReferentielsPage />} />
        <Route path="calendrier" element={<CalendrierPage />} />
        <Route path="mon-calendrier" element={<MonCalendrierPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
