package com.barberia.catalogo.controller;

import com.barberia.catalogo.cliente.CitasCliente;
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

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.xpath;

// Cada prueba arranca con una base de datos nueva que solo tiene los datos de demostración.
// api-citas se reemplaza por un doble: por defecto responde que no hay citas programadas.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ServicioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CitasCliente citasCliente;

    @Test
    void postCreaElServicioYResponde201() throws Exception {
        mockMvc.perform(post("/api/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cejas\",\"precio\":12000,\"duracionMinutos\":15}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.activo").value(true));
    }

    @Test
    void postConDatosInvalidosResponde400ConMensaje() throws Exception {
        mockMvc.perform(post("/api/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Cejas\",\"precio\":0,\"duracionMinutos\":15}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El precio debe ser mayor que cero."));
    }

    @Test
    void postConNombreRepetidoResponde409() throws Exception {
        mockMvc.perform(post("/api/servicios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Tinte\",\"precio\":50000,\"duracionMinutos\":60}"))
                .andExpect(status().isConflict());
    }

    @Test
    void getDevuelveJsonPorDefecto() throws Exception {
        mockMvc.perform(get("/api/servicios"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(4));
    }

    @Test
    void getDevuelveXmlCuandoElClienteLoPideConAccept() throws Exception {
        mockMvc.perform(get("/api/servicios/1").accept(MediaType.APPLICATION_XML))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML))
                .andExpect(xpath("/ServicioDTOResponse/id").string("1"));
    }

    @Test
    void getDeUnIdQueNoExisteResponde404() throws Exception {
        mockMvc.perform(get("/api/servicios/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").exists());
    }

    @Test
    void putActualizaElServicio() throws Exception {
        mockMvc.perform(put("/api/servicios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Corte clásico\",\"precio\":28000,\"duracionMinutos\":35,\"activo\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precio").value(28000))
                .andExpect(jsonPath("$.activo").value(false));
    }

    @Test
    void deleteEliminaElServicio() throws Exception {
        mockMvc.perform(delete("/api/servicios/1"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/servicios/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteResponde409SiElServicioTieneCitasProgramadas() throws Exception {
        when(citasCliente.contarProgramadas("servicioId", 1)).thenReturn(2);

        mockMvc.perform(delete("/api/servicios/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value(containsString("2 citas programadas")));
        mockMvc.perform(get("/api/servicios/1"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteResponde503SiApiCitasNoContesta() throws Exception {
        when(citasCliente.contarProgramadas("servicioId", 1))
                .thenThrow(new ResourceAccessException("Connection refused"));

        mockMvc.perform(delete("/api/servicios/1"))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void barberoConTelefonoInvalidoResponde400() throws Exception {
        mockMvc.perform(post("/api/barberos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Sebastián Gil\",\"documento\":\"1045678901\",\"telefono\":\"12\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El teléfono debe tener entre 7 y 10 dígitos."));
    }

    @Test
    void corsSoloAceptaElOrigenDelFrontend() throws Exception {
        mockMvc.perform(options("/api/servicios")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));

        mockMvc.perform(options("/api/servicios")
                        .header("Origin", "http://sitio-ajeno.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }
}
