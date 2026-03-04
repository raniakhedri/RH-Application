package com.antigone.rh.repository;

import com.antigone.rh.entity.Referentiel;
import com.antigone.rh.enums.TypeReferentiel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReferentielRepository extends JpaRepository<Referentiel, Long> {

    List<Referentiel> findByTypeReferentiel(TypeReferentiel typeReferentiel);

    List<Referentiel> findByTypeReferentielAndActifTrue(TypeReferentiel typeReferentiel);

    List<Referentiel> findByActifTrue();

    boolean existsByLibelleAndTypeReferentiel(String libelle, TypeReferentiel typeReferentiel);

    Optional<Referentiel> findByLibelleAndTypeReferentiel(String libelle, TypeReferentiel typeReferentiel);
}
