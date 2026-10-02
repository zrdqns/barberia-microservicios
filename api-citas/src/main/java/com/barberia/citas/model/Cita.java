package com.barberia.citas.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cita {

    private int id;
    private LocalDateTime fechaHora;
    private EstadoCita estado;
    private String observaciones;

    // El cliente pertenece a esta API
    private Cliente cliente;

    // El servicio y el barbero se consultan en api-catalogo al agendar
    private Servicio servicio;
    private Barbero barbero;

    // Momento en que termina la cita según la duración del servicio
    public LocalDateTime calcularFin() {
        return fechaHora.plusMinutes(servicio.getDuracionMinutos());
    }
}
