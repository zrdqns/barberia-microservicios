package com.barberia.catalogo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Tabla catalogo.barbero
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Barbero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String nombre;
    private String documento;
    private String telefono;
    private String especialidad;
    private boolean activo;
}
