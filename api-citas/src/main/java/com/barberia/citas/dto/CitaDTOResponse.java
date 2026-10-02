package com.barberia.citas.dto;

import com.barberia.citas.model.EstadoCita;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// Datos que la API devuelve de una cita, con lo necesario
// del cliente, el servicio y el barbero para mostrarla.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CitaDTOResponse {

    private int id;
    private LocalDateTime fechaHora;
    private EstadoCita estado;
    private String observaciones;

    private int clienteId;
    private String clienteNombre;

    private int servicioId;
    private String servicioNombre;
    private int precio;
    private int duracionMinutos;

    private int barberoId;
    private String barberoNombre;
}
