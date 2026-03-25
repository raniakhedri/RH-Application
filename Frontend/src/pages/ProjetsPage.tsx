import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClipboardList } from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { employeService } from '../api/employeService';
import { demandeService } from '../api/demandeService';
import { useAuth } from '../context/AuthContext';
import { Projet, StatutProjet, Employe, StatutDemande } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const statutBadgeMap: Record<string, 'neutral' | 'primary' | 'success' | 'danger'> = {
  PLANIFIE: 'neutral',
  EN_COURS: 'primary',
  CLOTURE: 'success',
  ANNULE: 'danger',
};

const ProjetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    dateDebut: '',
    dateFin: '',
    statut: StatutProjet.PLANIFIE,
    chefDeProjetId: null as number | null,
  });
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [managers, setManagers] = useState<Employe[]>([]);
  const [subordinates, setSubordinates] = useState<Employe[]>([]);
  const [selectedMembreIds, setSelectedMembreIds] = useState<number[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [congeAujourdhuiIds, setCongeAujourdhuiIds] = useState<Set<number>>(new Set());

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userId = user?.employeId;
      const [pRes, empRes, managersRes, demandesRes] = await Promise.all([
        userId ? projetService.getByEmploye(userId) : projetService.getAll(),
        employeService.getAll(),
        employeService.getByRole('MANAGER'),
        demandeService.getByStatut(StatutDemande.APPROUVEE),
      ]);
      setProjets(pRes.data.data || []);
      setEmployes(empRes.data.data || []);
      setManagers(managersRes.data.data || []);
      // Build set of employeIds on congé today
      const demandes = demandesRes.data.data || [];
      const onConge = new Set<number>();
      demandes.forEach(d => {
        if (d.dateDebut && d.dateFin && d.employeId) {
          const debut = d.dateDebut.toString().substring(0, 10);
          const fin = d.dateFin.toString().substring(0, 10);
          if (debut <= today && today <= fin) {
            onConge.add(d.employeId);
          }
        }
      });
      setCongeAujourdhuiIds(onConge);
    } catch (err) {
      console.error('Erreur chargement projets:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateDates = (): boolean => {
    if (!editingProjet) {
      if (formData.dateDebut && formData.dateDebut < today) {
        setDateError('La date de début doit être aujourd\'hui ou plus tard');
        return false;
      }
    }
    if (formData.dateDebut && formData.dateFin && formData.dateFin <= formData.dateDebut) {
      setDateError('La date de fin doit être après la date de début');
      return false;
    }
    setDateError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateDates()) return;
    try {
      const payload = {
        ...formData,
        chefDeProjetId: formData.chefDeProjetId || null,
        createurId: editingProjet ? undefined : user?.employeId,
      };
      if (editingProjet) {
        await projetService.update(editingProjet.id, payload);
      } else {
        await projetService.create(payload as any);
      }
      setShowModal(false);
      setEditingProjet(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde projet:', err);
      const msg = err?.response?.data?.message || 'Erreur lors de la sauvegarde du projet';
      setDateError(msg);
    }
  };

  const handleEdit = (projet: Projet) => {
    setEditingProjet(projet);
    setFormData({
      nom: projet.nom,
      dateDebut: projet.dateDebut,
      dateFin: projet.dateFin,
      statut: projet.statut,
      chefDeProjetId: projet.chefDeProjet?.id || null,
    });
    setDateError(null);
    // If current user is the chef de projet for this project, load their subordinates
    const isChef = projet.chefDeProjet?.id === user?.employeId;
    if (isChef && user?.employeId) {
      setSelectedMembreIds((projet.membres ?? []).map((m) => m.id));
      setLoadingSubordinates(true);
      employeService.getSubordinates(user.employeId)
        .then((res) => setSubordinates(res.data.data || []))
        .catch(console.error)
        .finally(() => setLoadingSubordinates(false));
    }
    setShowModal(true);
  };

  const handleChefSave = async () => {
    if (!editingProjet) return;
    try {
      await projetService.update(editingProjet.id, {
        nom: editingProjet.nom,
        dateDebut: editingProjet.dateDebut as any,
        dateFin: editingProjet.dateFin as any,
        statut: editingProjet.statut as any,
        chefDeProjetId: editingProjet.chefDeProjet?.id || null,
        equipeIds: editingProjet.equipeIds || [],
        membreIds: selectedMembreIds,
      } as any);
      setShowModal(false);
      setEditingProjet(null);
      setSubordinates([]);
      setSelectedMembreIds([]);
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde membres:', err);
    }
  };

  const toggleMembre = (id: number) => {
    setSelectedMembreIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    confirm('Supprimer ce projet ?', async () => {
      try {
        await projetService.delete(id);
        loadData();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }, 'Supprimer le projet');
  };

  const handleChangeStatut = async (id: number, statut: StatutProjet) => {
    try {
      await projetService.changeStatut(id, statut);
      loadData();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      dateDebut: '',
      dateFin: '',
      statut: StatutProjet.PLANIFIE,
      chefDeProjetId: null,
    });
    setDateError(null);
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  const columns = [
    { key: 'id', label: '#' },
    {
      key: 'nom',
      label: 'Nom',
      render: (p: Projet) => (
        <span className="font-medium text-gray-800 dark:text-white">{p.nom}</span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (p: Projet) => <Badge text={p.statut} variant={statutBadgeMap[p.statut] || 'neutral'} />,
    },
    {
      key: 'chef',
      label: 'Chef',
      render: (p: Projet) => {
        if (!p.chefDeProjet) return '-';
        const isOnConge = congeAujourdhuiIds.has(p.chefDeProjet.id);
        return (
          <span className="flex items-center gap-2">
            {p.chefDeProjet.prenom} {p.chefDeProjet.nom}
            {isOnConge && (
              <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                En congé
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'membres',
      label: 'Membres',
      render: (p: Projet) => {
        const all: Array<{ id: number; prenom: string; nom: string; isChef?: boolean }> = [];
        if (p.chefDeProjet) all.push({ ...p.chefDeProjet, isChef: true });
        (p.membres ?? []).forEach(m => { if (!all.find(x => x.id === m.id)) all.push(m); });
        if (all.length === 0) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {all.map((m) => (
              <span
                key={m.id}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${m.isChef
                  ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
                  : 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/10 dark:text-secondary-400'}`}
              >
                <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${m.isChef ? 'bg-warning-200 dark:bg-warning-500/30' : 'bg-secondary-200 dark:bg-secondary-500/30'}`}>
                  {m.prenom?.[0]}{m.nom?.[0]}
                </span>
                {m.prenom} {m.nom}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'dateDebut',
      label: 'Début',
      render: (p: Projet) => {
        if (!p.dateDebut) return '-';
        const [y, m, d] = p.dateDebut.split('-');
        return `${d}/${m}/${y}`;
      }
    },
    {
      key: 'dateFin',
      label: 'Fin',
      render: (p: Projet) => {
        if (!p.dateFin) return '-';
        const [y, m, d] = p.dateFin.split('-');
        return `${d}/${m}/${y}`;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Projet) => (
        <div className="flex gap-1">
          {item.statut === 'PLANIFIE' && (
            <button
              onClick={() => handleChangeStatut(item.id, StatutProjet.EN_COURS)}
              className="rounded-lg p-1.5 text-success-500 hover:bg-success-50"
              title="Démarrer"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}
          {item.statut === 'EN_COURS' && (
            <button
              onClick={() => handleChangeStatut(item.id, StatutProjet.CLOTURE)}
              className="rounded-lg p-1.5 text-success-500 hover:bg-success-50"
              title="Clôturer"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}
          <button
            onClick={() => navigate(`/projets/${item.id}/taches`)}
            className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-50"
            title="Voir les tâches"
          >
            <HiOutlineClipboardList size={16} />
          </button>
          <button
            onClick={() => handleEdit(item)}
            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50"
          >
            <HiOutlinePencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"
          >
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Projets</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            Vos projets en tant que chef ou membre d'équipe
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProjet(null); setShowModal(true); }}>
          <HiOutlinePlus size={18} /> Nouveau projet
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable columns={columns} data={projets} onRowDoubleClick={handleEdit} />
      )}

      {/* Create/Edit Modal */}
      {(() => {
        const isChefEdit = !!editingProjet && editingProjet.chefDeProjet?.id === user?.employeId;
        return (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={isChefEdit ? 'Gérer les membres du projet' : editingProjet ? 'Modifier le projet' : 'Nouveau projet'}
            size="lg"
          >
            {isChefEdit ? (
              /* ── CHEF VIEW: only members picker ── */
              <div className="space-y-4">
                <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/5">
                  <p className="text-theme-sm font-semibold text-brand-700 dark:text-brand-300">{editingProjet.nom}</p>
                  <p className="mt-0.5 text-theme-xs text-brand-500">Sélectionnez les employés que vous souhaitez ajouter à ce projet.</p>
                </div>
                {loadingSubordinates ? (
                  <div className="py-6 text-center text-gray-400 text-theme-sm">Chargement des employés...</div>
                ) : subordinates.length === 0 ? (
                  <div className="rounded-lg bg-warning-50 px-4 py-3 text-theme-sm text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                    Aucun employé sous votre responsabilité.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {subordinates.map((sub) => {
                      const isSelected = selectedMembreIds.includes(sub.id);
                      const initials = `${sub.prenom?.[0] ?? ''}${sub.nom?.[0] ?? ''}`.toUpperCase();
                      return (
                        <label
                          key={sub.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${isSelected
                            ? 'border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10'
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMembre(sub.id)}
                            className="h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
                          />
                          {/* Avatar */}
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-theme-xs font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                            {initials}
                          </div>
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-theme-sm font-semibold text-gray-800 dark:text-white truncate">
                              {sub.prenom} {sub.nom}
                            </p>
                            {(sub.telephonePro || sub.telephone) && (
                              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                📞 {sub.telephonePro || sub.telephone}
                              </p>
                            )}
                            {sub.departement && (
                              <p className="text-theme-xs text-gray-400">🏢 {sub.departement}</p>
                            )}
                            {sub.email && (
                              <p className="text-theme-xs text-gray-400 truncate">✉️ {sub.email}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                  <Button onClick={handleChefSave}>
                    Enregistrer ({selectedMembreIds.length} sélectionné{selectedMembreIds.length !== 1 ? 's' : ''})
                  </Button>
                </div>
              </div>
            ) : (
              /* ── FULL FORM: admin / creator view ── */
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Chef de Projet (optionnel)</label>
                  <select
                    value={formData.chefDeProjetId || ''}
                    onChange={(e) => setFormData({ ...formData, chefDeProjetId: e.target.value ? Number(e.target.value) : null })}
                    className={inputClass}
                  >
                    <option value="">Aucun chef assigné</option>
                    {managers.map((e) => (
                      <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                    ))}
                  </select>
                </div>



                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date début</label>
                    <input
                      type="date"
                      value={formData.dateDebut}
                      min={!editingProjet ? today : undefined}
                      onChange={(e) => { setFormData({ ...formData, dateDebut: e.target.value }); setDateError(null); }}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date fin</label>
                    <input
                      type="date"
                      value={formData.dateFin}
                      min={formData.dateDebut || today}
                      onChange={(e) => { setFormData({ ...formData, dateFin: e.target.value }); setDateError(null); }}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                {dateError && (
                  <div className="rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                    {dateError}
                  </div>
                )}
                {editingProjet && (
                  <div>
                    <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value as StatutProjet })}
                      className={inputClass}
                    >
                      {Object.values(StatutProjet).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
                  <Button onClick={handleSave}>{editingProjet ? 'Modifier' : 'Créer'}</Button>
                </div>
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
};

export default ProjetsPage;
