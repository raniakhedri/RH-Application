import React, { useState, useEffect } from 'react';
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';
import { employeService } from '../api/employeService';
import { demandeService } from '../api/demandeService';
import { agentService } from '../api/agentDashboardService';
import { projetService } from '../api/projetService';

const demandeTypeColors: Record<string, string> = {
  'CONGE': '#f36904',
  'AUTORISATION': '#683B77',
  'TELETRAVAIL': '#3b82f6',
  'DOCUMENT_ADMINISTRATIF': '#10b981',
  'AUTRE': '#6b7280',
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [totalEmployes, setTotalEmployes] = useState(0);
  const [demandesEnAttente, setDemandesEnAttente] = useState(0);
  const [presentsAujourdhui, setPresentsAujourdhui] = useState(0);
  const [totalPointageAujourdhui, setTotalPointageAujourdhui] = useState(0);
  const [projetsActifs, setProjetsActifs] = useState(0);
  const [retardsAujourdhui, setRetardsAujourdhui] = useState(0);
  const [absentsAujourdhui, setAbsentsAujourdhui] = useState(0);
  const [demandeTypeData, setDemandeTypeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; demandes: number; validees: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<{ id: number; text: string; time: string; type: string }[]>([]);
  const [agentsActifs, setAgentsActifs] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [empRes, demRes, dashRes, projRes] = await Promise.all([
        employeService.getAll().catch(() => null),
        demandeService.getAll().catch(() => null),
        agentService.getDashboard().catch(() => null),
        projetService.getAll().catch(() => null),
      ]);

      // Total employés
      const employes = empRes?.data?.data || [];
      setTotalEmployes(employes.length);

      // Demandes - en attente + stats
      const demandes = demRes?.data?.data || [];
      const enAttente = demandes.filter((d: any) => d.statut === 'EN_ATTENTE');
      setDemandesEnAttente(enAttente.length);

      // Demandes par type (pie chart)
      const typeCount: Record<string, number> = {};
      demandes.forEach((d: any) => {
        const t = d.typeDemande || d.type || 'AUTRE';
        typeCount[t] = (typeCount[t] || 0) + 1;
      });
      const typeLabels: Record<string, string> = {
        'CONGE': 'Congé',
        'AUTORISATION': 'Autorisation',
        'TELETRAVAIL': 'Télétravail',
        'DOCUMENT_ADMINISTRATIF': 'Administration',
      };
      setDemandeTypeData(
        Object.entries(typeCount).map(([key, value]) => ({
          name: typeLabels[key] || key,
          value,
          color: demandeTypeColors[key] || '#6b7280',
        }))
      );

      // Demandes mensuelle (bar chart) - 6 derniers mois
      const now = new Date();
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthly: { month: string; demandes: number; validees: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        const filtered = demandes.filter((dm: any) => {
          const date = new Date(dm.dateCreation || dm.dateSoumission);
          return date.getMonth() === m && date.getFullYear() === y;
        });
        const validees = filtered.filter((dm: any) => dm.statut === 'APPROUVEE' || dm.statut === 'VALIDEE');
        monthly.push({
          month: monthNames[m],
          demandes: filtered.length,
          validees: validees.length,
        });
      }
      setMonthlyData(monthly);

      // Activités récentes (dernières demandes)
      const sorted = [...demandes]
        .sort((a: any, b: any) => new Date(b.dateCreation || b.dateSoumission).getTime() - new Date(a.dateCreation || a.dateSoumission).getTime())
        .slice(0, 5);
      setRecentActivities(
        sorted.map((d: any, i: number) => {
          const date = new Date(d.dateCreation || d.dateSoumission);
          const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
          const timeStr = diff < 1 ? 'Il y a moins d\'1h' : diff < 24 ? `Il y a ${diff}h` : `Il y a ${Math.floor(diff / 24)}j`;
          return {
            id: d.id || i,
            text: `${d.employeNom || ''} ${d.employePrenom || ''} - ${typeLabels[d.typeDemande] || d.typeDemande || 'Demande'} (${d.statut})`,
            time: timeStr,
            type: 'demande',
          };
        })
      );

      // Dashboard temps réel (présents, retards, absents)
      const dashboard = dashRes?.data?.data || [];
      const presents = dashboard.filter((s: any) => s.statut === 'PRESENT').length;
      const retards = dashboard.filter((s: any) => s.statut === 'RETARD').length;
      const absents = dashboard.filter((s: any) => s.statut === 'ABSENT').length;
      setPresentsAujourdhui(presents + retards); // retards sont aussi présents
      setRetardsAujourdhui(retards);
      setAbsentsAujourdhui(absents);
      setTotalPointageAujourdhui(dashboard.length);
      setAgentsActifs(dashboard.filter((s: any) => s.agentActif).length);

      // Projets actifs
      const projets = projRes?.data?.data || [];
      const actifs = projets.filter((p: any) => p.statut === 'EN_COURS');
      setProjetsActifs(actifs.length);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    }
  };

  const presencePercent = totalPointageAujourdhui > 0
    ? ((presentsAujourdhui / totalPointageAujourdhui) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 p-6 text-white">
        <h1 className="text-2xl font-bold">
          Bonjour, {user?.prenom || 'Utilisateur'} 👋
        </h1>
        <p className="text-white/80 mt-1">
          Voici un aperçu de votre espace RH pour aujourd'hui.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employés"
          value={totalEmployes}
          icon={<HiOutlineUsers size={24} />}
          change={`${agentsActifs} agents actifs`}
          changeType="neutral"
          color="primary"
        />
        <StatCard
          title="Demandes en attente"
          value={demandesEnAttente}
          icon={<HiOutlineDocumentText size={24} />}
          change={demandesEnAttente > 0 ? `${demandesEnAttente} à traiter` : 'Aucune'}
          changeType={demandesEnAttente > 0 ? 'neutral' : 'positive'}
          color="warning"
        />
        <StatCard
          title="Présents aujourd'hui"
          value={presentsAujourdhui}
          icon={<HiOutlineClock size={24} />}
          change={`${presencePercent}% présence${retardsAujourdhui > 0 ? ` · ${retardsAujourdhui} retard${retardsAujourdhui > 1 ? 's' : ''}` : ''}`}
          changeType={Number(presencePercent) >= 80 ? 'positive' : 'negative'}
          color="success"
        />
        <StatCard
          title="Projets actifs"
          value={projetsActifs}
          icon={<HiOutlineBriefcase size={24} />}
          change={`${absentsAujourdhui} absent${absentsAujourdhui > 1 ? 's' : ''} aujourd'hui`}
          changeType={absentsAujourdhui > 0 ? 'negative' : 'positive'}
          color="secondary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
          <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white mb-4">Demandes mensuelles</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
              <XAxis dataKey="month" stroke="#667085" fontSize={12} />
              <YAxis stroke="#667085" fontSize={12} />
              <Tooltip />
              <Bar dataKey="demandes" fill="#f36904" radius={[4, 4, 0, 0]} name="Demandes" />
              <Bar dataKey="validees" fill="#683B77" radius={[4, 4, 0, 0]} name="Validées" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
          <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white mb-4">Types de demandes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={demandeTypeData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {demandeTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
        <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white mb-4">Activité récente</h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'demande' ? 'bg-brand-500' :
                activity.type === 'pointage' ? 'bg-success-500' :
                activity.type === 'projet' ? 'bg-brand-400' :
                activity.type === 'validation' ? 'bg-secondary-500' :
                'bg-warning-500'
              }`} />
              <p className="flex-1 text-theme-sm text-gray-700 dark:text-gray-300">{activity.text}</p>
              <span className="text-theme-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
