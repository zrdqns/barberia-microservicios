package com.barberia.citas.service;

import com.barberia.citas.cliente.CatalogoCliente;
import com.barberia.citas.dto.CitaDTORequest;
import com.barberia.citas.model.Barbero;
import com.barberia.citas.model.Cita;
import com.barberia.citas.model.Cliente;
import com.barberia.citas.model.EstadoCita;
import com.barberia.citas.model.Servicio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CitaService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    // Los datos se almacenan temporalmente en memoria.
    // El servidor atiende cada petición en un hilo distinto y todos comparten esta lista,
    // por eso los métodos públicos son synchronized: entra una petición a la vez.
    private final List<Cita> citas = new ArrayList<>();
    private int siguienteId = 1;

    private final ClienteService clienteService;
    private final CatalogoCliente catalogoCliente;

    public synchronized Cita crear(CitaDTORequest request) {
        Cita cita = new Cita();
        asignarDatos(cita, request);

        cita.setId(siguienteId++);
        // El estado inicial lo define la aplicación, no el cliente.
        cita.setEstado(EstadoCita.PROGRAMADA);

        citas.add(cita);
        return cita;
    }

    public synchronized List<Cita> listar() {
        // Se entrega una copia: quien la recorre no se cruza con otra petición que la modifique
        return new ArrayList<>(citas);
    }

    public synchronized Cita buscarPorId(int id) {
        for (Cita cita : citas) {
            if (cita.getId() == id) {
                return cita;
            }
        }
        throw new NoSuchElementException("No se encontró una cita con el ID " + id + ".");
    }

    public synchronized Cita actualizar(int id, CitaDTORequest request) {
        Cita cita = buscarPorId(id);

        if (cita.getEstado() != EstadoCita.PROGRAMADA) {
            throw new IllegalStateException("Solo se pueden modificar las citas programadas.");
        }

        asignarDatos(cita, request);
        return cita;
    }

    public synchronized Cita cambiarEstado(int id, EstadoCita nuevoEstado) {
        Cita cita = buscarPorId(id);

        if (nuevoEstado == null || nuevoEstado == EstadoCita.PROGRAMADA) {
            throw new IllegalArgumentException("El estado debe ser COMPLETADA o CANCELADA.");
        }
        if (cita.getEstado() != EstadoCita.PROGRAMADA) {
            throw new IllegalStateException("La cita ya está " + cita.getEstado().name().toLowerCase()
                    + " y no puede cambiar de estado.");
        }

        cita.setEstado(nuevoEstado);
        return cita;
    }

    public synchronized void eliminar(int id) {
        citas.remove(buscarPorId(id));
    }

    public synchronized boolean clienteTieneCitasProgramadas(int clienteId) {
        for (Cita cita : citas) {
            if (cita.getCliente().getId() == clienteId && cita.getEstado() == EstadoCita.PROGRAMADA) {
                return true;
            }
        }
        return false;
    }

    // Valida la solicitud y, solo si todo es correcto, la aplica sobre la cita.
    private void asignarDatos(Cita cita, CitaDTORequest request) {
        if (request.getFechaHora() == null) {
            throw new IllegalArgumentException("La fecha y la hora de la cita son obligatorias.");
        }
        if (request.getFechaHora().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("La cita no puede agendarse en una fecha pasada.");
        }

        // El cliente está en esta API
        Cliente cliente = clienteService.buscarPorId(request.getClienteId());

        // El servicio y el barbero están en api-catalogo
        Servicio servicio = catalogoCliente.buscarServicio(request.getServicioId());
        if (servicio == null) {
            throw new NoSuchElementException("El servicio con ID " + request.getServicioId() + " no existe en el catálogo.");
        }
        if (!servicio.isActivo()) {
            throw new IllegalStateException("El servicio " + servicio.getNombre() + " no está activo.");
        }

        Barbero barbero = catalogoCliente.buscarBarbero(request.getBarberoId());
        if (barbero == null) {
            throw new NoSuchElementException("El barbero con ID " + request.getBarberoId() + " no existe en el catálogo.");
        }
        if (!barbero.isActivo()) {
            throw new IllegalStateException("El barbero " + barbero.getNombre() + " no está activo.");
        }

        LocalDateTime inicio = request.getFechaHora();
        LocalDateTime fin = inicio.plusMinutes(servicio.getDuracionMinutos());
        validarDisponibilidad(barbero, inicio, fin, cita.getId());

        cita.setFechaHora(inicio);
        cita.setObservaciones(request.getObservaciones());
        cita.setCliente(cliente);
        cita.setServicio(servicio);
        cita.setBarbero(barbero);
    }

    // Un barbero no puede atender dos citas programadas que se crucen en el tiempo.
    // idActual es la cita que se está editando (0 al crear).
    private void validarDisponibilidad(Barbero barbero, LocalDateTime inicio, LocalDateTime fin, int idActual) {
        for (Cita otra : citas) {
            boolean mismoBarbero = otra.getBarbero().getId() == barbero.getId();
            boolean seCruzan = inicio.isBefore(otra.calcularFin()) && otra.getFechaHora().isBefore(fin);

            if (otra.getId() != idActual
                    && otra.getEstado() == EstadoCita.PROGRAMADA
                    && mismoBarbero
                    && seCruzan) {

                throw new IllegalStateException("El barbero " + barbero.getNombre()
                        + " ya tiene una cita de " + otra.getFechaHora().format(HORA)
                        + " a " + otra.calcularFin().format(HORA) + ".");
            }
        }
    }
}
