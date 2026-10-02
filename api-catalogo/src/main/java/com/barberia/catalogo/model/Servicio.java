package com.barberia.catalogo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Servicio {

    private int id;
    private String nombre;
    private String descripcion;
    // Precio en pesos colombianos, sin decimales
    private int precio;
    private int duracionMinutos;
    private boolean activo;
}
