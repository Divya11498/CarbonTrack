
package com.carbontrack.backend.controller;

import com.carbontrack.backend.entity.User;
import com.carbontrack.backend.repository.UserRepository;
import com.carbontrack.backend.service.BenchmarkingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/benchmarking")
public class BenchmarkingController {

    private final BenchmarkingService benchmarkingService;
    private final UserRepository userRepository;

    public BenchmarkingController(
            BenchmarkingService benchmarkingService,
            UserRepository userRepository) {
        this.benchmarkingService = benchmarkingService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getBenchmarks(
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        Map<String, Object> result =
                benchmarkingService.getBenchmarks(user.getId());

        return ResponseEntity.ok(result);
    }
}
