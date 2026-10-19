package com.barberia.citas.repository;

import com.barberia.citas.model.Horario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Integer> {

    List<Horario> findAllByOrderByDiaSemanaAsc();
}
