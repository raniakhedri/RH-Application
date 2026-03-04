import React, { useEffect, useState } from 'react';
import { fichePaieService } from '../api/fichePaieService';
import { FichePaie, StatutFichePaie } from '../types';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const moisLabels = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const FichesPaiePage: React.FC = () => {
  const { user } = useAuth();
  const [fiches, setFiches] = useState<FichePaie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMois, setSelectedMois] = useState(new Date().getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<FichePaie | null>(null);

  useEffect(() => {
    loadFiches();
  }, [selectedMois, selectedAnnee]);

  const loadFiches = async () => {
    try {
      setLoading(true);
      const res = await fichePaieService.getByMoisAndAnnee(selectedMois, selectedAnnee);
      setFiches(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerer = async () => {
    try {
      setGenerating(true);
      await fichePaieService.generer(selectedMois, selectedAnnee);
      await loadFiches();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleValider = async (ficheId: number) => {
    if (!user?.employeId) return;
    try {
      await fichePaieService.valider(ficheId, user.employeId);
      await loadFiches();
      setSelectedFiche(null);
    } catch (err) {
      console.error(err);
    }
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(montant);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fiches de Paie</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedMois}
            onChange={(e) => setSelectedMois(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {moisLabels.slice(1).map((label, i) => (
              <option key={i + 1} value={i + 1}>{label}</option>
            ))}
          </select>
          <input
            type="number"
            value={selectedAnnee}
            onChange={(e) => setSelectedAnnee(Number(e.target.value))}
            className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Button onClick={handleGenerer} disabled={generating}>
            {generating ? 'Génération...' : 'Générer les fiches'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : fiches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucune fiche de paie pour {moisLabels[selectedMois]} {selectedAnnee}.
          <br />Cliquez sur "Générer les fiches" pour créer les fiches du mois.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Employé</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Matricule</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Salaire Base</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Retard (min)</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Pénalité</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Inactivité</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Score</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">Net</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {fiches.map((fiche) => (
                <tr key={fiche.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 text-sm dark:text-gray-200">{fiche.employeNom} {fiche.employePrenom}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{fiche.employeMatricule}</td>
                  <td className="px-4 py-3 text-sm text-right dark:text-gray-200">{formatMontant(fiche.salaireBase)}</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-600">{fiche.totalRetardMinutes}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">-{formatMontant(fiche.montantPenaliteRetard)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">-{formatMontant(fiche.montantDeductionInactivite)}</td>
                  <td className="px-4 py-3 text-sm text-right dark:text-gray-200">{fiche.scoreMoyen.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold dark:text-gray-200">{formatMontant(fiche.salaireNet)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={fiche.statut === 'VALIDEE' ? 'success' : 'warning'}>
                      {fiche.statut === 'VALIDEE' ? 'Validée' : 'Brouillon'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedFiche(fiche)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Détails
                      </button>
                      {fiche.statut === 'BROUILLON' && (
                        <button
                          onClick={() => handleValider(fiche.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Valider
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedFiche && (
        <Modal isOpen={true} onClose={() => setSelectedFiche(null)} title="Détail Fiche de Paie">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Employé</p>
                <p className="font-semibold">{selectedFiche.employeNom} {selectedFiche.employePrenom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Période</p>
                <p className="font-semibold">{moisLabels[selectedFiche.mois]} {selectedFiche.annee}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Salaire Base</p>
                <p className="font-semibold">{formatMontant(selectedFiche.salaireBase)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jours Présence</p>
                <p className="font-semibold">{selectedFiche.joursPresence}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Retard Total</p>
                <p className="font-semibold text-orange-600">{selectedFiche.totalRetardMinutes} min</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pénalité Retard</p>
                <p className="font-semibold text-red-600">-{formatMontant(selectedFiche.montantPenaliteRetard)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactivité Total</p>
                <p className="font-semibold text-orange-600">{selectedFiche.totalInactiviteMinutes} min</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Déduction Inactivité</p>
                <p className="font-semibold text-red-600">-{formatMontant(selectedFiche.montantDeductionInactivite)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Score Moyen</p>
                <p className="font-semibold">{selectedFiche.scoreMoyen.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Salaire Net</p>
                <p className="font-semibold text-green-600 text-lg">{formatMontant(selectedFiche.salaireNet)}</p>
              </div>
            </div>
            {selectedFiche.statut === 'BROUILLON' && (
              <div className="pt-4 border-t flex justify-end">
                <Button onClick={() => handleValider(selectedFiche.id)}>
                  Valider cette fiche
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FichesPaiePage;
