package com.barberia.citas.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// Para agendar una cita no se envían los objetos completos:
// basta con los IDs del cliente, el servicio y el barbero.
@Getter
@Setter
public class CitaDTORequest {

    private int clienteId;
    private int servicioId;
    private int barberoId;
    private LocalDateTime fechaHora;
    private String observaciones;
}
