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

    @Bean
    public RestClient restClient() {
        // La comunicación es síncrona: sin un límite de tiempo, un catálogo
        // lento dejaría esperando indefinidamente a quien agenda la cita.
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(2));
        fabrica.setReadTimeout(Duration.ofSeconds(5));

        return RestClient.builder()
                .baseUrl(apiCatalogoUrl)
                .requestFactory(fabrica)
                .build();
    }
}
