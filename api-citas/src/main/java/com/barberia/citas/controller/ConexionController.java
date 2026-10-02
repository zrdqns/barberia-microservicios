package com.barberia.citas.controller;

import com.barberia.citas.cliente.CatalogoCliente;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/conexion")
@RequiredArgsConstructor
public class ConexionController {

    private final CatalogoCliente catalogoCliente;

    // GET /api/conexion/catalogo
    // Comprueba desde este backend que api-catalogo responde.
    // Si está apagada, ManejadorErrores devuelve 503.
    @GetMapping("/catalogo")
    public ResponseEntity<Map<String, String>> conexionCatalogo() {
        String respuesta = catalogoCliente.verificarConexion();

        return ResponseEntity.ok(Map.of("mensaje", respuesta));
    }
}
