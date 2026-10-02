package com.barberia.catalogo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Datos que la API devuelve de un barbero.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BarberoDTOResponse {

    private int id;
    private String nombre;
    private String documento;
    private String telefono;
    private String especialidad;
    private boolean activo;
}
