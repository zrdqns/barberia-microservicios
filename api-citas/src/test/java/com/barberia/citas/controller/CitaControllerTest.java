package com.barberia.citas.controller;

import com.barberia.citas.cliente.CatalogoCliente;
import com.barberia.citas.model.Barbero;
import com.barberia.citas.model.Servicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.ResourceAccessException;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Prueba los endpoints de citas sin encender api-catalogo:
// el cliente HTTP se reemplaza por un doble que responde lo que cada caso necesita.
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class CitaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CatalogoCliente catalogoCliente;

    private String cuerpo;

    @BeforeEach
    void preparar() {
        when(catalogoCliente.buscarServicio(1)).thenReturn(new Servicio(1, "Corte clásico", 25000, 30, true));
        when(catalogoCliente.buscarBarbero(1)).thenReturn(new Barbero(1, "Andrés Rojas", "Cortes clásicos", true));

        LocalDateTime manana = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
        cuerpo = "{\"clienteId\":1,\"servicioId\":1,\"barberoId\":1,\"fechaHora\":\"" + manana + "\"}";
    }

    @Test
    void postAgendaLaCitaConLosDatosDeAmbosMicroservicios() throws Exception {
        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.estado").value("PROGRAMADA"))
                .andExpect(jsonPath("$.clienteNombre").value("Carlos Ramírez"))
                .andExpect(jsonPath("$.servicioNombre").value("Corte clásico"))
                .andExpect(jsonPath("$.barberoNombre").value("Andrés Rojas"));
    }

    @Test
    void postResponde503SiElCatalogoEstaApagado() throws Exception {
        when(catalogoCliente.buscarServicio(anyInt()))
                .thenThrow(new ResourceAccessException("Connection refused"));

        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.mensaje").exists());
    }

    @Test
    void postResponde404SiElServicioNoExisteEnElCatalogo() throws Exception {
        String conServicioDesconocido = cuerpo.replace("\"servicioId\":1", "\"servicioId\":99");

        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(conServicioDesconocido))
                .andExpect(status().isNotFound());
    }

    @Test
    void postResponde409SiElBarberoYaEstaOcupado() throws Exception {
        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isConflict());
    }

    @Test
    void patchCambiaSoloElEstado() throws Exception {
        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo));

        mockMvc.perform(patch("/api/citas/1/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"CANCELADA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADA"));
    }

    @Test
    void noSePuedeEliminarUnClienteConCitasProgramadas() throws Exception {
        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo));

        mockMvc.perform(delete("/api/clientes/1"))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteEliminaLaCita() throws Exception {
        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo));

        mockMvc.perform(delete("/api/citas/1"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/citas/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void conexionResponde503SiElCatalogoNoContesta() throws Exception {
        when(catalogoCliente.verificarConexion())
                .thenThrow(new ResourceAccessException("Connection refused"));

        mockMvc.perform(get("/api/conexion/catalogo"))
                .andExpect(status().isServiceUnavailable());
    }
}
