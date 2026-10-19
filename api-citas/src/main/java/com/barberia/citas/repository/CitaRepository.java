package com.barberia.citas.repository;

import com.barberia.citas.model.Cita;
import com.barberia.citas.model.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

// Spring Data genera las consultas a partir del nombre de cada método
public interface CitaRepository extends JpaRepository<Cita, Integer> {

    List<Cita> findAllByOrderByFechaHoraAscIdAsc();

    // Citas en un estado que empiezan dentro de un intervalo
    List<Cita> findByEstadoAndFechaHoraBetween(EstadoCita estado, LocalDateTime desde, LocalDateTime hasta);

    // Citas en un estado que empiezan después de un momento
    List<Cita> findByEstadoAndFechaHoraAfter(EstadoCita estado, LocalDateTime desde);

    boolean existsByClienteIdAndEstado(int clienteId, EstadoCita estado);

    // Antes de eliminar un cliente: sus citas guardan el nombre que tenía y dejan de apuntarle
    @Modifying
    @Query("UPDATE Cita c SET c.clienteNombre = :nombre, c.cliente = null WHERE c.cliente.id = :clienteId")
    int desvincularCliente(@Param("clienteId") int clienteId, @Param("nombre") String nombre);
}
