package com.barberia.citas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Datos que la API devuelve de un cliente.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTOResponse {

    private int id;
    private String nombre;
    private String documento;
    private String telefono;
    private String correo;
}
