package com.interviewai.domain.coding.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewai.domain.coding.entity.CodingChallenge;
import com.interviewai.domain.coding.entity.CodingSubmission;
import com.interviewai.domain.coding.repository.CodingChallengeRepository;
import com.interviewai.domain.coding.repository.CodingSubmissionRepository;
import com.interviewai.domain.user.entity.User;
import com.interviewai.domain.user.repository.UserRepository;
import com.interviewai.infrastructure.ai.OpenAiClient;
import com.interviewai.infrastructure.judge0.Judge0Client;
import com.interviewai.shared.exception.BadRequestException;
import com.interviewai.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CodingService {

    private final CodingChallengeRepository challengeRepository;
    private final CodingSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final Judge0Client judge0Client;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    private static final Map<String, Integer> LANGUAGE_IDS = Map.of(
        "JAVA", Judge0Client.JAVA_ID,
        "PYTHON", Judge0Client.PYTHON_ID,
        "JAVASCRIPT", Judge0Client.JAVASCRIPT_ID,
        "CPP", Judge0Client.CPP_ID
    );

    @Transactional(readOnly = true)
    public Page<CodingChallenge> getChallenges(String difficulty, String category, Pageable pageable) {
        if (difficulty != null && !difficulty.isBlank()) {
            return challengeRepository.findByActiveTrueAndDifficultyOrderByCreatedAtDesc(difficulty.toUpperCase(), pageable);
        }
        if (category != null && !category.isBlank()) {
            return challengeRepository.findByActiveTrueAndCategoryOrderByCreatedAtDesc(category, pageable);
        }
        return challengeRepository.findByActiveTrueOrderByDifficultyAsc(pageable);
    }

    @Transactional(readOnly = true)
    public CodingChallenge getChallenge(UUID id) {
        return challengeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CodingChallenge", "id", id));
    }

    public CodingSubmission runCode(UUID challengeId, String code, String language, String stdin, String userEmail) {
        User user = findUser(userEmail);
        CodingChallenge challenge = getChallenge(challengeId);

        Integer languageId = LANGUAGE_IDS.get(language.toUpperCase());
        if (languageId == null) throw new BadRequestException("Unsupported language: " + language);

        Judge0Client.Judge0Result result = judge0Client.submitAndWait(code, languageId, stdin);

        CodingSubmission submission = CodingSubmission.builder()
            .user(user)
            .challenge(challenge)
            .code(code)
            .language(language.toUpperCase())
            .languageId(languageId)
            .status("RUN")
            .runtimeMs((int)(result.executionTimeSeconds() * 1000))
            .memoryKb(result.memoryKb())
            .judge0Token(result.token())
            .build();

        return submissionRepository.save(submission);
    }

    public CodingSubmission submitCode(UUID challengeId, String code, String language, String userEmail) {
        User user = findUser(userEmail);
        CodingChallenge challenge = getChallenge(challengeId);

        Integer languageId = LANGUAGE_IDS.get(language.toUpperCase());
        if (languageId == null) throw new BadRequestException("Unsupported language: " + language);

        List<Map<String, Object>> testResults = new ArrayList<>();
        int passedTests = 0;

        try {
            JsonNode testCasesNode = objectMapper.readTree(challenge.getTestCases());
            int totalTests = testCasesNode.size();

            for (int i = 0; i < testCasesNode.size(); i++) {
                JsonNode tc = testCasesNode.get(i);
                String stdin = tc.path("input").asText();
                String expectedOutput = tc.path("expected_output").asText().trim();

                Judge0Client.Judge0Result result = judge0Client.submitAndWait(code, languageId, stdin);
                String actualOutput = result.stdout().trim();
                boolean passed = actualOutput.equals(expectedOutput) && result.isAccepted();

                if (passed) passedTests++;

                testResults.add(Map.of(
                    "passed", passed,
                    "input", tc.path("is_hidden").asBoolean() ? "[hidden]" : stdin,
                    "expected", tc.path("is_hidden").asBoolean() ? "[hidden]" : expectedOutput,
                    "actual", actualOutput,
                    "runtime_ms", (int)(result.executionTimeSeconds() * 1000)
                ));
            }

            // Get AI review
            String aiReview = getAiCodeReview(code, language, challenge.getTitle());
            String complexityAnalysis = getComplexityAnalysis(code, language);

            String status = passedTests == totalTests ? "ACCEPTED" : "WRONG_ANSWER";

            CodingSubmission submission = CodingSubmission.builder()
                .user(user)
                .challenge(challenge)
                .code(code)
                .language(language.toUpperCase())
                .languageId(languageId)
                .status(status)
                .passedTests(passedTests)
                .totalTests(totalTests)
                .testResults(objectMapper.writeValueAsString(testResults))
                .aiReview(aiReview)
                .complexityAnalysis(complexityAnalysis)
                .build();

            return submissionRepository.save(submission);
        } catch (Exception e) {
            log.error("Code submission failed: {}", e.getMessage());
            throw new RuntimeException("Code execution failed: " + e.getMessage());
        }
    }

    private String getAiCodeReview(String code, String language, String problemTitle) {
        String prompt = """
            Review this %s code for the problem "%s". Provide:
            1. Code quality assessment
            2. Potential bugs or edge cases missed
            3. Style improvements
            4. Overall assessment
            Keep it concise (3-5 sentences).
            """.formatted(language, problemTitle);

        try {
            return openAiClient.chat(prompt, code);
        } catch (Exception e) {
            return "AI review temporarily unavailable.";
        }
    }

    private String getComplexityAnalysis(String code, String language) {
        String prompt = """
            Analyze this %s code and return JSON:
            {"time": "O(?)", "space": "O(?)", "explanation": "brief explanation"}
            """.formatted(language);

        try {
            return openAiClient.chatJson(prompt, code);
        } catch (Exception e) {
            return "{\"time\": \"Unknown\", \"space\": \"Unknown\", \"explanation\": \"Analysis unavailable\"}";
        }
    }

    @Transactional(readOnly = true)
    public Page<CodingSubmission> getUserSubmissions(String userEmail, Pageable pageable) {
        User user = findUser(userEmail);
        return submissionRepository.findByUserOrderBySubmittedAtDesc(user, pageable);
    }

    private User findUser(String email) {
        return userRepository.findByEmailAndDeletedAtIsNull(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
