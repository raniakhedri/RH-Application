package com.antigone.rh.service;

import com.antigone.rh.entity.AffectationHoraire;
import com.antigone.rh.entity.Employe;
import com.antigone.rh.entity.Pointage;
import com.antigone.rh.enums.SourcePointage;
import com.antigone.rh.enums.StatutPointage;
import com.antigone.rh.enums.TypeReferentiel;
import com.antigone.rh.repository.AffectationHoraireRepository;
import com.antigone.rh.repository.EmployeRepository;
import com.antigone.rh.repository.PointageRepository;
import com.antigone.rh.repository.ReferentielRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class PointageService {

    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final AffectationHoraireRepository affectationHoraireRepository;
    private final ReferentielRepository referentielRepository;

    public List<Pointage> findAll() {
        return pointageRepository.findAll();
    }

    public Pointage findById(Long id) {
        return pointageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pointage non trouvé"));
    }

    public List<Pointage> findByEmploye(Long employeId) {
        return pointageRepository.findByEmployeId(employeId);
    }

    public List<Pointage> findByEmployeAndDateRange(Long employeId, LocalDate start, LocalDate end) {
        return pointageRepository.findByEmployeIdAndDateJourBetween(employeId, start, end);
    }

    public List<Pointage> findByDate(LocalDate date) {
        return pointageRepository.findByDateJour(date);
    }

    public Pointage clockIn(Long employeId) {
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        LocalDate today = LocalDate.now();
        Optional<Pointage> existing = pointageRepository.findByEmployeIdAndDateJour(employeId, today);

        if (existing.isPresent()) {
            throw new RuntimeException("Pointage déjà enregistré pour aujourd'hui");
        }

        Optional<AffectationHoraire> affectation = affectationHoraireRepository
                .findActiveForEmployeOnDate(employeId, today);

        StatutPointage statut = StatutPointage.PRESENT;
        int retardMinutes = 0;
        int toleranceMinutes = referentielRepository
                .findByLibelleAndTypeReferentiel("TOLERANCE_RETARD_MINUTES", TypeReferentiel.PARAMETRE_SYSTEME)
                .map(r -> {
                    try {
                        return Integer.parseInt(r.getValeur());
                    } catch (Exception e) {
                        return 10;
                    }
                })
                .orElse(10);

        if (affectation.isPresent()) {
            LocalTime heureDebutTravail = affectation.get().getHoraireTravail().getHeureDebut();
            if (LocalTime.now().isAfter(heureDebutTravail.plusMinutes(toleranceMinutes))) {
                statut = StatutPointage.RETARD;
                retardMinutes = (int) Duration.between(heureDebutTravail, LocalTime.now()).toMinutes();
            }
        }

        Pointage pointage = Pointage.builder()
                .employe(employe)
                .dateJour(today)
                .heureEntree(LocalTime.now())
                .statut(statut)
                .source(SourcePointage.MANUEL)
                .retardMinutes(retardMinutes)
                .affectationHoraire(affectation.orElse(null))
                .build();

        return pointageRepository.save(pointage);
    }

    public Pointage clockOut(Long employeId) {
        LocalDate today = LocalDate.now();
        Pointage pointage = pointageRepository.findByEmployeIdAndDateJour(employeId, today)
                .orElseThrow(() -> new RuntimeException("Aucun pointage d'entrée trouvé pour aujourd'hui"));

        if (pointage.getHeureSortie() != null) {
            throw new RuntimeException("Sortie déjà enregistrée");
        }

        pointage.setHeureSortie(LocalTime.now());

        if (pointage.getAffectationHoraire() != null) {
            LocalTime heureFinTravail = pointage.getAffectationHoraire().getHoraireTravail().getHeureFin();
            if (LocalTime.now().isBefore(heureFinTravail.minusMinutes(30))) {
                pointage.setStatut(StatutPointage.INCOMPLET);
            }
        }

        return pointageRepository.save(pointage);
    }

    public Pointage save(Pointage pointage) {
        return pointageRepository.save(pointage);
    }

    public void delete(Long id) {
        pointageRepository.deleteById(id);
    }
}
