package com.barberia.citas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

// Tabla citas.horario: a qué hora abre y cierra la barbería cada día de la semana.
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Horario {

    // 1 = lunes ... 7 = domingo, la misma numeración de java.time.DayOfWeek
    @Id
    private int diaSemana;
    // Las dos en null: ese día no se atiende
    private LocalTime apertura;
    private LocalTime cierre;

    public boolean abierto() {
        return apertura != null && cierre != null;
    }
}
