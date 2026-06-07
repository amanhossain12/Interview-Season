package com.interviewai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InterviewAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(InterviewAiApplication.class, args);
    }
}
