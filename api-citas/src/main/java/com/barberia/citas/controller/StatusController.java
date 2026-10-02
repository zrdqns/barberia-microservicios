package com.barberia.citas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatusController {

    @GetMapping("/api/status")
    public String check() {
        return "api-citas funcionando correctamente";
    }
}
