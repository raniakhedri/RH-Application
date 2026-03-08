import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { calendrierService } from '../api/calendrierService';
import { demandeService } from '../api/demandeService';
import {
  CalendrierJour,
  HoraireTravail,
  TypeJour,
  DemandeResponse,
  TypeDemande,
  StatutDemande,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useTachesObligatoires } from '../hooks/useTachesObligatoires';

// ============ Calendar helpers ============
interface CalendarEvent {
  date: string;
  label: string;
  type: 'ferie' | 'conge' | 'teletravail' | 'autorisation' | 'tache_obligatoire';
  color: string;
  bgColor: string;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const JOURS_SEMAINE_MAP: Record<number, string> = {
  1: 'LUNDI', 2: 'MARDI', 3: 'MERCREDI', 4: 'JEUDI', 5: 'VENDREDI', 6: 'SAMEDI', 0: 'DIMANCHE',
};

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) { days.push(new Date(date)); date.setDate(date.getDate() + 1); }
  return days;
}
function getStartDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}
function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function eachDayBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) { dates.push(formatDateKey(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
}

const MonCalendrierPage: React.FC = () => {
  const { user } = useAuth();
  const { tachesObligatoires } = useTachesObligatoires(user?.employeId);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [feries, setFeries] = useState<CalendrierJour[]>([]);
  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
  const [horaires, setHoraires] = useState<HoraireTravail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.employeId) return;
    setLoading(true);
    try {
      const [feriesRes, demandesRes, horairesRes] = await Promise.all([
        calendrierService.getAllJours(),
        demandeService.getByEmploye(user.employeId),
        calendrierService.getAllHoraires(),
      ]);
      setFeries(feriesRes.data.data || []);
      setDemandes(demandesRes.data.data || []);
      setHoraires(horairesRes.data.data || []);
    } catch (err) {
      console.error('Erreur chargement calendrier:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.employeId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ============ Build events map ============
  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const addEvent = (date: string, event: CalendarEvent) => {
      if (!map[date]) map[date] = [];
      map[date].push(event);
    };

    feries.forEach((f) => {
      if (f.typeJour === TypeJour.FERIE) {
        addEvent(f.dateJour, {
          date: f.dateJour, label: f.nomJour, type: 'ferie',
          color: 'text-error-600 dark:text-error-400',
          bgColor: 'bg-error-50 dark:bg-error-500/[0.12]',
        });
      } else if (f.typeJour === TypeJour.TELETRAVAIL) {
        addEvent(f.dateJour, {
          date: f.dateJour, label: f.nomJour, type: 'teletravail',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-500/[0.12]',
        });
      }
    });

    demandes
      .filter((d) => d.statut === StatutDemande.APPROUVEE || d.statut === StatutDemande.EN_ATTENTE)
      .forEach((d) => {
        const isPending = d.statut === StatutDemande.EN_ATTENTE;
        const suffix = isPending ? ' ⏳' : '';

        if (d.type === TypeDemande.CONGE && d.dateDebut && d.dateFin) {
          const label = (d.typeCongeLabel || 'Congé') + suffix;
          eachDayBetween(d.dateDebut, d.dateFin).forEach((day) => {
            addEvent(day, {
              date: day, label, type: 'conge',
              color: isPending ? 'text-amber-600 dark:text-amber-400' : 'text-warning-600 dark:text-warning-400',
              bgColor: isPending ? 'bg-amber-50 dark:bg-amber-500/[0.12]' : 'bg-warning-50 dark:bg-warning-500/[0.12]',
            });
          });
        } else if (d.type === TypeDemande.TELETRAVAIL && d.dateDebut && d.dateFin) {
          eachDayBetween(d.dateDebut, d.dateFin).forEach((day) => {
            addEvent(day, {
              date: day, label: 'Télétravail' + suffix, type: 'teletravail',
              color: isPending ? 'text-sky-600 dark:text-sky-400' : 'text-blue-600 dark:text-blue-400',
              bgColor: isPending ? 'bg-sky-50 dark:bg-sky-500/[0.12]' : 'bg-blue-50 dark:bg-blue-500/[0.12]',
            });
          });
        } else if (d.type === TypeDemande.AUTORISATION && d.date) {
          addEvent(d.date, {
            date: d.date,
            label: `Auth. ${d.heureDebut || ''}–${d.heureFin || ''}` + suffix,
            type: 'autorisation',
            color: isPending ? 'text-purple-600 dark:text-purple-400' : 'text-brand-600 dark:text-brand-400',
            bgColor: isPending ? 'bg-purple-50 dark:bg-purple-500/[0.12]' : 'bg-brand-50 dark:bg-brand-500/[0.12]',
          });
        }
      });
    // Taches obligatoires → yellow
    tachesObligatoires.forEach((t) => {
      t.dates.forEach((dateStr) => {
        addEvent(dateStr, {
          date: dateStr,
          label: `⚠ ${t.nom}`,
          type: 'tache_obligatoire',
          color: 'text-yellow-700 dark:text-yellow-300',
          bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
        });
      });
    });

    return map;
  }, [feries, demandes, tachesObligatoires]);

  // ============ Horaires: compute working days & teletravail days sets ============
  const { workingDays, teletravailDays: companyTeletravailDays } = useMemo(() => {
    // Pick the most relevant horaire (first one that covers now, or first overall)
    const now = new Date();
    const active = horaires.find((h) => {
      if (!h.dateDebut && !h.dateFin) return true;
      const start = h.dateDebut ? new Date(h.dateDebut + 'T00:00:00') : new Date(0);
      const end = h.dateFin ? new Date(h.dateFin + 'T23:59:59') : new Date(9999, 11, 31);
      return now >= start && now <= end;
    }) || horaires[0] || null;

    const wd = new Set<string>(active ? active.joursTravail.split(',').filter(Boolean) : ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI']);
    const td = new Set<string>(active?.joursTeletravail ? active.joursTeletravail.split(',').filter(Boolean) : []);
    return { workingDays: wd, teletravailDays: td };
  }, [horaires]);

  // Calendar navigation
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } };
  const goToday = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const startDay = getStartDayOfWeek(calYear, calMonth);
  const todayKey = formatDateKey(today);

  // ============ Stats ============
  const stats = useMemo(() => {
    const year = calYear;
    const approved = demandes.filter((d) => d.statut === StatutDemande.APPROUVEE);
    const congesDays = approved
      .filter((d) => d.type === TypeDemande.CONGE)
      .reduce((acc, d) => acc + (d.nombreJours || 0), 0);
    const teletravailDays = approved
      .filter((d) => d.type === TypeDemande.TELETRAVAIL && d.dateDebut && d.dateFin && d.dateDebut.startsWith(String(year)))
      .reduce((acc, d) => acc + eachDayBetween(d.dateDebut!, d.dateFin!).length, 0);
    const autorisations = approved
      .filter((d) => d.type === TypeDemande.AUTORISATION && d.date?.startsWith(String(year))).length;
    const feriesCount = feries
      .filter((f) => f.typeJour === TypeJour.FERIE && f.dateJour.startsWith(String(year))).length;
    return { congesDays, teletravailDays, autorisations, feriesCount };
  }, [demandes, feries, calYear]);

  const legendItems = [
    { label: 'Férié', color: 'bg-error-500' },
    { label: 'Congé', color: 'bg-warning-500' },
    { label: 'Télétravail', color: 'bg-blue-500' },
    { label: 'Autorisation', color: 'bg-brand-500' },
    { label: 'Tâche obligatoire', color: 'bg-yellow-400' },
    { label: 'Jour non travaillé', color: 'bg-gray-400' },
    { label: 'Télétravail entreprise', color: 'bg-blue-300' },
    { label: 'En attente', color: 'bg-amber-400', dashed: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mon calendrier</h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
          Consultez vos congés, télétravail, autorisations et jours fériés
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Jours fériés', value: stats.feriesCount, icon: '🏖️', bg: 'bg-error-50 dark:bg-error-500/[0.12]', text: 'text-error-600 dark:text-error-400' },
          { label: 'Jours de congé', value: stats.congesDays, icon: '📋', bg: 'bg-warning-50 dark:bg-warning-500/[0.12]', text: 'text-warning-600 dark:text-warning-400' },
          { label: 'Jours télétravail', value: stats.teletravailDays, icon: '🏠', bg: 'bg-blue-50 dark:bg-blue-500/[0.12]', text: 'text-blue-600 dark:text-blue-400' },
          { label: 'Autorisations', value: stats.autorisations, icon: '⏰', bg: 'bg-brand-50 dark:bg-brand-500/[0.12]', text: 'text-brand-600 dark:text-brand-400' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl ${s.bg} p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
              <HiOutlineChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white min-w-[180px] text-center">
              {MONTHS_FR[calMonth]} {calYear}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
              <HiOutlineChevronRight size={20} />
            </button>
          </div>
          <button onClick={goToday} className="rounded-lg px-3 py-1.5 text-theme-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/[0.12] transition-colors">
            Aujourd'hui
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">Chargement...</div>
        ) : (
          <div className="p-3 sm:p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FR.map((d) => (
                <div key={d} className="text-center text-theme-xs font-semibold text-gray-400 dark:text-gray-500 py-2">{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7 border-l border-t border-gray-100 dark:border-gray-800">
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-[90px] sm:min-h-[100px] border-r border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20" />
              ))}
              {daysInMonth.map((date) => {
                const key = formatDateKey(date);
                const events = eventsMap[key] || [];
                const isToday = key === todayKey;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const jourName = JOURS_SEMAINE_MAP[date.getDay()];
                const isCompanyTeletravail = companyTeletravailDays.has(jourName);
                const isNonWorking = !workingDays.has(jourName) && !isCompanyTeletravail;
                return (
                  <div
                    key={key}
                    className={`min-h-[90px] sm:min-h-[100px] p-1 sm:p-1.5 border-r border-b border-gray-100 dark:border-gray-800 ${isNonWorking
                        ? 'bg-gray-100/70 dark:bg-gray-800/50'
                        : isCompanyTeletravail
                          ? 'bg-blue-50/40 dark:bg-blue-900/10'
                          : isWeekend
                            ? 'bg-gray-50/50 dark:bg-gray-800/30'
                            : ''
                      }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-theme-sm font-medium mb-0.5 ${isToday ? 'bg-brand-500 text-white' : isNonWorking ? 'text-gray-400 dark:text-gray-500' : isWeekend ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                        {date.getDate()}
                      </span>
                      {isCompanyTeletravail && events.every(e => e.type !== 'teletravail') && (
                        <span className="text-[9px] font-medium text-blue-500 dark:text-blue-400">🏠</span>
                      )}
                      {isNonWorking && !isWeekend && (
                        <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500">Repos</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev, evIdx) => (
                        <div key={evIdx} className={`${ev.bgColor} ${ev.color} rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium leading-tight truncate`} title={ev.label}>
                          {ev.label}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 pl-1 font-medium">+{events.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${item.color} ${item.dashed ? 'opacity-60' : ''}`} />
              <span className="text-theme-xs text-gray-500 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state when no data */}
      {!loading && demandes.length === 0 && feries.length === 0 && (
        <div className="text-center py-8">
          <HiOutlineCalendar className="mx-auto text-gray-300 dark:text-gray-600" size={48} />
          <p className="mt-3 text-gray-500 dark:text-gray-400">Aucun événement pour le moment</p>
        </div>
      )}
    </div>
  );
};

export default MonCalendrierPage;
