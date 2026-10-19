package com.barberia.citas.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

// El horario de un día de la semana
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HorarioDTOResponse {

    // 1 = lunes ... 7 = domingo
    private int diaSemana;
    private String dia;
    private boolean abierto;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime apertura;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime cierre;
}
