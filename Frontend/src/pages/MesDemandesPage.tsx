import React, { useEffect, useState } from 'react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { demandeService } from '../api/demandeService';
import { DemandeResponse } from '../types';
import { useNavigate } from 'react-router-dom';

const MesDemandesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.employeId) return;
      try {
        const response = await demandeService.getByEmploye(user.employeId);
        setDemandes(response.data.data || []);
      } catch (err) {
        console.error('Erreur chargement demandes:', err);
      }
    };
    load();
  }, [user]);

  const statutVariant = (s: string) => {
    switch (s) {
      case 'VALIDEE': case 'APPROUVEE': return 'success' as const;
      case 'REFUSEE': return 'danger' as const;
      case 'SOUMISE': case 'EN_VALIDATION': case 'EN_ATTENTE': return 'warning' as const;
      case 'ANNULEE': return 'neutral' as const;
      default: return 'info' as const;
    }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'type', label: 'Type' },
    {
      key: 'dateCreation',
      label: 'Date création',
      render: (d: DemandeResponse) => new Date(d.dateCreation).toLocaleDateString('fr-FR'),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (d: DemandeResponse) => <Badge text={d.statut} variant={statutVariant(d.statut)} />,
    },
    { key: 'raison', label: 'Raison' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mes Demandes</h1>
        <Button onClick={() => navigate('/demandes/new')}>Nouvelle demande</Button>
      </div>
      <DataTable columns={columns} data={demandes} />
    </div>
  );
};

export default MesDemandesPage;
