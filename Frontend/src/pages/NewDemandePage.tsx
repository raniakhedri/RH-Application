import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { demandeService } from '../api/demandeService';
import { referentielService } from '../api/referentielService';
import { calendrierService } from '../api/calendrierService';
import { TypeDemande, Referentiel, CalendrierJour, HoraireTravail } from '../types';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

// Map JS Date.getDay() (0=Sunday) to French day names used in joursTravail
const DOW_TO_JOUR: Record<number, string> = {
  0: 'DIMANCHE',
  1: 'LUNDI',
  2: 'MARDI',
  3: 'MERCREDI',
  4: 'JEUDI',
  5: 'VENDREDI',
  6: 'SAMEDI',
};

const JOUR_TO_SHORT: Record<string, string> = {
  DIMANCHE: 'Dimanche',
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
};

/**
 * Find the applicable horaire for a given date string (YYYY-MM-DD).
 * Priority: period-specific horaire (dateDebut/dateFin set) > year-round (no dates).
 */
function getHoraireForDate(horaires: HoraireTravail[], dateStr: string): HoraireTravail | null {
  // First try to find a period-specific horaire covering this date
  const specific = horaires.find((h) => {
    if (!h.dateDebut && !h.dateFin) return false;
    const from = h.dateDebut || '0000-01-01';
    const to = h.dateFin || '9999-12-31';
    return dateStr >= from && dateStr <= to;
  });
  if (specific) return specific;
  // Fallback to year-round horaire
  const yearRound = horaires.find((h) => !h.dateDebut && !h.dateFin);
  if (yearRound) return yearRound;
  // Last resort: first horaire
  return horaires.length > 0 ? horaires[0] : null;
}

function isOffDay(horaires: HoraireTravail[], dateStr: string, jourName: string): boolean {
  const h = getHoraireForDate(horaires, dateStr);
  if (!h) return false;
  const jours = h.joursTravail.split(',').map((j) => j.trim().toUpperCase()).filter(Boolean);
  return !jours.includes(jourName);
}

// ─── Mini Calendar Component ───────────────────────────────────────────
interface MiniCalendarProps {
  holidays: CalendrierJour[];
  dateDebut: string;
  dateFin: string;
  horaires: HoraireTravail[];
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ holidays, dateDebut, dateFin, horaires }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (dateDebut) return new Date(dateDebut + 'T00:00:00');
    return new Date();
  });

  useEffect(() => {
    if (dateDebut) setViewDate(new Date(dateDebut + 'T00:00:00'));
  }, [dateDebut]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const holidaySet = useMemo(() => {
    const set = new Map<string, CalendrierJour>();
    holidays.forEach((h) => set.set(h.dateJour, h));
    return set;
  }, [holidays]);

  const selectedRange = useMemo(() => {
    if (!dateDebut || !dateFin) return new Set<string>();
    const set = new Set<string>();
    const start = new Date(dateDebut + 'T00:00:00');
    const end = new Date(dateFin + 'T00:00:00');
    const cur = new Date(start);
    while (cur <= end) {
      set.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return set;
  }, [dateDebut, dateFin]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthName = viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <HiOutlineChevronLeft size={16} />
        </button>
        <span className="text-theme-sm font-semibold text-gray-800 dark:text-white capitalize">{monthName}</span>
        <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <HiOutlineChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
          <div key={d} className="text-theme-xs font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dt = new Date(year, month, day);
          const dow = dt.getDay();
          const jourName = DOW_TO_JOUR[dow];
          const off = isOffDay(horaires, dateStr, jourName);
          const holiday = holidaySet.get(dateStr);
          const isSelected = selectedRange.has(dateStr);

          let bg = '';
          let textColor = 'text-gray-700 dark:text-gray-300';
          let title = '';

          if (holiday) {
            bg = 'bg-error-100 dark:bg-error-500/20';
            textColor = 'text-error-600 dark:text-error-400 font-semibold';
            title = `${holiday.nomJour}${holiday.description ? ' — ' + holiday.description : ''}`;
          } else if (off) {
            bg = 'bg-gray-100 dark:bg-gray-800';
            textColor = 'text-gray-400 dark:text-gray-600';
            title = `${JOUR_TO_SHORT[jourName] || jourName} (repos)`;
          }

          if (isSelected && !holiday && !off) {
            bg = 'bg-brand-100 dark:bg-brand-500/20';
            textColor = 'text-brand-600 dark:text-brand-400 font-semibold';
          } else if (isSelected && (holiday || off)) {
            bg += ' ring-2 ring-brand-400';
          }

          return (
            <div
              key={dateStr}
              title={title}
              className={`w-8 h-8 mx-auto flex items-center justify-center rounded-md text-theme-xs cursor-default ${bg} ${textColor}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-theme-xs text-gray-500">
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
          Repos
        </div>
        <div className="flex items-center gap-1.5 text-theme-xs text-gray-500">
          <div className="w-3 h-3 rounded bg-error-100 dark:bg-error-500/20 border border-error-200 dark:border-error-500/30" />
          Jour férié
        </div>
        <div className="flex items-center gap-1.5 text-theme-xs text-gray-500">
          <div className="w-3 h-3 rounded bg-brand-100 dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30" />
          Sélection
        </div>
      </div>
      {/* Show holidays list for current view */}
      {holidays.filter((h) => {
        const d = new Date(h.dateJour + 'T00:00:00');
        return d.getMonth() === month && d.getFullYear() === year;
      }).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
          <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Jours fériés ce mois :</p>
          {holidays
            .filter((h) => {
              const d = new Date(h.dateJour + 'T00:00:00');
              return d.getMonth() === month && d.getFullYear() === year;
            })
            .map((h) => (
              <div key={h.id} className="flex items-center gap-2 text-theme-xs">
                <span className="text-error-500 font-medium">{new Date(h.dateJour + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                <span className="text-gray-600 dark:text-gray-400">{h.nomJour}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────
const NewDemandePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<TypeDemande>(TypeDemande.CONGE);
  const [typeConge, setTypeConge] = useState('');
  const [congeTypes, setCongeTypes] = useState<Referentiel[]>([]);
  const [holidays, setHolidays] = useState<CalendrierJour[]>([]);
  const [allHoraires, setAllHoraires] = useState<HoraireTravail[]>([]);
  const [raison, setRaison] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [date, setDate] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [justificatif, setJustificatif] = useState<File | null>(null);

  // Types requiring mandatory justificatif
  const TYPES_REQUIRING_JUSTIFICATIF = [
    'CONGE_MALADIE',
    'CONGE_DECES_PROCHE',
    'CONGE_DECES_FAMILLE',
    'CONGE_MATERNITE',
  ];

  const needsJustificatif = type === TypeDemande.CONGE && TYPES_REQUIRING_JUSTIFICATIF.includes(typeConge);

  // Load active congé types from referentiels
  useEffect(() => {
    const loadData = async () => {
      try {
        const [congeRes, calRes, horairesRes] = await Promise.all([
          referentielService.getActiveByType('TYPE_CONGE'),
          calendrierService.getAllJours(),
          calendrierService.getAllHoraires(),
        ]);
        let types = congeRes.data.data || [];

        // Gender-based filtering (Super Admin sees all)
        const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
        if (!isSuperAdmin && user?.sexe) {
          if (user.sexe === 'HOMME') {
            // Men: no maternité, no règles
            types = types.filter((t) => t.libelle !== 'CONGE_MATERNITE' && t.libelle !== 'CONGE_REGLES');
          } else if (user.sexe === 'FEMME') {
            // Women: no paternité
            types = types.filter((t) => t.libelle !== 'CONGE_PATERNITE');
          }
        }

        setCongeTypes(types);
        if (types.length > 0 && !typeConge) {
          setTypeConge(types[0].libelle);
        }
        setHolidays((calRes.data.data || []).filter((j: CalendrierJour) => j.typeJour === 'FERIE'));
        setAllHoraires(horairesRes.data.data || []);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    // Validate justificatif
    if (needsJustificatif && !justificatif) {
      const docNames: Record<string, string> = {
        CONGE_MALADIE: 'certificat médical',
        CONGE_DECES_PROCHE: 'attestation de décès',
        CONGE_DECES_FAMILLE: 'attestation de décès',
        CONGE_MATERNITE: "certificat médical / attestation d'accouchement",
      };
      setError(`Un ${docNames[typeConge] || 'justificatif'} est obligatoire pour ce type de congé`);
      return;
    }

    setLoading(true);

    try {
      const data: Record<string, unknown> = {
        type,
        raison,
        employeId: user.employeId,
      };

      if (type === TypeDemande.CONGE) {
        data.typeConge = typeConge;
        data.dateDebut = dateDebut;
        data.dateFin = dateFin;
      } else if (type === TypeDemande.TELETRAVAIL) {
        data.dateDebut = dateDebut;
        data.dateFin = dateFin;
      } else if (type === TypeDemande.AUTORISATION) {
        data.date = date;
        data.heureDebut = heureDebut;
        data.heureFin = heureFin;
      }

      if (justificatif) {
        await demandeService.createWithFile(data as any, justificatif);
      } else {
        await demandeService.create(data as any);
      }
      navigate('/demandes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Nouvelle demande</h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
          Créer une nouvelle demande de congé, autorisation ou télétravail
        </p>
      </div>

      <div className={type === TypeDemande.CONGE ? 'flex gap-6' : ''}>
        {/* Form */}
        <div className={`rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark ${type === TypeDemande.CONGE ? 'flex-1' : ''}`}>
          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type de demande */}
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Type de demande
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TypeDemande)}
                className={inputClass}
              >
                <option value={TypeDemande.CONGE}>Congé</option>
                <option value={TypeDemande.AUTORISATION}>Autorisation</option>
                <option value={TypeDemande.TELETRAVAIL}>Télétravail</option>
              </select>
            </div>

            {/* Type de congé - fetched from DB */}
            {type === TypeDemande.CONGE && (
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Type de congé
                </label>
                <select
                  value={typeConge}
                  onChange={(e) => setTypeConge(e.target.value)}
                  className={inputClass}
                >
                  {congeTypes.length === 0 && (
                    <option value="">Chargement...</option>
                  )}
                  {congeTypes.map((tc) => (
                    <option key={tc.id} value={tc.libelle}>
                      {tc.description || tc.libelle}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date fields for CONGE / TELETRAVAIL */}
            {(type === TypeDemande.CONGE || type === TypeDemande.TELETRAVAIL) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            )}

            {/* Date/Time fields for AUTORISATION */}
            {type === TypeDemande.AUTORISATION && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Heure début
                  </label>
                  <input
                    type="time"
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                    Heure fin
                  </label>
                  <input
                    type="time"
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            )}

            {/* Pièce jointe / Justificatif */}
            {type === TypeDemande.CONGE && (
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Pièce jointe {needsJustificatif && <span className="text-error-500">*</span>}
                </label>
                {needsJustificatif && (
                  <p className="mb-2 text-theme-xs text-warning-500">
                    {typeConge === 'CONGE_MALADIE' && 'Certificat médical obligatoire'}
                    {(typeConge === 'CONGE_DECES_PROCHE' || typeConge === 'CONGE_DECES_FAMILLE') && 'Attestation de décès obligatoire'}
                    {typeConge === 'CONGE_MATERNITE' && "Certificat médical / Attestation d'accouchement obligatoire"}
                  </p>
                )}
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setJustificatif(e.target.files?.[0] || null)}
                    className="block w-full text-theme-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-theme-sm file:font-medium file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100 dark:text-gray-400 dark:file:bg-brand-500/10 dark:file:text-brand-400 dark:hover:file:bg-brand-500/20 cursor-pointer"
                  />
                  {justificatif && (
                    <div className="mt-2 flex items-center gap-2 text-theme-xs text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{justificatif.name}</span>
                      <span className="text-gray-400">({(justificatif.size / 1024).toFixed(0)} Ko)</span>
                      <button
                        type="button"
                        onClick={() => setJustificatif(null)}
                        className="ml-1 text-error-500 hover:text-error-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raison */}
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Motif
              </label>
              <textarea
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                placeholder="Décrivez le motif de votre demande..."
                required
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => navigate('/demandes')}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Soumettre la demande'}
              </Button>
            </div>
          </form>
        </div>

        {/* Calendar sidebar for CONGE */}
        {type === TypeDemande.CONGE && (
          <div className="w-72 shrink-0 space-y-4">
            <h3 className="text-theme-sm font-semibold text-gray-700 dark:text-gray-300">Calendrier entreprise</h3>
            <MiniCalendar holidays={holidays} dateDebut={dateDebut} dateFin={dateFin} horaires={allHoraires} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewDemandePage;
