package com.barberia.citas.controller;

import com.barberia.citas.dto.ClienteDTORequest;
import com.barberia.citas.dto.ClienteDTOResponse;
import com.barberia.citas.model.Cliente;
import com.barberia.citas.service.CitaService;
import com.barberia.citas.service.ClienteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;
    private final CitaService citaService;

    // POST /api/clientes
    @PostMapping
    public ResponseEntity<ClienteDTOResponse> crear(@RequestBody ClienteDTORequest request) {
        Cliente creado = clienteService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(aRespuesta(creado));
    }

    // GET /api/clientes
    @GetMapping
    public ResponseEntity<List<ClienteDTOResponse>> listar() {
        List<ClienteDTOResponse> respuesta = new ArrayList<>();

        for (Cliente cliente : clienteService.listar()) {
            respuesta.add(aRespuesta(cliente));
        }

        return ResponseEntity.ok(respuesta);
    }

    // GET /api/clientes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTOResponse> buscarPorId(@PathVariable int id) {
        return ResponseEntity.ok(aRespuesta(clienteService.buscarPorId(id)));
    }

    // PUT /api/clientes/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ClienteDTOResponse> actualizar(
            @PathVariable int id,
            @RequestBody ClienteDTORequest request) {

        return ResponseEntity.ok(aRespuesta(clienteService.actualizar(id, request)));
    }

    // DELETE /api/clientes/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable int id) {
        // Un cliente con citas pendientes no se puede eliminar
        if (citaService.clienteTieneCitasProgramadas(id)) {
            throw new IllegalStateException("El cliente tiene citas programadas. Cancélelas o elimínelas primero.");
        }

        clienteService.eliminar(id);

        return ResponseEntity.ok(Map.of("mensaje", "Cliente eliminado correctamente."));
    }

    // Modelo -> DTO de respuesta
    private ClienteDTOResponse aRespuesta(Cliente cliente) {
        return new ClienteDTOResponse(
                cliente.getId(),
                cliente.getNombre(),
                cliente.getDocumento(),
                cliente.getTelefono(),
                cliente.getCorreo()
        );
    }
}
