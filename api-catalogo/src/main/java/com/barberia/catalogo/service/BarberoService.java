package com.barberia.catalogo.service;

import com.barberia.catalogo.dto.BarberoDTORequest;
import com.barberia.catalogo.model.Barbero;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class BarberoService {

    // Los datos se almacenan temporalmente en memoria.
    // El servidor atiende cada petición en un hilo distinto y todos comparten esta lista,
    // por eso los métodos públicos son synchronized: entra una petición a la vez.
    private final List<Barbero> barberos = new ArrayList<>();
    private int siguienteId = 1;

    // Datos de demostración.
    public BarberoService() {
        barberos.add(new Barbero(siguienteId++, "Andrés Rojas", "1012345678", "3104567890", "Cortes clásicos", true));
        barberos.add(new Barbero(siguienteId++, "Julián Mora", "1023456789", "3115678901", "Barba y afeitado", true));
        barberos.add(new Barbero(siguienteId++, "Felipe Cárdenas", "1034567890", "3126789012", "Degradados", false));
    }

    public synchronized Barbero crear(BarberoDTORequest request) {
        validar(request, 0);

        Barbero barbero = new Barbero();
        barbero.setId(siguienteId++);
        copiarDatos(request, barbero);
        barbero.setActivo(request.getActivo() == null || request.getActivo());

        barberos.add(barbero);
        return barbero;
    }

    public synchronized List<Barbero> listar() {
        // Se entrega una copia: quien la recorre no se cruza con otra petición que la modifique
        return new ArrayList<>(barberos);
    }

    public synchronized Barbero buscarPorId(int id) {
        for (Barbero barbero : barberos) {
            if (barbero.getId() == id) {
                return barbero;
            }
        }
        throw new NoSuchElementException("No se encontró un barbero con el ID " + id + ".");
    }

    public synchronized Barbero actualizar(int id, BarberoDTORequest request) {
        Barbero barbero = buscarPorId(id);
        validar(request, id);

        copiarDatos(request, barbero);
        if (request.getActivo() != null) {
            barbero.setActivo(request.getActivo());
        }
        return barbero;
    }

    public synchronized void eliminar(int id) {
        barberos.remove(buscarPorId(id));
    }

    private void copiarDatos(BarberoDTORequest request, Barbero barbero) {
        barbero.setNombre(request.getNombre().trim());
        barbero.setDocumento(request.getDocumento().trim());
        barbero.setTelefono(request.getTelefono());
        barbero.setEspecialidad(request.getEspecialidad());
    }

    private void validar(BarberoDTORequest request, int idActual) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del barbero es obligatorio.");
        }
        if (request.getDocumento() == null || !request.getDocumento().trim().matches("\\d{6,10}")) {
            throw new IllegalArgumentException("El documento debe tener entre 6 y 10 dígitos.");
        }
        for (Barbero otro : barberos) {
            if (otro.getId() != idActual && otro.getDocumento().equals(request.getDocumento().trim())) {
                throw new IllegalStateException("Ya existe un barbero con el documento " + otro.getDocumento() + ".");
            }
        }
    }
}
