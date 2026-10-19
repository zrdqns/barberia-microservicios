package com.barberia.citas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Tabla citas.cita
@Entity
@Data
@NoArgsConstructor
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private LocalDateTime fechaHora;
    @Enumerated(EnumType.STRING)
    private EstadoCita estado;
    private String observaciones;

    // El cliente pertenece a esta API: llave foránea a citas.cliente.
    // Queda en null si el cliente se elimina; su nombre se conserva en clienteNombre.
    @ManyToOne
    private Cliente cliente;
    private String clienteNombre;

    // El servicio y el barbero se consultan en api-catalogo al agendar.
    // La cita guarda lo que valían en ese momento, aunque después cambien en el catálogo.
    private int servicioId;
    private String servicioNombre;
    private int precio;
    private int duracionMinutos;

    private int barberoId;
    private String barberoNombre;

    // Momento en que termina la cita según la duración del servicio
    public LocalDateTime calcularFin() {
        return fechaHora.plusMinutes(duracionMinutos);
    }

    // El nombre actual del cliente, o el que tenía si ya no existe
    public String nombreCliente() {
        return cliente != null ? cliente.getNombre() : clienteNombre;
    }
}
