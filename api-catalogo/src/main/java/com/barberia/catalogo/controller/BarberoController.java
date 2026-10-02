package com.barberia.catalogo.controller;

import com.barberia.catalogo.dto.BarberoDTORequest;
import com.barberia.catalogo.dto.BarberoDTOResponse;
import com.barberia.catalogo.model.Barbero;
import com.barberia.catalogo.service.BarberoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/barberos")
@RequiredArgsConstructor
public class BarberoController {

    private final BarberoService barberoService;

    // POST /api/barberos
    @PostMapping
    public ResponseEntity<BarberoDTOResponse> crear(@RequestBody BarberoDTORequest request) {
        Barbero creado = barberoService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(aRespuesta(creado));
    }

    // GET /api/barberos
    @GetMapping
    public ResponseEntity<List<BarberoDTOResponse>> listar() {
        List<BarberoDTOResponse> respuesta = new ArrayList<>();

        for (Barbero barbero : barberoService.listar()) {
            respuesta.add(aRespuesta(barbero));
        }

        return ResponseEntity.ok(respuesta);
    }

    // GET /api/barberos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<BarberoDTOResponse> buscarPorId(@PathVariable int id) {
        return ResponseEntity.ok(aRespuesta(barberoService.buscarPorId(id)));
    }

    // PUT /api/barberos/{id}
    @PutMapping("/{id}")
    public ResponseEntity<BarberoDTOResponse> actualizar(
            @PathVariable int id,
            @RequestBody BarberoDTORequest request) {

        return ResponseEntity.ok(aRespuesta(barberoService.actualizar(id, request)));
    }

    // DELETE /api/barberos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable int id) {
        barberoService.eliminar(id);

        return ResponseEntity.ok(Map.of("mensaje", "Barbero eliminado correctamente."));
    }

    // Modelo -> DTO de respuesta
    private BarberoDTOResponse aRespuesta(Barbero barbero) {
        return new BarberoDTOResponse(
                barbero.getId(),
                barbero.getNombre(),
                barbero.getDocumento(),
                barbero.getTelefono(),
                barbero.getEspecialidad(),
                barbero.isActivo()
        );
    }
}
