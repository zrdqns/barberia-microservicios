package com.barberia.catalogo.controller;

import com.barberia.catalogo.dto.ServicioDTORequest;
import com.barberia.catalogo.dto.ServicioDTOResponse;
import com.barberia.catalogo.model.Servicio;
import com.barberia.catalogo.service.ServicioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/servicios")
@RequiredArgsConstructor
public class ServicioController {

    private final ServicioService servicioService;

    // POST /api/servicios
    @PostMapping
    public ResponseEntity<ServicioDTOResponse> crear(@RequestBody ServicioDTORequest request) {
        Servicio creado = servicioService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(aRespuesta(creado));
    }

    // GET /api/servicios
    // El mismo recurso se puede pedir en JSON o en XML con el header Accept.
    @GetMapping(produces = {
            MediaType.APPLICATION_JSON_VALUE,
            MediaType.APPLICATION_XML_VALUE
    })
    public ResponseEntity<List<ServicioDTOResponse>> listar() {
        List<ServicioDTOResponse> respuesta = new ArrayList<>();

        for (Servicio servicio : servicioService.listar()) {
            respuesta.add(aRespuesta(servicio));
        }

        return ResponseEntity.ok(respuesta);
    }

    // GET /api/servicios/{id}
    @GetMapping(
            value = "/{id}",
            produces = {
                    MediaType.APPLICATION_JSON_VALUE,
                    MediaType.APPLICATION_XML_VALUE
            }
    )
    public ResponseEntity<ServicioDTOResponse> buscarPorId(@PathVariable int id) {
        return ResponseEntity.ok(aRespuesta(servicioService.buscarPorId(id)));
    }

    // PUT /api/servicios/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ServicioDTOResponse> actualizar(
            @PathVariable int id,
            @RequestBody ServicioDTORequest request) {

        return ResponseEntity.ok(aRespuesta(servicioService.actualizar(id, request)));
    }

    // DELETE /api/servicios/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable int id) {
        servicioService.eliminar(id);

        return ResponseEntity.ok(Map.of("mensaje", "Servicio eliminado correctamente."));
    }

    // Modelo -> DTO de respuesta
    private ServicioDTOResponse aRespuesta(Servicio servicio) {
        return new ServicioDTOResponse(
                servicio.getId(),
                servicio.getNombre(),
                servicio.getDescripcion(),
                servicio.getPrecio(),
                servicio.getDuracionMinutos(),
                servicio.isActivo()
        );
    }
}
