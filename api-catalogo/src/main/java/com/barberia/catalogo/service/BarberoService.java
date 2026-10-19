package com.barberia.catalogo.service;

import com.barberia.catalogo.cliente.CitasCliente;
import com.barberia.catalogo.dto.BarberoDTORequest;
import com.barberia.catalogo.model.Barbero;
import com.barberia.catalogo.repository.BarberoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class BarberoService {

    // Los datos viven en la tabla catalogo.barbero de la base de datos
    private final BarberoRepository barberoRepository;
    private final CitasCliente citasCliente;

    public Barbero crear(BarberoDTORequest request) {
        validar(request, 0);

        Barbero barbero = new Barbero();
        copiarDatos(request, barbero);
        barbero.setActivo(request.getActivo() == null || request.getActivo());

        return barberoRepository.save(barbero);
    }

    public List<Barbero> listar() {
        return barberoRepository.findAllByOrderByIdAsc();
    }

    public Barbero buscarPorId(int id) {
        return barberoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No se encontró un barbero con el ID " + id + "."));
    }

    public Barbero actualizar(int id, BarberoDTORequest request) {
        Barbero barbero = buscarPorId(id);
        validar(request, id);

        copiarDatos(request, barbero);
        if (request.getActivo() != null) {
            barbero.setActivo(request.getActivo());
        }
        return barberoRepository.save(barbero);
    }

    // Un barbero con citas programadas no se elimina: esos clientes llegarían y nadie los atendería.
    // Las citas viven en api-citas, así que se le pregunta antes.
    public void eliminar(int id) {
        Barbero barbero = buscarPorId(id);

        int programadas = citasCliente.contarProgramadas("barberoId", id);
        if (programadas > 0) {
            throw new IllegalStateException(barbero.getNombre() + " tiene " + (programadas == 1
                    ? "1 cita programada. Pásela a otro barbero o cancélela primero"
                    : programadas + " citas programadas. Páselas a otro barbero o cancélelas primero")
                    + ", o márquelo como inactivo.");
        }

        barberoRepository.delete(barbero);
    }

    private void copiarDatos(BarberoDTORequest request, Barbero barbero) {
        barbero.setNombre(request.getNombre().trim());
        barbero.setDocumento(request.getDocumento().trim());
        barbero.setTelefono(request.getTelefono() == null || request.getTelefono().isBlank() ? null : request.getTelefono().trim());
        barbero.setEspecialidad(request.getEspecialidad());
    }

    private void validar(BarberoDTORequest request, int idActual) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del barbero es obligatorio.");
        }
        if (request.getNombre().trim().length() > 100) {
            throw new IllegalArgumentException("El nombre no puede pasar de 100 caracteres.");
        }
        if (request.getEspecialidad() != null && request.getEspecialidad().length() > 255) {
            throw new IllegalArgumentException("La especialidad no puede pasar de 255 caracteres.");
        }
        if (request.getDocumento() == null || !request.getDocumento().trim().matches("\\d{6,10}")) {
            throw new IllegalArgumentException("El documento debe tener entre 6 y 10 dígitos.");
        }
        // El teléfono es opcional, pero si se envía sigue la misma regla que el de los clientes
        if (request.getTelefono() != null && !request.getTelefono().isBlank()
                && !request.getTelefono().trim().matches("\\d{7,10}")) {
            throw new IllegalArgumentException("El teléfono debe tener entre 7 y 10 dígitos.");
        }
        if (barberoRepository.existsByDocumentoAndIdNot(request.getDocumento().trim(), idActual)) {
            throw new IllegalStateException("Ya existe un barbero con el documento " + request.getDocumento().trim() + ".");
        }
    }
}
