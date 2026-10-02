package com.barberia.catalogo.service;

import com.barberia.catalogo.dto.ServicioDTORequest;
import com.barberia.catalogo.model.Servicio;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ServicioService {

    // Los datos se almacenan temporalmente en memoria.
    // El servidor atiende cada petición en un hilo distinto y todos comparten esta lista,
    // por eso los métodos públicos son synchronized: entra una petición a la vez.
    private final List<Servicio> servicios = new ArrayList<>();
    private int siguienteId = 1;

    // Datos de demostración para no arrancar con el catálogo vacío.
    public ServicioService() {
        servicios.add(new Servicio(siguienteId++, "Corte clásico", "Corte a tijera o máquina con lavado", 25000, 30, true));
        servicios.add(new Servicio(siguienteId++, "Arreglo de barba", "Perfilado y afeitado con navaja", 18000, 20, true));
        servicios.add(new Servicio(siguienteId++, "Corte y barba", "Corte clásico más arreglo de barba", 38000, 50, true));
        servicios.add(new Servicio(siguienteId++, "Tinte", "Aplicación de color completo", 60000, 90, false));
    }

    public synchronized Servicio crear(ServicioDTORequest request) {
        validar(request, 0);

        Servicio servicio = new Servicio();
        servicio.setId(siguienteId++);
        copiarDatos(request, servicio);
        // Si el cliente no indica el estado, lo define la aplicación.
        servicio.setActivo(request.getActivo() == null || request.getActivo());

        servicios.add(servicio);
        return servicio;
    }

    public synchronized List<Servicio> listar() {
        // Se entrega una copia: quien la recorre no se cruza con otra petición que la modifique
        return new ArrayList<>(servicios);
    }

    public synchronized Servicio buscarPorId(int id) {
        for (Servicio servicio : servicios) {
            if (servicio.getId() == id) {
                return servicio;
            }
        }
        throw new NoSuchElementException("No se encontró un servicio con el ID " + id + ".");
    }

    public synchronized Servicio actualizar(int id, ServicioDTORequest request) {
        Servicio servicio = buscarPorId(id);
        validar(request, id);

        copiarDatos(request, servicio);
        if (request.getActivo() != null) {
            servicio.setActivo(request.getActivo());
        }
        return servicio;
    }

    public synchronized void eliminar(int id) {
        servicios.remove(buscarPorId(id));
    }

    private void copiarDatos(ServicioDTORequest request, Servicio servicio) {
        servicio.setNombre(request.getNombre().trim());
        servicio.setDescripcion(request.getDescripcion());
        servicio.setPrecio(request.getPrecio());
        servicio.setDuracionMinutos(request.getDuracionMinutos());
    }

    // idActual es el servicio que se está editando (0 al crear),
    // para no compararlo consigo mismo al revisar nombres repetidos.
    private void validar(ServicioDTORequest request, int idActual) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del servicio es obligatorio.");
        }
        if (request.getPrecio() <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor que cero.");
        }
        if (request.getDuracionMinutos() < 5 || request.getDuracionMinutos() > 240) {
            throw new IllegalArgumentException("La duración debe estar entre 5 y 240 minutos.");
        }
        for (Servicio otro : servicios) {
            if (otro.getId() != idActual && otro.getNombre().equalsIgnoreCase(request.getNombre().trim())) {
                throw new IllegalStateException("Ya existe un servicio con el nombre " + otro.getNombre() + ".");
            }
        }
    }
}
