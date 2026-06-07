package com.interviewai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.frontend-url:http://localhost:3001}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOriginPatterns(
                frontendUrl,
                "https://*.vercel.app",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002"
            )
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("Authorization", "X-Total-Count")
            .allowCredentials(true)
            .maxAge(3600);

        registry.addMapping("/oauth2/**")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "POST")
            .allowCredentials(true);
    }
}
