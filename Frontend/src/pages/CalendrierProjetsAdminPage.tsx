import React, { useState } from 'react';
import {
  HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineUser, HiOutlineUserGroup,
  HiOutlineCheck, HiOutlineX, HiOutlineTrash,
  HiOutlineLockClosed, HiOutlineBriefcase,
  HiOutlineShieldExclamation,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { employeService } from '../api/employeService';
import { calendrierProjetService } from '../api/calendrierProjetService';
import { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BusySlot {
  id?: number;
  date: string;
  managerId: number;
  projectName: string;
  urgent?: boolean;
}
interface BookedSlot {
  id?: number;
  date: string;
  managerId: number;
  projectName: string;
  urgent?: boolean;
  statut?: string;
}
interface ManagerDef {
  id: number;
  name: string;
  avatar: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function todayFmt(): string { return fmt(new Date()); }

// ─── Permissions constants ────────────────────────────────────────────────────
const PERM_ACCESS  = 'VIEW_CALENDRIER_PROJETS';
const PERM_MANAGER = 'VIEW_CALENDRIER_PROJETS';
const PERM_SOCIAL  = 'VIEW_CALENDRIER_PROJETS';

// ─── Access Denied ────────────────────────────────────────────────────────────
const AccessDenied: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 text-center max-w-sm">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <HiOutlineShieldExclamation size={28} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Accès refusé</h2>
      <p className="text-sm text-gray-400">
        Vous n'avez pas les droits nécessaires pour accéder à cette page.
        Contactez votre administrateur.
      </p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CalendrierProjetsAdminPage: React.FC = () => {
  const { user } = useAuth();

  const permissions: string[] = (user as any)?.permissions || [];

  const hasAccess      = permissions.includes(PERM_ACCESS);
  const roles: any[] = (user as any)?.roles || [];
    const canManagerMode = roles.some(r => {
      const nom = (typeof r === 'string' ? r : r.nom)?.toUpperCase() || '';
      return nom === 'MARKETING MANAGER' || nom === 'MARKETING_MANAGER' || nom === 'ROLE_MARKETING_MANAGER';
    });
    const canSocialMode  = roles.some(r => {
      const nom = (typeof r === 'string' ? r : r.nom)?.toUpperCase() || '';
      return nom === 'SOCIAL MANAGER' || nom === 'SOCIAL_MANAGER' || nom === 'ROLE_SOCIAL_MANAGER';
    });
  const canSwitch      = canManagerMode && canSocialMode;

  if (!hasAccess) return <AccessDenied />;

  const defaultMode: 'manager' | 'social' = canManagerMode ? 'manager' : 'social';

  const roleBadge = canSwitch
    ? { label: 'Administrateur',    cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    : canManagerMode
      ? { label: 'Marketing Manager', cls: 'bg-violet-50 text-violet-700 border-violet-200' }
      : { label: 'Social Manager',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  return (
    <CalendrierCore
      canManagerMode={canManagerMode}
      canSocialMode={canSocialMode}
      canSwitch={canSwitch}
      defaultMode={defaultMode}
      roleBadge={roleBadge}
    />
  );
};

// ─── Core Calendar ────────────────────────────────────────────────────────────
interface CoreProps {
  canManagerMode: boolean;
  canSocialMode: boolean;
  canSwitch: boolean;
  defaultMode: 'manager' | 'social';
  roleBadge: { label: string; cls: string };
}

const CalendrierCore: React.FC<CoreProps> = ({
  canManagerMode, canSocialMode, canSwitch, defaultMode, roleBadge,
}) => {
  const [role, setRole]           = useState<'manager'|'social'>(defaultMode);
  const [managerId, setManagerId] = useState(1);
  const [calYear, setCalYear]     = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]   = useState(new Date().getMonth());
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [modalDate, setModalDate] = useState<string|null>(null);
  const [modalMode, setModalMode] = useState<'busy'|'book'>('busy');
  const [inputName, setInputName] = useState('');
  const [inputUrgent, setInputUrgent] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string|null>(null);
  const [validateTarget, setValidateTarget] = useState<BookedSlot | null>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);

  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Pour supporter les différentes façons d'écrire le rôle en base de données
    Promise.all([
      employeService.getByRole('Marketing Manager').catch(() => ({ data: { data: [] } })),
      employeService.getByRole('MARKETING_MANAGER').catch(() => ({ data: { data: [] } }))
    ]).then(([res1, res2]) => {
      const data1 = res1.data?.data || [];
      const data2 = res2.data?.data || [];
      const mergedData = [...data1, ...data2];
      
      // Dédoublonner par ID au cas où
      const uniqueManagers = Array.from(new Map(mergedData.map((m: any) => [m.id, m])).values());

      const mappers = uniqueManagers.map((m: any) => ({
        id: m.id,
        name: `${m.nom || ''} ${m.prenom || ''}`.trim(),
        avatar: `${m.nom?.[0] || ''}${m.prenom?.[0] || ''}`.toUpperCase() || '?',
        color: 'bg-violet-500'
      }));
      setManagers(mappers);
      if (mappers.length > 0) setManagerId(mappers[0].id);
    });
  }, []);

  useEffect(() => {
    if (!managerId) return;
    const sDate = `${calYear}-${String(calMonth+1).padStart(2,'0')}-01`;
    const eD = new Date(calYear, calMonth+1, 0);
    const eDate = `${eD.getFullYear()}-${String(eD.getMonth()+1).padStart(2,'0')}-${String(eD.getDate()).padStart(2,'0')}`;
    
    setLoading(true);
    calendrierProjetService.getManagerSlotsBetween(managerId, sDate, eDate).then(res => {
      const busy = res.filter((r: any) => r.type === 'BUSY').map((r: any) => ({...r, date: r.dateSlot}));
      const booked = res.filter((r: any) => r.type === 'BOOKED').map((r: any) => ({...r, date: r.dateSlot}));
      setBusySlots(busy);
      setBookedSlots(booked);
      setLoading(false);
    });
  }, [managerId, calYear, calMonth]);

  const manager = managers.find((m: any) => m.id === managerId) || {id:0, name:'', avatar:'', color:''};
  const today      = todayFmt();
  const days       = getDaysInMonth(calYear, calMonth);
  const startBlank = startDow(calYear, calMonth);

  const prevMonth = () => calMonth === 0  ? (setCalMonth(11), setCalYear(y=>y-1)) : setCalMonth(m=>m-1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0),  setCalYear(y=>y+1)) : setCalMonth(m=>m+1);

  const busyMap   = Object.fromEntries(busySlots.filter(s=>s.managerId===managerId).map(s=>[s.date,s]));
  const bookedMap = Object.fromEntries(bookedSlots.filter(s=>s.managerId===managerId).map(s=>[s.date,s]));
  const isAvailable = (key: string) => !busyMap[key];

  // ── Actions ──
  const handleManagerDayClick = (key: string) => {
    if (!canManagerMode) return;
    const booked = bookedMap[key];
    if (booked && booked.statut === 'EN_ATTENTE') {
      setValidateTarget(booked);
      return;
    }
    if (busyMap[key]) { setRemoveTarget(key); return; }
    if (!booked) {
      setModalDate(key); setModalMode('busy'); setInputName(''); setInputUrgent(false);
    }
  };

  const handleSocialDayClick = (key: string) => {
    if (!canSocialMode) return;
    if (!isAvailable(key) || bookedMap[key]) return;
    setModalDate(key); setModalMode('book'); setInputName(''); setInputUrgent(false);
  };

  const confirmModal = async () => {
    if (!inputName.trim() || !modalDate) { showToast('Veuillez saisir un nom.','error'); return; }
    
    try {
      if (modalMode === 'busy') {
        const slot = await calendrierProjetService.createBusySlot({
          managerId,
          dateSlot: modalDate,
          projectName: inputName.trim(),
          urgent: inputUrgent,
          type: 'BUSY',
          statut: 'VALIDE'
        });
        setBusySlots(p=>[...p,{...slot, date: slot.dateSlot}]);
        showToast(`Jour ${modalDate} marqué occupé : "${inputName}"`, 'success');
      } else {
        const slot = await calendrierProjetService.createBookedSlot({
          managerId,
          socialManagerId: user?.employeId,
          dateSlot: modalDate,
          projectName: inputName.trim(),
          urgent: inputUrgent,
          type: 'BOOKED',
          statut: 'EN_ATTENTE'
        });
        setBookedSlots(p=>[...p,{...slot, date: slot.dateSlot}]);
        showToast(
          inputUrgent
            ? `Urgent "${inputName}" planifié ! (notif)`
            : `"${inputName}" planifié avec succès !`,
          'success'
        );
      }
      setModalDate(null); setInputUrgent(false);
    } catch(e) {
      showToast('Erreur lors de la planification', 'error');
    }
  };

  const handleValidate = async (accepter: boolean) => {
    if (!validateTarget || !validateTarget.id) return;
    try {
      if (accepter) {
        await calendrierProjetService.updateSlotStatus(validateTarget.id, 'VALIDE');
        setBookedSlots(p => p.map(s => s.id === validateTarget.id ? { ...s, statut: 'VALIDE' } : s));
        showToast('Projet validé !', 'success');
      } else {
        await calendrierProjetService.deleteSlot(validateTarget.id);
        setBookedSlots(p => p.filter(s => s.id !== validateTarget.id));
        showToast('Projet refusé', 'success');
      }
    } catch(e) {
      showToast('Erreur lors de la validation', 'error');
    }
    setValidateTarget(null);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const targetSlot = busySlots.find(s=>s.date===removeTarget && s.managerId===managerId) as any;
    
    try {
      if(targetSlot && targetSlot.id) {
        await calendrierProjetService.deleteSlot(targetSlot.id);
      }
      setBusySlots(p=>p.filter(s=>!(s.date===removeTarget && s.managerId===managerId)));
      setRemoveTarget(null);
      showToast('Créneau supprimé, jour à nouveau disponible.','success');
    } catch(e) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500);
  };

  const monthPrefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const busyCount   = busySlots.filter(s=>s.managerId===managerId && s.date.startsWith(monthPrefix)).length;
  const availCount  = days.length - busyCount;
  const bookedCount = bookedSlots.filter(s=>s.managerId===managerId && s.date.startsWith(monthPrefix)).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Calendrier Projets</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleBadge.cls}`}>
                {roleBadge.label}
              </span>
            </div>
            <p className="text-sm text-gray-400">Planification &amp; disponibilités managers</p>
          </div>

          {canSwitch ? (
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                onClick={()=>setRole('manager')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${role==='manager' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <HiOutlineUser size={15}/> Marketing Manager
              </button>
              <button
                onClick={()=>setRole('social')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${role==='social' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <HiOutlineUserGroup size={15}/> Social Manager
              </button>
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${roleBadge.cls}`}>
              {canManagerMode ? <HiOutlineUser size={15}/> : <HiOutlineUserGroup size={15}/>}
              {canManagerMode ? 'Mode Marketing Manager' : 'Mode Social Manager'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Liste managers */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Marketing Managers</p>
              <div className="space-y-2">
                {managers.map(m=>(
                  <button
                    key={m.id}
                    onClick={()=>setManagerId(m.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left
                      ${managerId===m.id ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <div className={`w-9 h-9 rounded-full ${m.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {m.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {busySlots.filter(s=>s.managerId===m.id).length} occupé(s)
                      </p>
                    </div>
                    {managerId===m.id && <HiOutlineCheck size={14} className="text-blue-500 shrink-0"/>}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats du mois */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {MONTHS_FR[calMonth]}
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Jours disponibles</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{availCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Jours occupés</span>
                  <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{busyCount}</span>
                </div>
                {(role==='social' || !canManagerMode) && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Projets planifiés</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{bookedCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Légende */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Légende</p>
              <div className="space-y-2">
                {role==='manager' ? (
                  <>
                    <LegendRow color="bg-orange-100 border border-orange-300" label="Occupé (projet)"/>
                    <LegendRow color="bg-white border border-gray-200" label="Disponible"/>
                    <LegendRow color="bg-blue-500" label="Aujourd'hui" round/>
                  </>
                ) : (
                  <>
                    <LegendRow color="bg-emerald-100 border border-emerald-300" label="Disponible"/>
                    <LegendRow color="bg-blue-100 border border-blue-300" label="Projet planifié"/>
                    <LegendRow color="bg-orange-100 border border-orange-300" label="Occupé (indispo)"/>
                  </>
                )}
              </div>
            </div>

            {/* Mes projets occupés (mode manager) */}
            {role==='manager' && busySlots.filter(s=>s.managerId===managerId).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Mes projets</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {busySlots.filter(s=>s.managerId===managerId).map((s,i)=>(
                    <div key={i} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100">
                      <HiOutlineBriefcase size={13} className="text-orange-400 mt-0.5 shrink-0"/>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-orange-800 truncate">{s.projectName}</p>
                        <p className="text-[10px] text-orange-400">{s.date}{s.urgent ? ' 🔴' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projets planifiés (mode social) */}
            {role==='social' && bookedSlots.filter(s=>s.managerId===managerId).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Projets planifiés</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {bookedSlots.filter(s=>s.managerId===managerId).map((s,i)=>(
                    <div key={i} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <HiOutlineCheck size={13} className="text-blue-400 mt-0.5 shrink-0"/>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-blue-800 truncate">{s.projectName}</p>
                        <p className="text-[10px] text-blue-400">{s.date}{s.urgent ? ' 🔴' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Calendrier ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Navigation */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <HiOutlineChevronLeft size={18}/>
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{MONTHS_FR[calMonth]} {calYear}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {role==='manager'
                    ? 'Cliquez sur un jour pour marquer vos projets / indisponibilités'
                    : `Sélectionnez une date disponible de ${manager.name}`}
                </p>
              </div>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <HiOutlineChevronRight size={18}/>
              </button>
            </div>

            {/* En-têtes jours */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60">
              {DAYS_FR.map(d=>(
                <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Grille */}
            <div className="grid grid-cols-7">
              {Array.from({length:startBlank}).map((_,i)=>(
                <div key={`b${i}`} className="min-h-[85px] border-r border-b border-gray-50 bg-slate-50/50"/>
              ))}

              {days.map(date=>{
                const key     = fmt(date);
                const isToday = key === today;
                const busy    = busyMap[key];
                const booked  = bookedMap[key];
                const avail   = isAvailable(key);

                // ── Vue Manager ──
                if (role==='manager') {
                  const isAttente = booked && booked.statut === 'EN_ATTENTE';
                  const isValide = booked && booked.statut === 'VALIDE';
                  const isClickable = canManagerMode && (!busy || busyMap[key]) && (!booked || isAttente);

                  return (
                    <div
                      key={key}
                      onClick={()=>handleManagerDayClick(key)}
                      className={`min-h-[85px] border-r border-b border-gray-100 p-2 transition-all duration-150 relative group
                        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                        ${isAttente ? 'bg-yellow-50 hover:bg-yellow-100' :
                           isValide ? 'bg-blue-50' :
                           busy ? 'bg-orange-50 hover:bg-orange-100' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
                        ${isToday ? 'bg-blue-500 text-white' : 
                          isAttente ? 'text-yellow-600' :
                          isValide ? 'text-blue-600' :
                          busy ? 'text-orange-600' : 'text-gray-600'}`}>
                        {date.getDate()}
                      </span>
                      
                      {busy && (
                        <div className="mt-1.5 space-y-0.5">
                          <div className="bg-orange-100 border border-orange-200 rounded px-1.5 py-0.5">
                            <p className="text-[10px] font-semibold text-orange-700 truncate leading-tight">{busy.projectName}</p>
                          </div>
                          {busy.urgent && <p className="text-[9px] text-red-400 font-medium pl-0.5">🔴 Urgent</p>}
                        </div>
                      )}

                      {booked && (
                        <div className="mt-1.5 space-y-0.5">
                          <div className={`border rounded px-1.5 py-0.5 
                            ${isAttente ? 'bg-yellow-100 border-yellow-200' : 'bg-blue-100 border-blue-200'}`}>
                            <p className={`text-[10px] font-semibold truncate leading-tight
                              ${isAttente ? 'text-yellow-700' : 'text-blue-700'}`}>
                              {booked.projectName} {isAttente ? '(En attente)' : '(Validé)'}
                            </p>
                          </div>
                          {booked.urgent && <p className="text-[9px] text-red-400 font-medium pl-0.5">🔴 Urgent</p>}
                        </div>
                      )}

                      {canManagerMode && (
                        <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full
                            ${isAttente ? 'bg-yellow-100 text-yellow-600' :
                              busy ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                            {isAttente ? 'Valider ?' : busy ? 'Supprimer' : '+ Projet'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Vue Social ──
                const canBook = avail && !booked && canSocialMode;
                return (
                  <div
                    key={key}
                    onClick={()=>canBook ? handleSocialDayClick(key) : undefined}
                    className={`min-h-[85px] border-r border-b border-gray-100 p-2 transition-all duration-150 relative group
                      ${booked  ? 'bg-blue-50' :
                        busy    ? 'bg-orange-50 opacity-70' :
                        canBook ? 'bg-emerald-50 cursor-pointer hover:bg-emerald-100' :
                                  'bg-white'}`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
                      ${isToday  ? 'bg-blue-500 text-white'  :
                        booked   ? 'text-blue-600'           :
                        busy     ? 'text-orange-500'         :
                        avail    ? 'text-emerald-700'        : 'text-gray-400'}`}>
                      {date.getDate()}
                    </span>

                    {booked && (
                      <div className="mt-1.5 bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5">
                        <p className="text-[10px] font-semibold text-blue-700 truncate">{booked.projectName}</p>
                        {booked.urgent && <p className="text-[9px] text-red-400 font-medium">🔴 Urgent</p>}
                      </div>
                    )}
                    {busy && !booked && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <HiOutlineLockClosed size={10} className="text-orange-400"/>
                        <span className="text-[10px] text-orange-500 font-medium">Occupé</span>
                      </div>
                    )}
                    {avail && !booked && !busy && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>
                        <span className="text-[10px] text-emerald-600 font-medium">Dispo</span>
                      </div>
                    )}
                    {canBook && (
                      <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                          + Planifier
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modale Ajout / Planification ── */}
      {modalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">
                {modalMode==='busy' ? 'Marquer comme occupé' : 'Planifier un projet'}
              </h3>
              <button onClick={()=>setModalDate(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <HiOutlineX size={17}/>
              </button>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-4">
              <div className={`w-9 h-9 rounded-full ${manager.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {manager.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{manager.name}</p>
                <p className="text-xs text-gray-400">{modalDate}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {modalMode==='busy' ? 'Nom du projet / raison' : 'Nom du projet'}
              </label>
              <input
                autoFocus
                type="text"
                value={inputName}
                onChange={e=>setInputName(e.target.value)}
                onKeyDown={e=>e.key==='Enter' && confirmModal()}
                placeholder={modalMode==='busy' ? 'Ex: Audit interne Q2' : 'Ex: Campagne Social Media Q2'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </div>

            <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
              <div
                onClick={()=>setInputUrgent(v=>!v)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${inputUrgent ? 'bg-red-400' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${inputUrgent ? 'left-5' : 'left-0.5'}`}/>
              </div>
              <span className={`text-sm font-medium ${inputUrgent ? 'text-red-500' : 'text-gray-500'}`}>
                {modalMode==='busy' ? 'Priorité urgente' : 'Projet urgent (notif + mail)'}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={()=>{ setModalDate(null); setInputUrgent(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmModal}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm transition-colors
                  ${modalMode==='busy' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {modalMode==='busy' ? 'Marquer occupé' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Validation ── */}
      {validateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-bold text-gray-900 mb-1">Validation de planification</h3>
            <p className="text-sm text-gray-600 mb-6">
              Le Social Manager a planifié le projet <strong>{validateTarget.projectName}</strong> le <strong>{validateTarget.date}</strong>.<br/>
              Souhaitez-vous le valider ?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setValidateTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">Annuler</button>
              <button onClick={() => handleValidate(false)} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-xl font-medium">Refuser</button>
              <button onClick={() => handleValidate(true)} className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-2.5 rounded-xl font-medium shadow-sm shadow-blue-200">Accepter</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Suppression ── */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <HiOutlineTrash size={22} className="text-red-500"/>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Supprimer ce créneau ?</h3>
            <p className="text-xs text-gray-400 mb-5">
              Le jour <strong>{removeTarget}</strong> redeviendra disponible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={()=>setRemoveTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
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

// ─── Legend Row ───────────────────────────────────────────────────────────────
const LegendRow: React.FC<{color:string; label:string; round?:boolean}> = ({color,label,round}) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 ${round?'rounded-full':'rounded-sm'} ${color} inline-block shrink-0`}/>
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

export default CalendrierProjetsAdminPage;
