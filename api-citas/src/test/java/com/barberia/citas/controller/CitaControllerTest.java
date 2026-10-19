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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.ResourceAccessException;

import java.time.DayOfWeek;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Prueba los endpoints de citas sin encender api-catalogo:
// el cliente HTTP se reemplaza por un doble que responde lo que cada caso necesita.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
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

        // El próximo día en que la barbería atiende (el domingo no), a las 10:00
        LocalDate dia = LocalDate.now().plusDays(1);
        if (dia.getDayOfWeek() == DayOfWeek.SUNDAY) {
            dia = dia.plusDays(1);
        }
        cuerpo = "{\"clienteId\":1,\"servicioId\":1,\"barberoId\":1,\"fechaHora\":\"" + dia.atTime(10, 0) + "\"}";
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
    void getFiltraLasCitasPorBarberoYEstado() throws Exception {
        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(cuerpo));

        mockMvc.perform(get("/api/citas?barberoId=1&estado=PROGRAMADA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/citas?barberoId=2"))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/citas?estado=PENDIENTE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getHorarioDevuelveLosSieteDias() throws Exception {
        mockMvc.perform(get("/api/horario"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(7))
                .andExpect(jsonPath("$[0].dia").value("lunes"))
                .andExpect(jsonPath("$[0].apertura").value("09:00"))
                .andExpect(jsonPath("$[0].cierre").value("19:00"))
                .andExpect(jsonPath("$[6].abierto").value(false));
    }

    @Test
    void putHorarioAbreElDomingo() throws Exception {
        mockMvc.perform(put("/api/horario/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apertura\":\"10:00\",\"cierre\":\"14:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.abierto").value(true))
                .andExpect(jsonPath("$.apertura").value("10:00"));

        mockMvc.perform(put("/api/horario/8")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apertura\":\"10:00\",\"cierre\":\"14:00\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void postFueraDelHorarioResponde400() throws Exception {
        String temprano = cuerpo.replace("T10:00", "T07:00");

        mockMvc.perform(post("/api/citas").contentType(MediaType.APPLICATION_JSON).content(temprano))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").exists());
    }

    @Test
    void conexionResponde503SiElCatalogoNoContesta() throws Exception {
        when(catalogoCliente.verificarConexion())
                .thenThrow(new ResourceAccessException("Connection refused"));

        mockMvc.perform(get("/api/conexion/catalogo"))
                .andExpect(status().isServiceUnavailable());
    }
}
