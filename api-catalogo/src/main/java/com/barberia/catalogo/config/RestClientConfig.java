package com.barberia.catalogo.config;

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
    @Value("${api.citas.url}")
    private String apiCitasUrl;

    @Bean
    public RestClient restClient() {
        // Comunicación síncrona con límite de tiempo, igual que la de api-citas hacia este microservicio
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(2));
        fabrica.setReadTimeout(Duration.ofSeconds(5));

        return RestClient.builder()
                .baseUrl(apiCitasUrl)
                .requestFactory(fabrica)
                .build();
    }
}
