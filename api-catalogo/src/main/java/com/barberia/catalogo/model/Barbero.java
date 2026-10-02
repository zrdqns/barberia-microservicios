package com.barberia.catalogo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Barbero {

    private int id;
    private String nombre;
    private String documento;
    private String telefono;
    private String especialidad;
    private boolean activo;
}
