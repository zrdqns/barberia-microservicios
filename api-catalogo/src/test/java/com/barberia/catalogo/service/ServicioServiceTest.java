package com.barberia.catalogo.service;

import com.barberia.catalogo.cliente.CitasCliente;
import com.barberia.catalogo.dto.ServicioDTORequest;
import com.barberia.catalogo.model.Servicio;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

// Cada prueba arranca con una base H2 nueva que tiene los 4 servicios de demostración (IDs 1 a 4)
@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ServicioServiceTest {

    @Autowired
    private ServicioService servicioService;

    // api-citas se reemplaza por un doble: por defecto responde que no hay citas programadas
    @MockitoBean
    private CitasCliente citasCliente;

    @Test
    void crearAsignaElIdYDejaElServicioActivo() {
        Servicio creado = servicioService.crear(solicitud("Cejas", 12000, 15));

        assertEquals(5, creado.getId());
        assertTrue(creado.isActivo());
        assertEquals(5, servicioService.listar().size());
    }

    @Test
    void crearRechazaUnPrecioQueNoEsPositivo() {
        assertThrows(IllegalArgumentException.class,
                () -> servicioService.crear(solicitud("Cejas", 0, 15)));
    }

    @Test
    void crearRechazaUnNombreVacio() {
        assertThrows(IllegalArgumentException.class,
                () -> servicioService.crear(solicitud("  ", 12000, 15)));
    }

    @Test
    void crearRechazaUnNombreRepetidoSinImportarMayusculas() {
        assertThrows(IllegalStateException.class,
                () -> servicioService.crear(solicitud("CORTE CLÁSICO", 30000, 30)));
    }

    @Test
    void actualizarCambiaLosDatosYPermiteConservarElMismoNombre() {
        ServicioDTORequest request = solicitud("Corte clásico", 28000, 35);
        request.setActivo(false);

        Servicio actualizado = servicioService.actualizar(1, request);

        assertEquals(28000, actualizado.getPrecio());
        assertEquals(35, actualizado.getDuracionMinutos());
        assertFalse(actualizado.isActivo());
    }

    @Test
    void eliminarQuitaElServicioDeLaLista() {
        servicioService.eliminar(1);

        assertEquals(3, servicioService.listar().size());
        assertThrows(NoSuchElementException.class, () -> servicioService.buscarPorId(1));
    }

    @Test
    void eliminarRechazaUnServicioConCitasProgramadas() {
        when(citasCliente.contarProgramadas("servicioId", 1)).thenReturn(1);

        assertThrows(IllegalStateException.class, () -> servicioService.eliminar(1));
        assertEquals(4, servicioService.listar().size());
    }

    @Test
    void buscarUnIdQueNoExisteLanzaError() {
        assertThrows(NoSuchElementException.class, () -> servicioService.buscarPorId(99));
    }

    private ServicioDTORequest solicitud(String nombre, int precio, int duracionMinutos) {
        ServicioDTORequest request = new ServicioDTORequest();
        request.setNombre(nombre);
        request.setPrecio(precio);
        request.setDuracionMinutos(duracionMinutos);
        return request;
    }
}
