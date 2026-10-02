package com.barberia.citas.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Los barberos los administra api-catalogo.
// Esta clase solo recibe la respuesta de esa API (JSON -> objeto Java).
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Barbero {

    private int id;
    private String nombre;
    private String especialidad;
    private boolean activo;
}
