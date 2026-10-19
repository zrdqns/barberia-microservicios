package com.barberia.catalogo.repository;

import com.barberia.catalogo.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Spring Data genera las consultas a partir del nombre de cada método
public interface ServicioRepository extends JpaRepository<Servicio, Integer> {

    List<Servicio> findAllByOrderByIdAsc();

    // ¿Otro servicio, distinto del que se edita, ya usa ese nombre?
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, int id);
}
