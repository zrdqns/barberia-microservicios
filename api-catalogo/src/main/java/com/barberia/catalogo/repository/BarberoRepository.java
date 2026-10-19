package com.barberia.catalogo.repository;

import com.barberia.catalogo.model.Barbero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Spring Data genera las consultas a partir del nombre de cada método
public interface BarberoRepository extends JpaRepository<Barbero, Integer> {

    List<Barbero> findAllByOrderByIdAsc();

    // ¿Otro barbero, distinto del que se edita, ya tiene ese documento?
    boolean existsByDocumentoAndIdNot(String documento, int id);
}
