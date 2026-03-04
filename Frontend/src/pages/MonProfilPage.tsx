import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeService } from '../api/employeService';
import { Employe } from '../types';

const MonProfilPage: React.FC = () => {
  const { user } = useAuth();
  const [employe, setEmploye] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.employeId) return;
      try {
        const response = await employeService.getById(user.employeId);
        setEmploye(response.data.data);
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <div className="text-center py-10 text-gray-500">Chargement...</div>;
  if (!employe) return <div className="text-center py-10 text-gray-500">Profil non trouvé</div>;

  const field = (label: string, value: string | number | null | undefined) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{value ?? '-'}</dd>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Mon Profil</h1>

      {employe.imageUrl && (
        <div className="mb-6 flex justify-center">
          <img
            src={`http://localhost:8080${employe.imageUrl}`}
            alt="Photo de profil"
            className="w-32 h-32 rounded-full object-cover border-4 border-brand-200 dark:border-brand-700"
          />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Matricule', employe.matricule)}
          {field('Nom', employe.nom)}
          {field('Prénom', employe.prenom)}
          {field('Email', employe.email)}
          {field('Téléphone', employe.telephone)}
          {field('CIN', employe.cin)}
          {field('CNSS', employe.cnss)}
          {field('Genre', employe.genre)}
          {field("Date d'embauche", employe.dateEmbauche)}
          {field('Poste', employe.poste)}
          {field('Département', employe.departement)}
          {field('Type de contrat', employe.typeContrat)}
          {field('Solde congé', employe.soldeConge)}
          {field('RIB Bancaire', employe.ribBancaire)}
          {field('Salaire de base', employe.salaireBase ? `${employe.salaireBase} TND` : '-')}
          {field('Manager', employe.managerNom)}
        </dl>
      </div>
    </div>
  );
};

export default MonProfilPage;
