package com.antigone.rh.repository;

import com.antigone.rh.entity.Referentiel;
import com.antigone.rh.enums.TypeReferentiel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReferentielRepository extends JpaRepository<Referentiel, Long> {

    List<Referentiel> findByTypeReferentiel(TypeReferentiel typeReferentiel);

    List<Referentiel> findByTypeReferentielAndActifTrue(TypeReferentiel typeReferentiel);

    List<Referentiel> findByActifTrue();

    boolean existsByLibelleAndTypeReferentiel(String libelle, TypeReferentiel typeReferentiel);

    java.util.Optional<Referentiel> findByLibelleAndTypeReferentiel(String libelle, TypeReferentiel typeReferentiel);
}
