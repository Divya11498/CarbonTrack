
package com.carbontrack.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class CarbontrackBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(
				CarbontrackBackendApplication.class, args);
	}
}
