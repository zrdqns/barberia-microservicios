package com.barberia.citas.service;

import com.barberia.citas.dto.HorarioDTORequest;
import com.barberia.citas.model.Cita;
import com.barberia.citas.model.EstadoCita;
import com.barberia.citas.model.Horario;
import com.barberia.citas.repository.CitaRepository;
import com.barberia.citas.repository.HorarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class HorarioService {

    // Índice 1 = lunes ... 7 = domingo
    public static final String[] DIAS = {"", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"};
    private static final String[] LOS_DIAS = {"", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"};
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("H:mm");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("d/MM 'a las' H:mm");

    private final HorarioRepository horarioRepository;
    private final CitaRepository citaRepository;

    public List<Horario> listar() {
        return horarioRepository.findAllByOrderByDiaSemanaAsc();
    }

    public Horario buscar(int diaSemana) {
        return horarioRepository.findById(diaSemana)
                .orElseThrow(() -> new NoSuchElementException("El día de la semana va de 1 (lunes) a 7 (domingo)."));
    }

    // Cambia el horario de un día. Apertura y cierre en null: ese día no se atiende.
    public synchronized Horario actualizar(int diaSemana, HorarioDTORequest request) {
        Horario horario = buscar(diaSemana);
        LocalTime apertura = request.getApertura();
        LocalTime cierre = request.getCierre();

        if ((apertura == null) != (cierre == null)) {
            throw new IllegalArgumentException("Indique la apertura y el cierre, o deje los dos vacíos para no atender ese día.");
        }
        if (apertura != null && !apertura.isBefore(cierre)) {
            throw new IllegalArgumentException("La apertura debe ser antes del cierre.");
        }

        // Las citas programadas de ese día de la semana tienen que seguir cabiendo en el horario
        Horario nuevo = new Horario(diaSemana, apertura, cierre);
        List<Cita> porFuera = citaRepository.findByEstadoAndFechaHoraAfter(EstadoCita.PROGRAMADA, LocalDateTime.now()).stream()
                .filter(cita -> cita.getFechaHora().getDayOfWeek().getValue() == diaSemana)
                .filter(cita -> !cabe(nuevo, cita.getFechaHora(), cita.calcularFin()))
                .sorted((a, b) -> a.getFechaHora().compareTo(b.getFechaHora()))
                .toList();
        if (!porFuera.isEmpty()) {
            throw new IllegalStateException("Con ese horario quedarían por fuera " + porFuera.size()
                    + (porFuera.size() == 1 ? " cita programada" : " citas programadas")
                    + ", la primera el " + porFuera.get(0).getFechaHora().format(FECHA)
                    + ". Muévalas o cancélelas antes de cambiar el horario.");
        }

        horario.setApertura(apertura);
        horario.setCierre(cierre);
        return horarioRepository.save(horario);
    }

    // Una cita debe empezar y terminar dentro del horario de su día
    public void validarAtencion(LocalDateTime inicio, LocalDateTime fin) {
        int dia = inicio.getDayOfWeek().getValue();
        Horario horario = horarioRepository.findById(dia).orElse(null);

        if (horario == null || !horario.abierto()) {
            throw new IllegalArgumentException("La barbería no atiende los " + LOS_DIAS[dia] + ".");
        }
        if (!cabe(horario, inicio, fin)) {
            long minutos = Duration.between(inicio, fin).toMinutes();
            throw new IllegalArgumentException("Los " + LOS_DIAS[dia] + " la barbería atiende de "
                    + horario.getApertura().format(HORA) + " a " + horario.getCierre().format(HORA)
                    + ". Una cita de " + minutos + " minutos debe empezar entre las "
                    + horario.getApertura().format(HORA) + " y las "
                    + horario.getCierre().minusMinutes(minutos).format(HORA) + ".");
        }
    }

    private boolean cabe(Horario horario, LocalDateTime inicio, LocalDateTime fin) {
        return horario.abierto()
                && fin.toLocalDate().equals(inicio.toLocalDate())
                && !inicio.toLocalTime().isBefore(horario.getApertura())
                && !fin.toLocalTime().isAfter(horario.getCierre());
    }
}
