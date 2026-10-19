package com.barberia.catalogo.controller;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;
import java.util.NoSuchElementException;

// Convierte los errores que lanzan los services en respuestas HTTP
// con el código que corresponde y un mensaje para el cliente.
@RestControllerAdvice
public class ManejadorErrores {

    // Datos inválidos -> 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> datosInvalidos(IllegalArgumentException e) {
        return respuesta(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    // El cuerpo no se pudo convertir al DTO -> 400
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> cuerpoIlegible(HttpMessageNotReadableException e) {
        return respuesta(HttpStatus.BAD_REQUEST, "El cuerpo de la petición no tiene el formato esperado.");
    }

    // Un ID de la ruta que no es un número, como /api/servicios/abc -> 400
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> parametroInvalido(MethodArgumentTypeMismatchException e) {
        return respuesta(HttpStatus.BAD_REQUEST, "El valor de " + e.getName() + " no es válido.");
    }

    // El recurso no existe -> 404
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> noEncontrado(NoSuchElementException e) {
        return respuesta(HttpStatus.NOT_FOUND, e.getMessage());
    }

    // La operación choca con el estado actual de los datos -> 409
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> conflicto(IllegalStateException e) {
        return respuesta(HttpStatus.CONFLICT, e.getMessage());
    }

    // La base de datos rechazó el cambio por una de sus restricciones (por ejemplo, un dato
    // repetido que llegó al mismo tiempo desde otra petición) -> 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> restriccion(DataIntegrityViolationException e) {
        return respuesta(HttpStatus.CONFLICT, "La base de datos rechazó el cambio: choca con un registro existente.");
    }

    // api-citas está apagada o no respondió al preguntarle por las citas programadas -> 503
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<Map<String, String>> citasNoDisponible(RestClientException e) {
        return respuesta(HttpStatus.SERVICE_UNAVAILABLE,
                "No se pudo consultar api-citas para saber si hay citas programadas. Intente de nuevo cuando esté encendida.");
    }

    private ResponseEntity<Map<String, String>> respuesta(HttpStatus estado, String mensaje) {
        return ResponseEntity
                .status(estado)
                .body(Map.of("mensaje", mensaje));
    }
}
