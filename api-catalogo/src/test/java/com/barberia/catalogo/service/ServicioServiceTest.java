package com.barberia.catalogo.service;

import com.barberia.catalogo.dto.ServicioDTORequest;
import com.barberia.catalogo.model.Servicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ServicioServiceTest {

    private ServicioService servicioService;

    @BeforeEach
    void preparar() {
        // El service arranca con 4 servicios de demostración (IDs 1 a 4)
        servicioService = new ServicioService();
    }

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
