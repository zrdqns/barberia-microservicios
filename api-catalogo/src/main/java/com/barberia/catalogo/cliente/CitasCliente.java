package com.barberia.catalogo.cliente;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

// Se encarga de la comunicación con api-citas.
// Antes de eliminar un servicio o un barbero se pregunta si alguna cita programada lo usa.
@Component
@RequiredArgsConstructor
public class CitasCliente {

    private final RestClient restClient;

    // GET {api.citas.url}/api/citas?{campo}={id}&estado=PROGRAMADA
    // campo es servicioId o barberoId
    public int contarProgramadas(String campo, int id) {
        List<Map<String, Object>> citas = restClient.get()
                .uri("/api/citas?{campo}={id}&estado=PROGRAMADA", campo, id)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
        return citas == null ? 0 : citas.size();
    }
}
