package com.carbontrack.backend.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class AuthAndSecurityIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    void publicOpenApiDocsAccessibleAndProtectedEndpointsRequireJwt() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi", startsWith("3.")));

        mockMvc.perform(get("/api/analytics/summary"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void registerUserAuthenticateAndEnforceAdminRoleOnEmissionFactorMutations() throws Exception {
        String email = "inttest-" + UUID.randomUUID() + "@carbontrack.test";
        String registerBody = """
                {
                  "name": "Integration Tester",
                  "email": "%s",
                  "password": "Password123!"
                }
                """.formatted(email);

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.token", not(emptyString())))
                .andReturn();

        JsonNode json = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String jwt = json.get("token").asText();

        // Authenticated endpoints respond cleanly for newly registered USER
        mockMvc.perform(get("/api/analytics/summary")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sustainabilityScore").exists());

        mockMvc.perform(get("/api/badges/mine")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/emission-factors")
                        .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));

        // Non-admin USER must receive 403 when mutating emission factors
        String createFactorBody = """
                {
                  "activityTypeId": 1,
                  "factorValue": 0.25,
                  "unit": "km",
                  "sourceName": "Test",
                  "region": "GLOBAL"
                }
                """;
        mockMvc.perform(post("/api/emission-factors")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createFactorBody))
                .andExpect(status().isForbidden());
    }
}
