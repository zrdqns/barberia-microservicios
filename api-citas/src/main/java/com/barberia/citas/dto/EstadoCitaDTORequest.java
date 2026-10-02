package com.barberia.citas.dto;

import com.barberia.citas.model.EstadoCita;
import lombok.Getter;
import lombok.Setter;

// Cuerpo del PATCH: solo cambia el estado de la cita.
@Getter
@Setter
public class EstadoCitaDTORequest {

    private EstadoCita estado;
}
