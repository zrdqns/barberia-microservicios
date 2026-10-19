package com.barberia.catalogo.service;

import com.barberia.catalogo.cliente.CitasCliente;
import com.barberia.catalogo.dto.ServicioDTORequest;
import com.barberia.catalogo.model.Servicio;
import com.barberia.catalogo.repository.ServicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ServicioService {

    // Los datos viven en la tabla catalogo.servicio de la base de datos
    private final ServicioRepository servicioRepository;
    private final CitasCliente citasCliente;

    public Servicio crear(ServicioDTORequest request) {
        validar(request, 0);

        Servicio servicio = new Servicio();
        copiarDatos(request, servicio);
        // Si el cliente no indica el estado, lo define la aplicación.
        servicio.setActivo(request.getActivo() == null || request.getActivo());

        return servicioRepository.save(servicio);
    }

    public List<Servicio> listar() {
        return servicioRepository.findAllByOrderByIdAsc();
    }

    public Servicio buscarPorId(int id) {
        return servicioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No se encontró un servicio con el ID " + id + "."));
    }

    public Servicio actualizar(int id, ServicioDTORequest request) {
        Servicio servicio = buscarPorId(id);
        validar(request, id);

        copiarDatos(request, servicio);
        if (request.getActivo() != null) {
            servicio.setActivo(request.getActivo());
        }
        return servicioRepository.save(servicio);
    }

    // Un servicio con citas programadas no se elimina: esas citas quedarían sin servicio.
    // Las citas viven en api-citas, así que se le pregunta antes.
    public void eliminar(int id) {
        Servicio servicio = buscarPorId(id);

        int programadas = citasCliente.contarProgramadas("servicioId", id);
        if (programadas > 0) {
            throw new IllegalStateException("El servicio " + servicio.getNombre() + " tiene " + (programadas == 1
                    ? "1 cita programada. Cancélela o cámbiela de servicio primero"
                    : programadas + " citas programadas. Cancélelas o cámbielas de servicio primero")
                    + ", o desactívelo para que no se agende más.");
        }

        servicioRepository.delete(servicio);
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
        if (request.getNombre().trim().length() > 100) {
            throw new IllegalArgumentException("El nombre no puede pasar de 100 caracteres.");
        }
        if (request.getDescripcion() != null && request.getDescripcion().length() > 255) {
            throw new IllegalArgumentException("La descripción no puede pasar de 255 caracteres.");
        }
        if (request.getPrecio() <= 0) {
            throw new IllegalArgumentException("El precio debe ser mayor que cero.");
        }
        if (request.getDuracionMinutos() < 5 || request.getDuracionMinutos() > 240) {
            throw new IllegalArgumentException("La duración debe estar entre 5 y 240 minutos.");
        }
        if (servicioRepository.existsByNombreIgnoreCaseAndIdNot(request.getNombre().trim(), idActual)) {
            throw new IllegalStateException("Ya existe un servicio con el nombre " + request.getNombre().trim() + ".");
        }
    }
}
