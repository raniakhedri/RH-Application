import React, { useState, useEffect } from 'react';
import { HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { validationService } from '../api/validationService';
import { Validation, DecisionValidation } from '../types';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const decisionBadgeMap: Record<string, 'warning' | 'success' | 'danger'> = {
  EN_ATTENTE: 'warning',
  APPROUVEE: 'success',
  REFUSEE: 'danger',
};

const ValidationsPage: React.FC = () => {
  const { user } = useAuth();
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState<Validation | null>(null);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    if (user) loadValidations();
  }, [user]);

  const loadValidations = async () => {
    try {
      const response = await validationService.getByValidateur(user!.employeId);
      setValidations(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement validations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (validation: Validation) => {
    setSelectedValidation(validation);
    setCommentaire('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedValidation) return;
    try {
      await validationService.approve(selectedValidation.id, commentaire);
      setShowModal(false);
      loadValidations();
    } catch (err) {
      console.error('Erreur approbation:', err);
    }
  };

  const handleRefuse = async () => {
    if (!selectedValidation) return;
    try {
      await validationService.refuse(selectedValidation.id, commentaire);
      setShowModal(false);
      loadValidations();
    } catch (err) {
      console.error('Erreur refus:', err);
    }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'demandeId', label: 'Demande #' },
    { key: 'ordre', label: 'Ordre' },
    {
      key: 'decision',
      label: 'Décision',
      render: (item: Validation) => (
        <Badge text={item.decision} variant={decisionBadgeMap[item.decision] || 'neutral'} />
      ),
    },
    {
      key: 'dateValidation',
      label: 'Date',
      render: (item: Validation) => (
        <span className="text-theme-sm text-gray-600 dark:text-gray-400">
          {item.dateValidation || '-'}
        </span>
      ),
    },
    {
      key: 'commentaire',
      label: 'Commentaire',
      render: (item: Validation) => (
        <span className="text-theme-sm text-gray-500 truncate max-w-[200px] block">
          {item.commentaire || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Validation) =>
        item.decision === 'EN_ATTENTE' ? (
          <Button size="sm" onClick={() => handleAction(item)}>
            Traiter
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Validations</h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
          Approuver ou refuser les demandes en attente
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
      ) : (
        <DataTable columns={columns} data={validations} />
      )}

      {/* Action Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Traiter la validation">
        <div className="space-y-4">
          <p className="text-theme-sm text-gray-600 dark:text-gray-300">
            Demande #{selectedValidation?.demandeId} — Étape {selectedValidation?.ordre}
          </p>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Commentaire (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              placeholder="Ajoutez un commentaire..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="danger" onClick={handleRefuse}>
              <HiOutlineX size={16} /> Refuser
            </Button>
            <Button onClick={handleApprove}>
              <HiOutlineCheck size={16} /> Approuver
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ValidationsPage;
