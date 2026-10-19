package com.barberia.citas.repository;

import com.barberia.citas.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Spring Data genera las consultas a partir del nombre de cada método
public interface ClienteRepository extends JpaRepository<Cliente, Integer> {

    List<Cliente> findAllByOrderByIdAsc();

    // ¿Otro cliente, distinto del que se edita, ya tiene ese documento?
    boolean existsByDocumentoAndIdNot(String documento, int id);
}
