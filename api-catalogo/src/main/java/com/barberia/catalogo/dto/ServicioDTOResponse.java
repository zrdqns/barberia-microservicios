package com.barberia.catalogo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Datos que la API devuelve de un servicio.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServicioDTOResponse {

    private int id;
    private String nombre;
    private String descripcion;
    private int precio;
    private int duracionMinutos;
    private boolean activo;
}
