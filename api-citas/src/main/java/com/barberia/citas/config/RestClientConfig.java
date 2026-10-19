package com.barberia.citas.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    // La dirección del otro microservicio viene de application.properties,
    // no queda escrita en el código.
    @Value("${api.catalogo.url}")
    private String apiCatalogoUrl;

    // Cuánto se espera la respuesta (api.timeout en application.properties)
    @Value("${api.timeout}")
    private Duration espera;

    @Bean
    public RestClient restClient() {
        // La comunicación es síncrona: sin un límite de tiempo, un catálogo
        // lento dejaría esperando indefinidamente a quien agenda la cita.
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(espera);

        return RestClient.builder()
                .baseUrl(apiCatalogoUrl)
                .requestFactory(fabrica)
                .build();
    }
}
