package com.carbontrack.backend;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "CarbonTest@0123";
        String hash = encoder.encode(password);

        System.out.println("NEW HASH: " + hash);
        System.out.println("MATCH: " + encoder.matches(password, hash));
    }
}