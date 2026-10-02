package com.barberia.citas.cliente;

import com.barberia.citas.model.Barbero;
import com.barberia.citas.model.Servicio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

// Se encarga de la comunicación con api-catalogo.
// Es comunicación síncrona: api-citas espera la respuesta antes de continuar.
@Component
@RequiredArgsConstructor
public class CatalogoCliente {

    private final RestClient restClient;

    // GET {api.catalogo.url}/api/servicios/{id}
    // Devuelve null si el catálogo responde 404.
    public Servicio buscarServicio(int id) {
        try {
            return restClient.get()
                    .uri("/api/servicios/{id}", id)
                    .retrieve()
                    .body(Servicio.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    // GET {api.catalogo.url}/api/barberos/{id}
    // Devuelve null si el catálogo responde 404.
    public Barbero buscarBarbero(int id) {
        try {
            return restClient.get()
                    .uri("/api/barberos/{id}", id)
                    .retrieve()
                    .body(Barbero.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    // GET {api.catalogo.url}/api/status
    public String verificarConexion() {
        return restClient.get()
                .uri("/api/status")
                .retrieve()
                .body(String.class);
    }
}
