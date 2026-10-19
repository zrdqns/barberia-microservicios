package com.barberia.citas.service;

import com.barberia.citas.dto.ClienteDTORequest;
import com.barberia.citas.model.Cliente;
import com.barberia.citas.repository.CitaRepository;
import com.barberia.citas.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ClienteService {

    // Los datos viven en la tabla citas.cliente de la base de datos
    private final ClienteRepository clienteRepository;
    private final CitaRepository citaRepository;

    public Cliente crear(ClienteDTORequest request) {
        validar(request, 0);

        Cliente cliente = new Cliente();
        copiarDatos(request, cliente);

        return clienteRepository.save(cliente);
    }

    public List<Cliente> listar() {
        return clienteRepository.findAllByOrderByIdAsc();
    }

    public Cliente buscarPorId(int id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No se encontró un cliente con el ID " + id + "."));
    }

    public Cliente actualizar(int id, ClienteDTORequest request) {
        Cliente cliente = buscarPorId(id);
        validar(request, id);

        copiarDatos(request, cliente);
        return clienteRepository.save(cliente);
    }

    // Las dos operaciones van en una sola transacción: o se hacen ambas o ninguna.
    // Las citas anteriores del cliente se conservan con su nombre.
    @Transactional
    public void eliminar(int id) {
        Cliente cliente = buscarPorId(id);

        citaRepository.desvincularCliente(id, cliente.getNombre());
        clienteRepository.delete(cliente);
    }

    private void copiarDatos(ClienteDTORequest request, Cliente cliente) {
        cliente.setNombre(request.getNombre().trim());
        cliente.setDocumento(request.getDocumento().trim());
        cliente.setTelefono(request.getTelefono().trim());
        cliente.setCorreo(request.getCorreo() == null || request.getCorreo().isBlank() ? null : request.getCorreo().trim());
    }

    // idActual es el cliente que se está editando (0 al crear),
    // para no compararlo consigo mismo al revisar documentos repetidos.
    private void validar(ClienteDTORequest request, int idActual) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del cliente es obligatorio.");
        }
        if (request.getNombre().trim().length() > 100) {
            throw new IllegalArgumentException("El nombre no puede pasar de 100 caracteres.");
        }
        if (request.getDocumento() == null || !request.getDocumento().trim().matches("\\d{6,10}")) {
            throw new IllegalArgumentException("El documento debe tener entre 6 y 10 dígitos.");
        }
        if (request.getTelefono() == null || !request.getTelefono().trim().matches("\\d{7,10}")) {
            throw new IllegalArgumentException("El teléfono debe tener entre 7 y 10 dígitos.");
        }
        // El correo es opcional, pero si se envía debe tener forma de correo
        if (request.getCorreo() != null && !request.getCorreo().isBlank()
                && !request.getCorreo().trim().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new IllegalArgumentException("El correo no tiene un formato válido.");
        }
        if (clienteRepository.existsByDocumentoAndIdNot(request.getDocumento().trim(), idActual)) {
            throw new IllegalStateException("Ya existe un cliente con el documento " + request.getDocumento().trim() + ".");
        }
    }
}
