package com.barberia.catalogo.dto;

import lombok.Getter;
import lombok.Setter;

// Datos que el cliente envía para crear o actualizar un barbero.
@Getter
@Setter
public class BarberoDTORequest {

    private String nombre;
    private String documento;
    private String telefono;
    private String especialidad;
    // Opcional. Si no se envía, el barbero queda activo.
    private Boolean activo;
}
