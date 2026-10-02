package com.barberia.citas.service;

import com.barberia.citas.dto.ClienteDTORequest;
import com.barberia.citas.model.Cliente;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ClienteService {

    // Los datos se almacenan temporalmente en memoria.
    // El servidor atiende cada petición en un hilo distinto y todos comparten esta lista,
    // por eso los métodos públicos son synchronized: entra una petición a la vez.
    private final List<Cliente> clientes = new ArrayList<>();
    private int siguienteId = 1;

    // Datos de demostración.
    public ClienteService() {
        clientes.add(new Cliente(siguienteId++, "Carlos Ramírez", "1098765432", "3001234567", "carlos.ramirez@correo.com"));
        clientes.add(new Cliente(siguienteId++, "Mateo Herrera", "1087654321", "3012345678", "mateo.herrera@correo.com"));
        clientes.add(new Cliente(siguienteId++, "Santiago López", "1076543210", "3023456789", ""));
    }

    public synchronized Cliente crear(ClienteDTORequest request) {
        validar(request, 0);

        Cliente cliente = new Cliente();
        cliente.setId(siguienteId++);
        copiarDatos(request, cliente);

        clientes.add(cliente);
        return cliente;
    }

    public synchronized List<Cliente> listar() {
        // Se entrega una copia: quien la recorre no se cruza con otra petición que la modifique
        return new ArrayList<>(clientes);
    }

    public synchronized Cliente buscarPorId(int id) {
        for (Cliente cliente : clientes) {
            if (cliente.getId() == id) {
                return cliente;
            }
        }
        throw new NoSuchElementException("No se encontró un cliente con el ID " + id + ".");
    }

    public synchronized Cliente actualizar(int id, ClienteDTORequest request) {
        Cliente cliente = buscarPorId(id);
        validar(request, id);

        copiarDatos(request, cliente);
        return cliente;
    }

    public synchronized void eliminar(int id) {
        clientes.remove(buscarPorId(id));
    }

    private void copiarDatos(ClienteDTORequest request, Cliente cliente) {
        cliente.setNombre(request.getNombre().trim());
        cliente.setDocumento(request.getDocumento().trim());
        cliente.setTelefono(request.getTelefono());
        cliente.setCorreo(request.getCorreo());
    }

    // idActual es el cliente que se está editando (0 al crear),
    // para no compararlo consigo mismo al revisar documentos repetidos.
    private void validar(ClienteDTORequest request, int idActual) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del cliente es obligatorio.");
        }
        if (request.getDocumento() == null || !request.getDocumento().trim().matches("\\d{6,10}")) {
            throw new IllegalArgumentException("El documento debe tener entre 6 y 10 dígitos.");
        }
        if (request.getTelefono() == null || !request.getTelefono().matches("\\d{7,10}")) {
            throw new IllegalArgumentException("El teléfono debe tener entre 7 y 10 dígitos.");
        }
        // El correo es opcional, pero si se envía debe tener forma de correo
        if (request.getCorreo() != null && !request.getCorreo().isBlank()
                && !request.getCorreo().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new IllegalArgumentException("El correo no tiene un formato válido.");
        }
        for (Cliente otro : clientes) {
            if (otro.getId() != idActual && otro.getDocumento().equals(request.getDocumento().trim())) {
                throw new IllegalStateException("Ya existe un cliente con el documento " + otro.getDocumento() + ".");
            }
        }
    }
}
