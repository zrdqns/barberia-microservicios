package com.barberia.citas.controller;

import com.barberia.citas.dto.CitaDTORequest;
import com.barberia.citas.dto.CitaDTOResponse;
import com.barberia.citas.dto.EstadoCitaDTORequest;
import com.barberia.citas.model.Cita;
import com.barberia.citas.service.CitaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/citas")
@RequiredArgsConstructor
public class CitaController {

    private final CitaService citaService;

    // POST /api/citas
    // Agenda la cita. El service consulta el servicio y el barbero en api-catalogo.
    @PostMapping
    public ResponseEntity<CitaDTOResponse> crear(@RequestBody CitaDTORequest request) {
        Cita creada = citaService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(aRespuesta(creada));
    }

    // GET /api/citas
    @GetMapping
    public ResponseEntity<List<CitaDTOResponse>> listar() {
        List<CitaDTOResponse> respuesta = new ArrayList<>();

        for (Cita cita : citaService.listar()) {
            respuesta.add(aRespuesta(cita));
        }

        return ResponseEntity.ok(respuesta);
    }

    // GET /api/citas/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CitaDTOResponse> buscarPorId(@PathVariable int id) {
        return ResponseEntity.ok(aRespuesta(citaService.buscarPorId(id)));
    }

    // PUT /api/citas/{id}
    // Reemplaza los datos de la cita (reprogramar, cambiar servicio o barbero).
    @PutMapping("/{id}")
    public ResponseEntity<CitaDTOResponse> actualizar(
            @PathVariable int id,
            @RequestBody CitaDTORequest request) {

        return ResponseEntity.ok(aRespuesta(citaService.actualizar(id, request)));
    }

    // PATCH /api/citas/{id}/estado
    // Modificación parcial: solo cambia el estado (completar o cancelar).
    @PatchMapping("/{id}/estado")
    public ResponseEntity<CitaDTOResponse> cambiarEstado(
            @PathVariable int id,
            @RequestBody EstadoCitaDTORequest request) {

        return ResponseEntity.ok(aRespuesta(citaService.cambiarEstado(id, request.getEstado())));
    }

    // DELETE /api/citas/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable int id) {
        citaService.eliminar(id);

        return ResponseEntity.ok(Map.of("mensaje", "Cita eliminada correctamente."));
    }

    // Modelo -> DTO de respuesta
    private CitaDTOResponse aRespuesta(Cita cita) {
        return new CitaDTOResponse(
                cita.getId(),
                cita.getFechaHora(),
                cita.getEstado(),
                cita.getObservaciones(),
                cita.getCliente().getId(),
                cita.getCliente().getNombre(),
                cita.getServicio().getId(),
                cita.getServicio().getNombre(),
                cita.getServicio().getPrecio(),
                cita.getServicio().getDuracionMinutos(),
                cita.getBarbero().getId(),
                cita.getBarbero().getNombre()
        );
    }
}
