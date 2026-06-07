package com.interviewai.domain.interview.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

public class InterviewDtos {

    @Data
    public static class CreateSessionRequest {
        private String resumeId;
        private String jobDescriptionId;
        private String title;
        @NotBlank(message = "Target role is required")
        private String targetRole;
        private String experienceLevel = "MID";
        private String interviewType = "TEXT";
        private List<String> questionCategories;
        private Integer questionCount = 8;
    }

    @Data
    public static class SubmitAnswerRequest {
        @NotBlank(message = "Question ID is required")
        private String questionId;
        private String textContent;
        private String transcript;
        private Integer durationSeconds = 0;
    }
}
