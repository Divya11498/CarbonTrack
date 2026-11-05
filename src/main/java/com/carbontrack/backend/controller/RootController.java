package com.carbontrack.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping({"/", "/api/health"})
    public ResponseEntity<?> rootStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "CarbonTrack Backend REST API",
                "version", "1.0.0",
                "frontendUrl", "http://localhost:5173",
                "message", "CarbonTrack Spring Boot Backend is active and running. Visit http://localhost:5173 to use the web application.",
                "timestamp", OffsetDateTime.now().toString()
        ));
    }
}
