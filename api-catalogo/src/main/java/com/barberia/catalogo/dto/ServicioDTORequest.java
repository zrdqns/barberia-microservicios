package com.barberia.catalogo.dto;

import lombok.Getter;
import lombok.Setter;

// Datos que el cliente envía para crear o actualizar un servicio.
// El id no viaja aquí: lo asigna la aplicación.
@Getter
@Setter
public class ServicioDTORequest {

    private String nombre;
    private String descripcion;
    private int precio;
    private int duracionMinutos;
    // Opcional. Si no se envía, el servicio queda activo.
    private Boolean activo;
}
