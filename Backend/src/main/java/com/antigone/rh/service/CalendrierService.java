package com.antigone.rh.service;

import com.antigone.rh.dto.*;
import com.antigone.rh.entity.Calendrier;
import com.antigone.rh.entity.HoraireTravail;
import com.antigone.rh.enums.TypeJour;
import com.antigone.rh.exception.ResourceNotFoundException;
import com.antigone.rh.repository.CalendrierRepository;
import com.antigone.rh.repository.HoraireTravailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CalendrierService {

    private final CalendrierRepository calendrierRepository;
    private final HoraireTravailRepository horaireTravailRepository;

    // =============================================
    // CALENDRIER (JOURS FÉRIÉS / SPÉCIAUX)
    // =============================================

    public List<CalendrierDTO> getAllJours() {
        return calendrierRepository.findAllByOrderByDateJourAsc().stream()
                .map(this::toCalendrierDTO)
                .collect(Collectors.toList());
    }

    public CalendrierDTO getJourById(Long id) {
        Calendrier cal = calendrierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Calendrier", id));
        return toCalendrierDTO(cal);
    }

    public List<CalendrierDTO> getJoursByType(TypeJour typeJour) {
        return calendrierRepository.findByTypeJour(typeJour).stream()
                .map(this::toCalendrierDTO)
                .collect(Collectors.toList());
    }

    public List<CalendrierDTO> getJoursByPeriode(LocalDate debut, LocalDate fin) {
        return calendrierRepository.findByDateJourBetweenOrderByDateJourAsc(debut, fin).stream()
                .map(this::toCalendrierDTO)
                .collect(Collectors.toList());
    }

    public List<CalendrierDTO> getFeries(Integer annee) {
        LocalDate debut = LocalDate.of(annee, 1, 1);
        LocalDate fin = LocalDate.of(annee, 12, 31);
        return calendrierRepository.findByTypeJourAndDateJourBetween(TypeJour.FERIE, debut, fin).stream()
                .map(this::toCalendrierDTO)
                .collect(Collectors.toList());
    }

    public CalendrierDTO createJour(CalendrierRequest request) {
        LocalDate dateJour = LocalDate.parse(request.getDateJour());

        if (calendrierRepository.existsByDateJour(dateJour)) {
            throw new RuntimeException("Un jour est déjà enregistré pour la date: " + request.getDateJour());
        }

        Calendrier cal = Calendrier.builder()
                .dateJour(dateJour)
                .nomJour(request.getNomJour())
                .typeJour(request.getTypeJour())
                .origine(request.getOrigine())
                .description(request.getDescription())
                .estPaye(request.getEstPaye() != null ? request.getEstPaye() : true)
                .build();

        return toCalendrierDTO(calendrierRepository.save(cal));
    }

    public CalendrierDTO updateJour(Long id, CalendrierRequest request) {
        Calendrier cal = calendrierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Calendrier", id));

        LocalDate dateJour = LocalDate.parse(request.getDateJour());

        // Check uniqueness if date changed
        if (!cal.getDateJour().equals(dateJour) && calendrierRepository.existsByDateJour(dateJour)) {
            throw new RuntimeException("Un jour est déjà enregistré pour la date: " + request.getDateJour());
        }

        cal.setDateJour(dateJour);
        cal.setNomJour(request.getNomJour());
        cal.setTypeJour(request.getTypeJour());
        cal.setOrigine(request.getOrigine());
        cal.setDescription(request.getDescription());
        cal.setEstPaye(request.getEstPaye() != null ? request.getEstPaye() : true);

        return toCalendrierDTO(calendrierRepository.save(cal));
    }

    public void deleteJour(Long id) {
        if (!calendrierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Calendrier", id);
        }
        calendrierRepository.deleteById(id);
    }

    // =============================================
    // HORAIRES DE TRAVAIL
    // =============================================

    public List<HoraireTravailDTO> getAllHoraires() {
        return horaireTravailRepository.findAll().stream()
                .map(this::toHoraireDTO)
                .collect(Collectors.toList());
    }

    public HoraireTravailDTO getHoraireById(Long id) {
        HoraireTravail h = horaireTravailRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HoraireTravail", id));
        return toHoraireDTO(h);
    }

    public HoraireTravailDTO createHoraire(HoraireTravailRequest request) {
        HoraireTravail h = HoraireTravail.builder()
                .nom(request.getNom())
                .heureDebut(LocalTime.parse(request.getHeureDebut()))
                .heureFin(LocalTime.parse(request.getHeureFin()))
                .pauseDebutMidi(request.getPauseDebutMidi() != null ? LocalTime.parse(request.getPauseDebutMidi()) : null)
                .pauseFinMidi(request.getPauseFinMidi() != null ? LocalTime.parse(request.getPauseFinMidi()) : null)
                .joursTravail(request.getJoursTravail())
                .build();

        return toHoraireDTO(horaireTravailRepository.save(h));
    }

    public HoraireTravailDTO updateHoraire(Long id, HoraireTravailRequest request) {
        HoraireTravail h = horaireTravailRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HoraireTravail", id));

        h.setNom(request.getNom());
        h.setHeureDebut(LocalTime.parse(request.getHeureDebut()));
        h.setHeureFin(LocalTime.parse(request.getHeureFin()));
        h.setPauseDebutMidi(request.getPauseDebutMidi() != null ? LocalTime.parse(request.getPauseDebutMidi()) : null);
        h.setPauseFinMidi(request.getPauseFinMidi() != null ? LocalTime.parse(request.getPauseFinMidi()) : null);
        h.setJoursTravail(request.getJoursTravail());

        return toHoraireDTO(horaireTravailRepository.save(h));
    }

    public void deleteHoraire(Long id) {
        if (!horaireTravailRepository.existsById(id)) {
            throw new ResourceNotFoundException("HoraireTravail", id);
        }
        horaireTravailRepository.deleteById(id);
    }

    // =============================================
    // MAPPERS
    // =============================================

    private CalendrierDTO toCalendrierDTO(Calendrier cal) {
        return CalendrierDTO.builder()
                .id(cal.getId())
                .dateJour(cal.getDateJour().toString())
                .nomJour(cal.getNomJour())
                .typeJour(cal.getTypeJour())
                .origine(cal.getOrigine())
                .description(cal.getDescription())
                .estPaye(cal.getEstPaye())
                .build();
    }

    private HoraireTravailDTO toHoraireDTO(HoraireTravail h) {
        return HoraireTravailDTO.builder()
                .id(h.getId())
                .nom(h.getNom())
                .heureDebut(h.getHeureDebut().toString())
                .heureFin(h.getHeureFin().toString())
                .pauseDebutMidi(h.getPauseDebutMidi() != null ? h.getPauseDebutMidi().toString() : null)
                .pauseFinMidi(h.getPauseFinMidi() != null ? h.getPauseFinMidi().toString() : null)
                .joursTravail(h.getJoursTravail())
                .build();
    }
}
