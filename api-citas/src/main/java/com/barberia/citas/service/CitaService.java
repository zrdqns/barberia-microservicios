package com.barberia.citas.service;

import com.barberia.citas.cliente.CatalogoCliente;
import com.barberia.citas.dto.CitaDTORequest;
import com.barberia.citas.model.Barbero;
import com.barberia.citas.model.Cita;
import com.barberia.citas.model.Cliente;
import com.barberia.citas.model.EstadoCita;
import com.barberia.citas.model.Servicio;
import com.barberia.citas.repository.CitaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CitaService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("H:mm");
    // Ningún servicio dura más que esto (api-catalogo lo valida)
    private static final int DURACION_MAXIMA = 240;

    // Los datos viven en la tabla citas.cita de la base de datos.
    // Crear, editar y cambiar de estado son synchronized: primero se revisan las citas guardadas y
    // después se guarda. Así dos peticiones al mismo tiempo no pueden quedarse con el mismo horario,
    // porque cada save() confirma su cambio antes de que entre la siguiente.
    private final CitaRepository citaRepository;
    private final ClienteService clienteService;
    private final HorarioService horarioService;
    private final CatalogoCliente catalogoCliente;

    public synchronized Cita crear(CitaDTORequest request) {
        Cita cita = new Cita();
        asignarDatos(cita, request);

        // El estado inicial lo define la aplicación, no el cliente.
        cita.setEstado(EstadoCita.PROGRAMADA);

        return citaRepository.save(cita);
    }

    // Todos los filtros son opcionales: sin ninguno devuelve todas las citas, de la más próxima a la más lejana
    public List<Cita> listar(Integer clienteId, Integer barberoId, Integer servicioId, EstadoCita estado, LocalDate fecha) {
        return citaRepository.findAllByOrderByFechaHoraAscIdAsc().stream()
                .filter(cita -> clienteId == null || (cita.getCliente() != null && cita.getCliente().getId() == clienteId))
                .filter(cita -> barberoId == null || cita.getBarberoId() == barberoId)
                .filter(cita -> servicioId == null || cita.getServicioId() == servicioId)
                .filter(cita -> estado == null || cita.getEstado() == estado)
                .filter(cita -> fecha == null || cita.getFechaHora().toLocalDate().equals(fecha))
                .toList();
    }

    public Cita buscarPorId(int id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No se encontró una cita con el ID " + id + "."));
    }

    public synchronized Cita actualizar(int id, CitaDTORequest request) {
        Cita cita = buscarPorId(id);

        if (cita.getEstado() != EstadoCita.PROGRAMADA) {
            throw new IllegalStateException("Solo se pueden modificar las citas programadas.");
        }

        asignarDatos(cita, request);
        return citaRepository.save(cita);
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
        // Una cita se completa cuando el cliente ya fue atendido, no antes de que llegue su hora
        if (nuevoEstado == EstadoCita.COMPLETADA && cita.getFechaHora().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("La cita todavía no ha empezado. Se puede completar desde las "
                    + cita.getFechaHora().format(HORA) + " del día de la cita.");
        }

        cita.setEstado(nuevoEstado);
        return citaRepository.save(cita);
    }

    public void eliminar(int id) {
        citaRepository.delete(buscarPorId(id));
    }

    public boolean clienteTieneCitasProgramadas(int clienteId) {
        return citaRepository.existsByClienteIdAndEstado(clienteId, EstadoCita.PROGRAMADA);
    }

    // Valida la solicitud y, solo si todo es correcto, la aplica sobre la cita.
    private void asignarDatos(Cita cita, CitaDTORequest request) {
        if (request.getClienteId() <= 0) {
            throw new IllegalArgumentException("Indique el cliente de la cita.");
        }
        if (request.getServicioId() <= 0) {
            throw new IllegalArgumentException("Indique el servicio de la cita.");
        }
        if (request.getBarberoId() <= 0) {
            throw new IllegalArgumentException("Indique el barbero de la cita.");
        }
        if (request.getFechaHora() == null) {
            throw new IllegalArgumentException("La fecha y la hora de la cita son obligatorias.");
        }
        if (request.getObservaciones() != null && request.getObservaciones().length() > 500) {
            throw new IllegalArgumentException("Las observaciones no pueden pasar de 500 caracteres.");
        }
        // Las citas van en minutos exactos: los segundos que lleguen se descartan
        LocalDateTime inicio = request.getFechaHora().truncatedTo(ChronoUnit.MINUTES);
        if (inicio.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("La cita no puede agendarse en una fecha pasada.");
        }

        // El cliente está en esta API
        Cliente cliente = clienteService.buscarPorId(request.getClienteId());

        // El servicio y el barbero están en api-catalogo. Al editar, los que la cita ya tenía se
        // conservan como se agendaron (mismo precio y duración) y no se vuelven a consultar, así que
        // se puede cambiar la hora aunque después se hayan desactivado en el catálogo.
        boolean nueva = cita.getId() == 0;

        String servicioNombre = cita.getServicioNombre();
        int precio = cita.getPrecio();
        int duracion = cita.getDuracionMinutos();
        if (nueva || cita.getServicioId() != request.getServicioId()) {
            Servicio servicio = catalogoCliente.buscarServicio(request.getServicioId());
            if (servicio == null) {
                throw new NoSuchElementException("El servicio con ID " + request.getServicioId() + " no existe en el catálogo.");
            }
            if (!servicio.isActivo()) {
                throw new IllegalStateException("El servicio " + servicio.getNombre() + " no está activo.");
            }
            servicioNombre = servicio.getNombre();
            precio = servicio.getPrecio();
            duracion = servicio.getDuracionMinutos();
        }

        String barberoNombre = cita.getBarberoNombre();
        if (nueva || cita.getBarberoId() != request.getBarberoId()) {
            Barbero barbero = catalogoCliente.buscarBarbero(request.getBarberoId());
            if (barbero == null) {
                throw new NoSuchElementException("El barbero con ID " + request.getBarberoId() + " no existe en el catálogo.");
            }
            if (!barbero.isActivo()) {
                throw new IllegalStateException("El barbero " + barbero.getNombre() + " no está activo.");
            }
            barberoNombre = barbero.getNombre();
        }

        LocalDateTime fin = inicio.plusMinutes(duracion);
        horarioService.validarAtencion(inicio, fin);
        validarCruces(cita.getId(), request.getBarberoId(), barberoNombre, cliente, inicio, fin);

        cita.setFechaHora(inicio);
        cita.setObservaciones(request.getObservaciones() == null || request.getObservaciones().isBlank()
                ? null : request.getObservaciones().trim());
        cita.setCliente(cliente);
        cita.setClienteNombre(cliente.getNombre());
        cita.setServicioId(request.getServicioId());
        cita.setServicioNombre(servicioNombre);
        cita.setPrecio(precio);
        cita.setDuracionMinutos(duracion);
        cita.setBarberoId(request.getBarberoId());
        cita.setBarberoNombre(barberoNombre);
    }

    // Ni el barbero ni el cliente pueden tener dos citas programadas que se crucen en el tiempo.
    // idActual es la cita que se está editando (0 al crear).
    private void validarCruces(int idActual, int barberoId, String barberoNombre, Cliente cliente,
                               LocalDateTime inicio, LocalDateTime fin) {
        // Solo pueden cruzarse las que empiezan antes del fin y no más de una duración máxima antes del inicio
        List<Cita> cercanas = citaRepository.findByEstadoAndFechaHoraBetween(
                EstadoCita.PROGRAMADA, inicio.minusMinutes(DURACION_MAXIMA), fin);

        for (Cita otra : cercanas) {
            boolean seCruzan = inicio.isBefore(otra.calcularFin()) && otra.getFechaHora().isBefore(fin);
            if (otra.getId() == idActual || !seCruzan) {
                continue;
            }
            String tramo = otra.getFechaHora().format(HORA) + " a " + otra.calcularFin().format(HORA);

            if (otra.getBarberoId() == barberoId) {
                throw new IllegalStateException("El barbero " + barberoNombre + " ya tiene una cita de " + tramo + ".");
            }
            if (otra.getCliente() != null && otra.getCliente().getId() == cliente.getId()) {
                throw new IllegalStateException(cliente.getNombre() + " ya tiene una cita de " + tramo
                        + " con " + otra.getBarberoNombre() + ".");
            }
        }
    }
}
