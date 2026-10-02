package com.barberia.citas.service;

import com.barberia.citas.cliente.CatalogoCliente;
import com.barberia.citas.dto.CitaDTORequest;
import com.barberia.citas.model.Barbero;
import com.barberia.citas.model.Cita;
import com.barberia.citas.model.EstadoCita;
import com.barberia.citas.model.Servicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CitaServiceTest {

    private static final LocalDateTime MANANA_10AM =
            LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);

    private CatalogoCliente catalogoCliente;
    private CitaService citaService;

    @BeforeEach
    void preparar() {
        // api-catalogo se reemplaza por un doble: aquí se prueba solo la lógica de citas
        catalogoCliente = mock(CatalogoCliente.class);
        when(catalogoCliente.buscarServicio(1)).thenReturn(new Servicio(1, "Corte clásico", 25000, 30, true));
        when(catalogoCliente.buscarServicio(4)).thenReturn(new Servicio(4, "Tinte", 60000, 90, false));
        when(catalogoCliente.buscarBarbero(1)).thenReturn(new Barbero(1, "Andrés Rojas", "Cortes clásicos", true));
        when(catalogoCliente.buscarBarbero(2)).thenReturn(new Barbero(2, "Julián Mora", "Barba", true));
        when(catalogoCliente.buscarBarbero(3)).thenReturn(new Barbero(3, "Felipe Cárdenas", "Degradados", false));

        // ClienteService arranca con 3 clientes de demostración (IDs 1 a 3)
        citaService = new CitaService(new ClienteService(), catalogoCliente);
    }

    @Test
    void crearDejaLaCitaProgramadaConLosDatosDelCatalogo() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, MANANA_10AM));

        assertEquals(1, cita.getId());
        assertEquals(EstadoCita.PROGRAMADA, cita.getEstado());
        assertEquals("Corte clásico", cita.getServicio().getNombre());
        assertEquals("Andrés Rojas", cita.getBarbero().getNombre());
        assertEquals("Carlos Ramírez", cita.getCliente().getNombre());
    }

    @Test
    void crearRechazaUnaFechaPasada() {
        assertThrows(IllegalArgumentException.class,
                () -> citaService.crear(solicitud(1, 1, 1, LocalDateTime.now().minusHours(1))));
    }

    @Test
    void crearRechazaUnClienteQueNoExiste() {
        assertThrows(NoSuchElementException.class,
                () -> citaService.crear(solicitud(99, 1, 1, MANANA_10AM)));
    }

    @Test
    void crearRechazaUnServicioQueNoEstaEnElCatalogo() {
        // El doble devuelve null para un ID desconocido, igual que el cliente real ante un 404
        assertThrows(NoSuchElementException.class,
                () -> citaService.crear(solicitud(1, 99, 1, MANANA_10AM)));
    }

    @Test
    void crearRechazaUnServicioOUnBarberoInactivo() {
        assertThrows(IllegalStateException.class,
                () -> citaService.crear(solicitud(1, 4, 1, MANANA_10AM)));
        assertThrows(IllegalStateException.class,
                () -> citaService.crear(solicitud(1, 1, 3, MANANA_10AM)));
    }

    @Test
    void unBarberoNoPuedeTenerDosCitasQueSeCrucen() {
        citaService.crear(solicitud(1, 1, 1, MANANA_10AM));

        // 10:15 cae dentro de la cita de 10:00 a 10:30
        assertThrows(IllegalStateException.class,
                () -> citaService.crear(solicitud(2, 1, 1, MANANA_10AM.plusMinutes(15))));

        // Justo al terminar (10:30) y con otro barbero a la misma hora sí se puede
        assertDoesNotThrow(() -> citaService.crear(solicitud(2, 1, 1, MANANA_10AM.plusMinutes(30))));
        assertDoesNotThrow(() -> citaService.crear(solicitud(3, 1, 2, MANANA_10AM)));
    }

    @Test
    void cancelarUnaCitaLiberaElHorarioDelBarbero() {
        Cita primera = citaService.crear(solicitud(1, 1, 1, MANANA_10AM));
        citaService.cambiarEstado(primera.getId(), EstadoCita.CANCELADA);

        assertDoesNotThrow(() -> citaService.crear(solicitud(2, 1, 1, MANANA_10AM)));
    }

    @Test
    void reprogramarUnaCitaNoChocaConsigoMisma() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, MANANA_10AM));

        Cita actualizada = citaService.actualizar(cita.getId(), solicitud(1, 1, 1, MANANA_10AM.plusMinutes(10)));

        assertEquals(MANANA_10AM.plusMinutes(10), actualizada.getFechaHora());
    }

    @Test
    void unaCitaCerradaNoSePuedeModificarNiCambiarDeEstado() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, MANANA_10AM));
        citaService.cambiarEstado(cita.getId(), EstadoCita.COMPLETADA);

        assertThrows(IllegalStateException.class,
                () -> citaService.cambiarEstado(cita.getId(), EstadoCita.CANCELADA));
        assertThrows(IllegalStateException.class,
                () -> citaService.actualizar(cita.getId(), solicitud(1, 1, 1, MANANA_10AM.plusHours(2))));
    }

    @Test
    void cambiarEstadoSoloAceptaCompletadaOCancelada() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, MANANA_10AM));

        assertThrows(IllegalArgumentException.class,
                () -> citaService.cambiarEstado(cita.getId(), EstadoCita.PROGRAMADA));
        assertThrows(IllegalArgumentException.class,
                () -> citaService.cambiarEstado(cita.getId(), null));
    }

    @Test
    void sabeSiUnClienteTieneCitasProgramadas() {
        assertFalse(citaService.clienteTieneCitasProgramadas(1));

        Cita cita = citaService.crear(solicitud(1, 1, 1, MANANA_10AM));
        assertTrue(citaService.clienteTieneCitasProgramadas(1));

        citaService.cambiarEstado(cita.getId(), EstadoCita.COMPLETADA);
        assertFalse(citaService.clienteTieneCitasProgramadas(1));
    }

    @Test
    void eliminarQuitaLaCita() {
        Cita cita = citaService.crear(solicitud(1, 1, 1, MANANA_10AM));

        citaService.eliminar(cita.getId());

        assertTrue(citaService.listar().isEmpty());
        assertThrows(NoSuchElementException.class, () -> citaService.buscarPorId(cita.getId()));
    }

    private CitaDTORequest solicitud(int clienteId, int servicioId, int barberoId, LocalDateTime fechaHora) {
        CitaDTORequest request = new CitaDTORequest();
        request.setClienteId(clienteId);
        request.setServicioId(servicioId);
        request.setBarberoId(barberoId);
        request.setFechaHora(fechaHora);
        return request;
    }
}
