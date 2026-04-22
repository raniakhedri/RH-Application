import React, { useState, useEffect } from 'react';
import {
  HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineX, HiOutlinePlus, HiOutlineCheck,
  HiOutlineVideoCamera, HiOutlineOfficeBuilding,
  HiOutlineUserGroup, HiOutlineClock,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { reunionService } from '../api/reunionService';
import { employeService } from '../api/employeService';
import { clientService } from '../api/clientService';
import { Reunion, ReunionRequest, TypeReunion, StatutReunion, Employe } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

function getDaysInMonth(y: number, m: number): Date[] {
  const days: Date[] = [];
  const d = new Date(y, m, 1);
  while (d.getMonth() === m) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}
function startDow(y: number, m: number): number {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const ReunionsCalendar: React.FC = () => {
  const { user } = useAuth();
  const permissions: string[] = (user as any)?.permissions || [];
  const employeId = (user as any)?.employeId;
  const canViewClients = permissions.includes('VIEW_CLIENTS');

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(false);

  // Employees & clients for creating meetings
  const [employes, setEmployes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [onLeaveIds, setOnLeaveIds] = useState<number[]>([]);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [form, setForm] = useState<Partial<ReunionRequest>>({
    titre: '', heureDebut: '09:00', heureFin: '10:00',
    typeReunion: TypeReunion.PRESENTIEL, plateforme: '', lieu: '',
  });
  const [participantType, setParticipantType] = useState<'interne'|'externe'>('interne');
  const [selectedParticipantId, setSelectedParticipantId] = useState<number|''>('');

  // Detail modal
  const [detailReunion, setDetailReunion] = useState<Reunion|null>(null);

  // Toast
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500);
  };

  // Fetch data
  useEffect(() => {
    employeService.getAll().then(r => setEmployes(r.data?.data || [])).catch(() => {});
    if (canViewClients) {
      clientService.getAllClients().then(r => setClients(r.data?.data || [])).catch(() => {});
    }
    employeService.getOnLeaveToday().then(r => setOnLeaveIds(r.data?.data || [])).catch(() => {});
  }, [canViewClients]);

  useEffect(() => {
    if (!employeId) return;
    setLoading(true);
    const sDate = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`;
    const eD = new Date(calYear, calMonth+1, 0);
    const eDate = `${eD.getFullYear()}-${String(eD.getMonth()+1).padStart(2,'0')}-${String(eD.getDate()).padStart(2,'0')}`;

    reunionService.getByEmployeAndBetween(employeId, sDate, eDate)
      .then(res => {
        setReunions(res.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [employeId, calYear, calMonth]);

  // Build map: date -> reunions
  const reunionMap: Record<string, Reunion[]> = {};
  reunions.forEach(r => {
    const key = r.dateReunion;
    if (!reunionMap[key]) reunionMap[key] = [];
    reunionMap[key].push(r);
  });

  const today = fmtDate(new Date());
  const days = getDaysInMonth(calYear, calMonth);
  const startBlank = startDow(calYear, calMonth);
  const prevMonth = () => calMonth === 0 ? (setCalMonth(11), setCalYear(y=>y-1)) : setCalMonth(m=>m-1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0), setCalYear(y=>y+1)) : setCalMonth(m=>m+1);

  const handleDayClick = (key: string) => {
    setCreateDate(key);
    setForm({ titre: '', heureDebut: '09:00', heureFin: '10:00', typeReunion: TypeReunion.PRESENTIEL, plateforme: '', lieu: '' });
    setSelectedParticipantId('');
    setParticipantType('interne');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!form.titre?.trim()) { showToast('Veuillez saisir un titre', 'error'); return; }
    if (!selectedParticipantId) { showToast('Veuillez sélectionner un participant', 'error'); return; }

    try {
      const req: ReunionRequest = {
        titre: form.titre!,
        dateReunion: createDate,
        heureDebut: form.heureDebut!,
        heureFin: form.heureFin || undefined,
        typeReunion: form.typeReunion!,
        plateforme: form.typeReunion === TypeReunion.EN_LIGNE ? form.plateforme : undefined,
        lieu: form.typeReunion === TypeReunion.PRESENTIEL ? form.lieu : undefined,
        ...(participantType === 'interne'
          ? { participantId: selectedParticipantId as number }
          : { clientParticipantId: selectedParticipantId as number }),
      };
      const res = await reunionService.create(req, employeId);
      setReunions(prev => [...prev, res.data?.data]);
      setShowCreate(false);
      showToast('Demande de réunion envoyée !', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Erreur lors de la création', 'error');
    }
  };

  const handleRespond = async (id: number, accepter: boolean) => {
    try {
      const res = await reunionService.respond(id, accepter);
      setReunions(prev => prev.map(r => r.id === id ? res.data?.data : r));
      setDetailReunion(null);
      showToast(accepter ? 'Réunion acceptée !' : 'Réunion refusée', 'success');
    } catch {
      showToast('Erreur lors de la réponse', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reunionService.delete(id);
      setReunions(prev => prev.filter(r => r.id !== id));
      setDetailReunion(null);
      showToast('Réunion supprimée', 'success');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // Stats
  const monthPrefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const thisMonthReunions = reunions.filter(r => r.dateReunion.startsWith(monthPrefix));
  const pendingCount = thisMonthReunions.filter(r => r.statut === StatutReunion.EN_ATTENTE && r.participantId === employeId).length;
  const acceptedCount = thisMonthReunions.filter(r => r.statut === StatutReunion.ACCEPTEE).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <HiOutlineUserGroup size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{thisMonthReunions.length}</p>
              <p className="text-xs text-gray-400">Réunions ce mois</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <HiOutlineClock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
              <p className="text-xs text-gray-400">En attente de réponse</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <HiOutlineCheck size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{acceptedCount}</p>
              <p className="text-xs text-gray-400">Confirmées</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Légende</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300 inline-block shrink-0"/>
                  <span className="text-xs text-gray-500 dark:text-gray-400">En attente</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 inline-block shrink-0"/>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Acceptée</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block shrink-0"/>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Refusée</span>
                </div>
              </div>
            </div>

            {/* Upcoming meetings */}
            {thisMonthReunions.filter(r => r.statut === StatutReunion.ACCEPTEE).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Prochaines réunions</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {thisMonthReunions
                    .filter(r => r.statut === StatutReunion.ACCEPTEE)
                    .sort((a, b) => a.dateReunion.localeCompare(b.dateReunion))
                    .slice(0, 5)
                    .map(r => (
                      <button
                        key={r.id}
                        onClick={() => setDetailReunion(r)}
                        className="w-full text-left p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 hover:opacity-80 transition"
                      >
                        <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200 truncate">{r.titre}</p>
                        <p className="text-[10px] text-emerald-500">{r.dateReunion} à {r.heureDebut}</p>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Pending invites */}
            {pendingCount > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-3">⏳ Invitations en attente</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {thisMonthReunions
                    .filter(r => r.statut === StatutReunion.EN_ATTENTE && r.participantId === employeId)
                    .map(r => (
                      <div key={r.id} className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-200 truncate">{r.titre}</p>
                        <p className="text-[10px] text-amber-500 mb-2">{r.dateReunion} à {r.heureDebut} · de {r.initiateurPrenom} {r.initiateurNom}</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleRespond(r.id, true)} className="flex-1 text-[10px] font-medium py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition">Accepter</button>
                          <button onClick={() => handleRespond(r.id, false)} className="flex-1 text-[10px] font-medium py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">Refuser</button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                <HiOutlineChevronLeft size={18}/>
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">{MONTHS_FR[calMonth]} {calYear}</p>
                <p className="text-xs text-gray-400 mt-0.5">Cliquez sur un jour pour planifier une réunion</p>
              </div>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                <HiOutlineChevronRight size={18}/>
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
              {DAYS_FR.map(d => (
                <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">Chargement...</div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: startBlank }).map((_, i) => (
                  <div key={`b${i}`} className="min-h-[90px] border-r border-b border-gray-50 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50" />
                ))}

                {days.map(date => {
                  const key = fmtDate(date);
                  const isToday = key === today;
                  const dayReunions = reunionMap[key] || [];

                  return (
                    <div
                      key={key}
                      onClick={() => handleDayClick(key)}
                      className={`min-h-[90px] border-r border-b border-gray-100 dark:border-gray-700 p-1.5 transition-all cursor-pointer relative group
                        ${dayReunions.length > 0 ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold
                        ${isToday ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {date.getDate()}
                      </span>

                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {dayReunions.slice(0, 2).map(r => {
                          const cls = r.statut === StatutReunion.ACCEPTEE
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 text-emerald-700'
                            : r.statut === StatutReunion.REFUSEE
                              ? 'bg-red-100 dark:bg-red-900/40 border-red-200 text-red-700 line-through opacity-60'
                              : 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 text-amber-700';
                          return (
                            <button
                              key={r.id}
                              onClick={(e) => { e.stopPropagation(); setDetailReunion(r); }}
                              className={`w-full text-left rounded px-1 py-0.5 border ${cls} hover:opacity-80 transition`}
                            >
                              <p className="text-[9px] font-semibold truncate leading-tight">
                                {r.typeReunion === TypeReunion.EN_LIGNE ? '📹' : '🏢'} {r.titre}
                              </p>
                              <p className="text-[8px] opacity-70">{r.heureDebut}</p>
                            </button>
                          );
                        })}
                        {dayReunions.length > 2 && (
                          <p className="text-[9px] text-gray-400 pl-1">+{dayReunions.length - 2}</p>
                        )}
                      </div>

                      {dayReunions.length === 0 && (
                        <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-500">
                            + Réunion
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Planifier une réunion</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                <HiOutlineX size={17} />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">📅</div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{createDate}</p>
                <p className="text-xs text-gray-400">Date sélectionnée</p>
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Titre</label>
              <input
                autoFocus type="text" value={form.titre || ''}
                onChange={e => setForm({...form, titre: e.target.value})}
                placeholder="Ex: Point hebdomadaire"
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Heure début</label>
                <input type="time" value={form.heureDebut || '09:00'}
                  onChange={e => setForm({...form, heureDebut: e.target.value})}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Heure fin</label>
                <input type="time" value={form.heureFin || '10:00'}
                  onChange={e => setForm({...form, heureFin: e.target.value})}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Meeting Type */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Type de réunion</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({...form, typeReunion: TypeReunion.PRESENTIEL})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${form.typeReunion === TypeReunion.PRESENTIEL
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <HiOutlineOfficeBuilding size={16} /> Présentiel
                </button>
                <button
                  onClick={() => setForm({...form, typeReunion: TypeReunion.EN_LIGNE})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${form.typeReunion === TypeReunion.EN_LIGNE
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <HiOutlineVideoCamera size={16} /> En ligne
                </button>
              </div>
            </div>

            {/* Platform / Location */}
            {form.typeReunion === TypeReunion.EN_LIGNE ? (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Plateforme</label>
                <select
                  value={form.plateforme || ''}
                  onChange={e => setForm({...form, plateforme: e.target.value})}
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            ) : (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Lieu</label>
                <input type="text" value={form.lieu || ''}
                  onChange={e => setForm({...form, lieu: e.target.value})}
                  placeholder="Ex: Salle de réunion A"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}

            {/* Participant type toggle */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Participant</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => { setParticipantType('interne'); setSelectedParticipantId(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${participantType === 'interne' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                >
                  Interne (Employé)
                </button>
                {canViewClients && (
                  <button
                    onClick={() => { setParticipantType('externe'); setSelectedParticipantId(''); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${participantType === 'externe' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                  >
                    Externe (Client)
                  </button>
                )}
              </div>

              <select
                value={selectedParticipantId}
                onChange={e => setSelectedParticipantId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Sélectionner...</option>
                {participantType === 'interne'
                  ? employes
                      .filter(e => e.id !== employeId)
                      .map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nom} {e.prenom}{onLeaveIds.includes(e.id) ? ' 🏖️ En congé' : ''} — {e.departement || 'N/A'}
                        </option>
                      ))
                  : clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}{c.contactNom ? ` (${c.contactNom})` : ''}</option>
                    ))
                }
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >Annuler</button>
              <button onClick={handleCreate}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
              >Envoyer la demande</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailReunion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{detailReunion.titre}</h3>
              <button onClick={() => setDetailReunion(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                <HiOutlineX size={17} />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Date</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{detailReunion.dateReunion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Heure</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {detailReunion.heureDebut}{detailReunion.heureFin ? ` → ${detailReunion.heureFin}` : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Type</span>
                <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1">
                  {detailReunion.typeReunion === TypeReunion.EN_LIGNE
                    ? <><HiOutlineVideoCamera size={14}/> En ligne{detailReunion.plateforme ? ` (${detailReunion.plateforme})` : ''}</>
                    : <><HiOutlineOfficeBuilding size={14}/> Présentiel{detailReunion.lieu ? ` — ${detailReunion.lieu}` : ''}</>}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Initiateur</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{detailReunion.initiateurPrenom} {detailReunion.initiateurNom}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Participant</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {detailReunion.participantNom
                    ? `${detailReunion.participantPrenom} ${detailReunion.participantNom}`
                    : detailReunion.clientParticipantNom || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Statut</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                  ${detailReunion.statut === StatutReunion.ACCEPTEE ? 'bg-emerald-100 text-emerald-600' :
                    detailReunion.statut === StatutReunion.REFUSEE ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-600'}`}>
                  {detailReunion.statut === StatutReunion.ACCEPTEE ? 'Acceptée' :
                    detailReunion.statut === StatutReunion.REFUSEE ? 'Refusée' : 'En attente'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {detailReunion.statut === StatutReunion.EN_ATTENTE && detailReunion.participantId === employeId && (
                <>
                  <button onClick={() => handleRespond(detailReunion.id, false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">Refuser</button>
                  <button onClick={() => handleRespond(detailReunion.id, true)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm">Accepter</button>
                </>
              )}
              {detailReunion.initiateurId === employeId && (
                <button onClick={() => handleDelete(detailReunion.id)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">Supprimer</button>
              )}
              <button onClick={() => setDetailReunion(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type==='success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type==='success' ? <HiOutlineCheck size={15}/> : <HiOutlineX size={15}/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ReunionsCalendar;
