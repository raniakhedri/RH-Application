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

const monthlyData = [
  { month: 'Jan', demandes: 12, validees: 10 },
  { month: 'Fév', demandes: 19, validees: 15 },
  { month: 'Mar', demandes: 15, validees: 13 },
  { month: 'Avr', demandes: 22, validees: 18 },
  { month: 'Mai', demandes: 28, validees: 24 },
  { month: 'Jun', demandes: 20, validees: 17 },
];

const demandeTypeData = [
  { name: 'Congé', value: 45, color: '#f36904' },
  { name: 'Autorisation', value: 25, color: '#683B77' },
  { name: 'Télétravail', value: 20, color: '#3b82f6' },
  { name: 'Administration', value: 10, color: '#10b981' },
];

const recentActivities = [
  { id: 1, text: 'Ahmed Benali a soumis une demande de congé', time: 'Il y a 2h', type: 'demande' },
  { id: 3, text: 'Projet "Campagne Été" passé en cours', time: 'Il y a 5h', type: 'projet' },
  { id: 4, text: 'Validation approuvée par Karim El Idrissi', time: 'Hier', type: 'validation' },
  { id: 5, text: 'Nouvelle tâche assignée à Sara Alaoui', time: 'Hier', type: 'tache' },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

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
          value={48}
          icon={<HiOutlineUsers size={24} />}
          change="+3 ce mois"
          changeType="positive"
          color="primary"
        />
        <StatCard
          title="Demandes en attente"
          value={12}
          icon={<HiOutlineDocumentText size={24} />}
          change="5 nouvelles"
          changeType="neutral"
          color="warning"
        />
        <StatCard
          title="Présents aujourd'hui"
          value={42}
          icon={<HiOutlineClock size={24} />}
          change="87.5% présence"
          changeType="positive"
          color="success"
        />
        <StatCard
          title="Projets actifs"
          value={8}
          icon={<HiOutlineBriefcase size={24} />}
          change="2 en retard"
          changeType="negative"
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
