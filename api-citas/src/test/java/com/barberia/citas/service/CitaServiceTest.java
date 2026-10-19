package com.barberia.citas.service;

import com.barberia.citas.cliente.CatalogoCliente;
import com.barberia.citas.dto.CitaDTORequest;
import com.barberia.citas.dto.HorarioDTORequest;
import com.barberia.citas.model.Barbero;
import com.barberia.citas.model.Cita;
import com.barberia.citas.model.EstadoCita;
import com.barberia.citas.model.Servicio;
import com.barberia.citas.repository.CitaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

// Cada prueba arranca con una base H2 nueva: 3 clientes de demostración (IDs 1 a 3), ninguna cita
// y el horario de lunes a sábado de 9:00 a 19:00.
@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class CitaServiceTest {

    // El próximo día en que la barbería atiende, a las 10:00
    private static final LocalDateTime DIA_HABIL_10AM = proximoDiaHabil().atTime(10, 0);

    @Autowired
    private CitaService citaService;

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private HorarioService horarioService;

    @Autowired
    private CitaRepository citaRepository;

    // api-catalogo se reemplaza por un doble: aquí se prueba solo la lógica de citas
    @MockitoBean
    private CatalogoCliente catalogoCliente;

    @BeforeEach
    void preparar() {
        when(catalogoCliente.buscarServicio(1)).thenReturn(new Servicio(1, "Corte clásico", 25000, 30, true));
        when(catalogoCliente.buscarServicio(4)).thenReturn(new Servicio(4, "Tinte", 60000, 90, false));
        when(catalogoCliente.buscarBarbero(1)).thenReturn(new Barbero(1, "Andrés Rojas", "Cortes clásicos", true));
        when(catalogoCliente.buscarBarbero(2)).thenReturn(new Barbero(2, "Julián Mora", "Barba", true));
        when(catalogoCliente.buscarBarbero(3)).thenReturn(new Barbero(3, "Felipe Cárdenas", "Degradados", false));
    }

    @Test
    void crearDejaLaCitaProgramadaConLosDatosDelCatalogo() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        assertEquals(1, cita.getId());
        assertEquals(EstadoCita.PROGRAMADA, cita.getEstado());
        assertEquals("Corte clásico", cita.getServicioNombre());
        assertEquals(25000, cita.getPrecio());
        assertEquals("Andrés Rojas", cita.getBarberoNombre());
        assertEquals("Carlos Ramírez", cita.nombreCliente());
        // Quedó guardada en la base de datos
        assertEquals(1, citaRepository.count());
    }

    @Test
    void crearRechazaUnaFechaPasada() {
        assertThrows(IllegalArgumentException.class,
                () -> citaService.crear(solicitud(1, 1, 1, LocalDateTime.now().minusHours(1))));
    }

    @Test
    void crearRechazaUnClienteQueNoExiste() {
        assertThrows(NoSuchElementException.class,
                () -> citaService.crear(solicitud(99, 1, 1, DIA_HABIL_10AM)));
    }

    @Test
    void crearRechazaUnServicioQueNoEstaEnElCatalogo() {
        // El doble devuelve null para un ID desconocido, igual que el cliente real ante un 404
        assertThrows(NoSuchElementException.class,
                () -> citaService.crear(solicitud(1, 99, 1, DIA_HABIL_10AM)));
    }

    @Test
    void crearRechazaUnServicioOUnBarberoInactivo() {
        assertThrows(IllegalStateException.class,
                () -> citaService.crear(solicitud(1, 4, 1, DIA_HABIL_10AM)));
        assertThrows(IllegalStateException.class,
                () -> citaService.crear(solicitud(1, 1, 3, DIA_HABIL_10AM)));
    }

    @Test
    void crearRechazaUnaCitaFueraDelHorario() {
        // Antes de abrir, terminando después del cierre (18:45 + 30 min) y el domingo
        assertThrows(IllegalArgumentException.class,
                () -> citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM.with(LocalTime.of(8, 30)))));
        assertThrows(IllegalArgumentException.class,
                () -> citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM.with(LocalTime.of(18, 45)))));
        LocalDateTime domingo = LocalDate.now().plusDays(7).with(DayOfWeek.SUNDAY).atTime(10, 0);
        assertThrows(IllegalArgumentException.class, () -> citaService.crear(solicitud(1, 1, 1, domingo)));

        // La última que cabe termina justo al cierre
        assertDoesNotThrow(() -> citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM.with(LocalTime.of(18, 30)))));
    }

    @Test
    void unBarberoNoPuedeTenerDosCitasQueSeCrucen() {
        citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        // 10:15 cae dentro de la cita de 10:00 a 10:30
        assertThrows(IllegalStateException.class,
                () -> citaService.crear(solicitud(2, 1, 1, DIA_HABIL_10AM.plusMinutes(15))));

        // Justo al terminar (10:30) y con otro barbero a la misma hora sí se puede
        assertDoesNotThrow(() -> citaService.crear(solicitud(2, 1, 1, DIA_HABIL_10AM.plusMinutes(30))));
        assertDoesNotThrow(() -> citaService.crear(solicitud(3, 1, 2, DIA_HABIL_10AM)));
    }

    @Test
    void unClienteNoPuedeTenerDosCitasQueSeCrucen() {
        citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        // El mismo cliente con otro barbero a la misma hora
        assertThrows(IllegalStateException.class,
                () -> citaService.crear(solicitud(1, 1, 2, DIA_HABIL_10AM.plusMinutes(10))));
    }

    @Test
    void cancelarUnaCitaLiberaElHorarioDelBarbero() {
        Cita primera = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));
        citaService.cambiarEstado(primera.getId(), EstadoCita.CANCELADA);

        assertDoesNotThrow(() -> citaService.crear(solicitud(2, 1, 1, DIA_HABIL_10AM)));
    }

    @Test
    void reprogramarUnaCitaNoChocaConsigoMisma() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        Cita actualizada = citaService.actualizar(cita.getId(), solicitud(1, 1, 1, DIA_HABIL_10AM.plusMinutes(10)));

        assertEquals(DIA_HABIL_10AM.plusMinutes(10), actualizada.getFechaHora());
    }

    @Test
    void editarConservaElPrecioYElServicioConQueSeAgendo() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        // Después el catálogo sube el precio y desactiva el servicio
        when(catalogoCliente.buscarServicio(1)).thenReturn(new Servicio(1, "Corte clásico", 30000, 30, false));

        Cita movida = citaService.actualizar(cita.getId(), solicitud(1, 1, 1, DIA_HABIL_10AM.plusHours(2)));

        assertEquals(25000, movida.getPrecio());
        assertEquals(DIA_HABIL_10AM.plusHours(2), movida.getFechaHora());
    }

    @Test
    void unaCitaNoSeCompletaAntesDeEmpezar() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        assertThrows(IllegalStateException.class,
                () -> citaService.cambiarEstado(cita.getId(), EstadoCita.COMPLETADA));
    }

    @Test
    void unaCitaQueYaPasoSePuedeCompletar() {
        Cita pasada = citaPasada();

        assertEquals(EstadoCita.COMPLETADA, citaService.cambiarEstado(pasada.getId(), EstadoCita.COMPLETADA).getEstado());
    }

    @Test
    void unaCitaCerradaNoSePuedeModificarNiCambiarDeEstado() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));
        citaService.cambiarEstado(cita.getId(), EstadoCita.CANCELADA);

        assertThrows(IllegalStateException.class,
                () -> citaService.cambiarEstado(cita.getId(), EstadoCita.COMPLETADA));
        assertThrows(IllegalStateException.class,
                () -> citaService.actualizar(cita.getId(), solicitud(1, 1, 1, DIA_HABIL_10AM.plusHours(2))));
    }

    @Test
    void cambiarEstadoSoloAceptaCompletadaOCancelada() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        assertThrows(IllegalArgumentException.class,
                () -> citaService.cambiarEstado(cita.getId(), EstadoCita.PROGRAMADA));
        assertThrows(IllegalArgumentException.class,
                () -> citaService.cambiarEstado(cita.getId(), null));
    }

    @Test
    void sabeSiUnClienteTieneCitasProgramadas() {
        assertFalse(citaService.clienteTieneCitasProgramadas(1));

        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));
        assertTrue(citaService.clienteTieneCitasProgramadas(1));

        citaService.cambiarEstado(cita.getId(), EstadoCita.CANCELADA);
        assertFalse(citaService.clienteTieneCitasProgramadas(1));
    }

    @Test
    void alEliminarUnClienteSusCitasConservanElNombre() {
        Cita cita = citaPasada();
        citaService.cambiarEstado(cita.getId(), EstadoCita.COMPLETADA);

        clienteService.eliminar(1);

        Cita guardada = citaService.buscarPorId(cita.getId());
        assertNull(guardada.getCliente());
        assertEquals("Carlos Ramírez", guardada.nombreCliente());
    }

    @Test
    void listarFiltraPorBarberoYEstado() {
        citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));
        Cita otra = citaService.crear(solicitud(2, 1, 2, DIA_HABIL_10AM));
        citaService.cambiarEstado(otra.getId(), EstadoCita.CANCELADA);

        assertEquals(1, citaService.listar(null, 1, null, EstadoCita.PROGRAMADA, null).size());
        assertEquals(0, citaService.listar(null, 2, null, EstadoCita.PROGRAMADA, null).size());
        assertEquals(2, citaService.listar(null, null, null, null, DIA_HABIL_10AM.toLocalDate()).size());
    }

    @Test
    void elHorarioNoSeCierraSiDejaCitasPorFuera() {
        citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));
        int dia = DIA_HABIL_10AM.getDayOfWeek().getValue();

        // Cerrar ese día o abrir más tarde dejaría la cita por fuera
        assertThrows(IllegalStateException.class, () -> horarioService.actualizar(dia, horario(null, null)));
        assertThrows(IllegalStateException.class, () -> horarioService.actualizar(dia, horario("11:00", "19:00")));
        // Abrir más temprano no la afecta
        assertDoesNotThrow(() -> horarioService.actualizar(dia, horario("08:00", "19:00")));
        // La apertura debe ser antes del cierre
        assertThrows(IllegalArgumentException.class, () -> horarioService.actualizar(dia, horario("19:00", "09:00")));
    }

    @Test
    void eliminarQuitaLaCita() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, DIA_HABIL_10AM));

        citaService.eliminar(cita.getId());

        assertTrue(citaService.listar(null, null, null, null, null).isEmpty());
        assertThrows(NoSuchElementException.class, () -> citaService.buscarPorId(cita.getId()));
    }

    // Una cita de ayer, guardada directo en la base porque la API no deja agendar en el pasado
    private Cita citaPasada() {
        Cita cita = new Cita();
        cita.setFechaHora(LocalDateTime.now().minusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0));
        cita.setEstado(EstadoCita.PROGRAMADA);
        cita.setCliente(clienteService.buscarPorId(1));
        cita.setClienteNombre("Carlos Ramírez");
        cita.setServicioId(1);
        cita.setServicioNombre("Corte clásico");
        cita.setPrecio(25000);
        cita.setDuracionMinutos(30);
        cita.setBarberoId(1);
        cita.setBarberoNombre("Andrés Rojas");
        return citaRepository.save(cita);
    }

    private static LocalDate proximoDiaHabil() {
        LocalDate dia = LocalDate.now().plusDays(1);
        return dia.getDayOfWeek() == DayOfWeek.SUNDAY ? dia.plusDays(1) : dia;
    }

    private CitaDTORequest solicitud(int clienteId, int servicioId, int barberoId, LocalDateTime fechaHora) {
        CitaDTORequest request = new CitaDTORequest();
        request.setClienteId(clienteId);
        request.setServicioId(servicioId);
        request.setBarberoId(barberoId);
        request.setFechaHora(fechaHora);
        return request;
    }

    private HorarioDTORequest horario(String apertura, String cierre) {
        HorarioDTORequest request = new HorarioDTORequest();
        request.setApertura(apertura == null ? null : LocalTime.parse(apertura));
        request.setCierre(cierre == null ? null : LocalTime.parse(cierre));
        return request;
    }
}
