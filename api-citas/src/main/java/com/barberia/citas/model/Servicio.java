package com.barberia.citas.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Los servicios los administra api-catalogo.
// Esta clase solo recibe la respuesta de esa API (JSON -> objeto Java).
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Servicio {

    private int id;
    private String nombre;
    private int precio;
    private int duracionMinutos;
    private boolean activo;
}
