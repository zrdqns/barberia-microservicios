package com.barberia.citas.dto;

import lombok.Getter;
import lombok.Setter;

// Datos que el cliente de la API envía para crear o actualizar un cliente.
// El id no viaja aquí: lo asigna la aplicación.
@Getter
@Setter
public class ClienteDTORequest {

    private String nombre;
    private String documento;
    private String telefono;
    private String correo;
}
