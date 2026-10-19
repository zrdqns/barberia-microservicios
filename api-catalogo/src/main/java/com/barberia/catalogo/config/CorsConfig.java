package com.barberia.catalogo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Permite que el frontend, que corre en otro puerto o dominio, consuma esta API.
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // Uno o varios orígenes separados por comas: el local y el de Vercel
    @Value("${frontend.url}")
    private String[] frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(frontendUrl)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE");
    }
}
