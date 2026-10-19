package com.barberia.citas.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

// Cuerpo del PUT /api/horario/{diaSemana}. Las dos horas en null: ese día no se atiende.
@Getter
@Setter
public class HorarioDTORequest {

    @JsonFormat(pattern = "HH:mm")
    private LocalTime apertura;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime cierre;
}
