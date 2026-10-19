package com.barberia.citas.controller;

import com.barberia.citas.dto.HorarioDTORequest;
import com.barberia.citas.dto.HorarioDTOResponse;
import com.barberia.citas.model.Horario;
import com.barberia.citas.service.HorarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/horario")
@RequiredArgsConstructor
public class HorarioController {

    private final HorarioService horarioService;

    // GET /api/horario
    // Los siete días de la semana con su apertura y cierre. Lo usan la interfaz web y el bot.
    @GetMapping
    public ResponseEntity<List<HorarioDTOResponse>> listar() {
        List<HorarioDTOResponse> respuesta = new ArrayList<>();

        for (Horario horario : horarioService.listar()) {
            respuesta.add(aRespuesta(horario));
        }

        return ResponseEntity.ok(respuesta);
    }

    // PUT /api/horario/{diaSemana}
    // Cambia la apertura y el cierre de un día; las dos en null lo cierran.
    @PutMapping("/{diaSemana}")
    public ResponseEntity<HorarioDTOResponse> actualizar(
            @PathVariable int diaSemana,
            @RequestBody HorarioDTORequest request) {

        return ResponseEntity.ok(aRespuesta(horarioService.actualizar(diaSemana, request)));
    }

    // Modelo -> DTO de respuesta
    private HorarioDTOResponse aRespuesta(Horario horario) {
        return new HorarioDTOResponse(
                horario.getDiaSemana(),
                HorarioService.DIAS[horario.getDiaSemana()],
                horario.abierto(),
                horario.getApertura(),
                horario.getCierre()
        );
    }
}
