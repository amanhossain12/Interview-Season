package com.interviewai.domain.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewai.domain.interview.dto.InterviewDtos.*;
import com.interviewai.domain.interview.entity.*;
import com.interviewai.domain.interview.repository.*;
import com.interviewai.domain.resume.entity.Resume;
import com.interviewai.domain.resume.repository.ResumeRepository;
import com.interviewai.domain.user.entity.User;
import com.interviewai.domain.user.repository.UserRepository;
import com.interviewai.infrastructure.ai.OpenAiClient;
import com.interviewai.shared.exception.BadRequestException;
import com.interviewai.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    public InterviewSession createSession(CreateSessionRequest request, String userEmail) {
        User user = findUser(userEmail);

        Resume resume = null;
        if (request.getResumeId() != null && !request.getResumeId().trim().isEmpty() && !"null".equalsIgnoreCase(request.getResumeId().trim())) {
            resume = resumeRepository.findById(UUID.fromString(request.getResumeId().trim()))
                .orElse(null);
        }


        InterviewSession session = InterviewSession.builder()
            .user(user)
            .resume(resume)
            .title(request.getTitle() != null ? request.getTitle() :
                "Interview - " + OffsetDateTime.now().toLocalDate())
            .targetRole(request.getTargetRole())
            .experienceLevel(request.getExperienceLevel())
            .interviewType(request.getInterviewType() != null ? request.getInterviewType() : "TEXT")
            .status("CREATED")
            .build();

        session = sessionRepository.save(session);

        // Generate initial questions
        List<Question> questions = generateQuestions(session, request);
        questionRepository.saveAll(questions);

        session.setTotalQuestions(questions.size());
        session.setStatus("IN_PROGRESS");
        session.setStartedAt(OffsetDateTime.now());
        return sessionRepository.save(session);
    }

    private List<Question> generateQuestions(InterviewSession session, CreateSessionRequest request) {
        String resumeContext = "";
        if (session.getResume() != null && session.getResume().getRawText() != null) {
            resumeContext = "\n\nResume:\n" + session.getResume().getRawText().substring(0,
                Math.min(2000, session.getResume().getRawText().length()));
        }

        String systemPrompt = """
            You are an expert technical interviewer. Generate 8 interview questions as a JSON array.
            The questions should cover different categories: HR, TECHNICAL, BEHAVIORAL, PROJECT, SYSTEM_DESIGN.
            Return format:
            {
              "questions": [
                {
                  "category": "TECHNICAL",
                  "content": "question text",
                  "difficulty": "MEDIUM",
                  "tags": ["java", "oop"]
                }
              ]
            }
            """;

        String userMessage = String.format(
            "Generate interview questions for: Role=%s, Experience=%s, Types=[%s]%s",
            request.getTargetRole() != null ? request.getTargetRole() : "Software Engineer",
            request.getExperienceLevel() != null ? request.getExperienceLevel() : "MID",
            request.getQuestionCategories() != null ? String.join(",", request.getQuestionCategories()) : "HR,TECHNICAL,BEHAVIORAL",
            resumeContext
        );

        try {
            String response = openAiClient.chatJson(systemPrompt, userMessage);
            JsonNode root = objectMapper.readTree(response);
            JsonNode questionsNode = root.path("questions");

            java.util.List<Question> questions = new java.util.ArrayList<>();
            for (int i = 0; i < questionsNode.size(); i++) {
                JsonNode q = questionsNode.get(i);

                String tags = "";
                if (q.has("tags") && q.path("tags").isArray()) {
                    String[] tagArr = new String[q.path("tags").size()];
                    for (int j = 0; j < q.path("tags").size(); j++) {
                        tagArr[j] = q.path("tags").get(j).asText();
                    }
                    tags = String.join(",", tagArr);
                }

                questions.add(Question.builder()
                    .session(session)
                    .category(q.path("category").asText("TECHNICAL"))
                    .content(q.path("content").asText())
                    .difficulty(q.path("difficulty").asText("MEDIUM"))
                    .tags(tags)
                    .orderIndex(i)
                    .build());
            }
            return questions;
        } catch (Exception e) {
            log.error("Question generation failed: {}", e.getMessage());
            // Return default questions as fallback
            return List.of(
                buildDefaultQuestion(session, "Tell me about yourself.", "HR", 0),
                buildDefaultQuestion(session, "What are your strongest technical skills?", "TECHNICAL", 1),
                buildDefaultQuestion(session, "Describe a challenging project you worked on.", "PROJECT", 2),
                buildDefaultQuestion(session, "How do you handle tight deadlines?", "BEHAVIORAL", 3),
                buildDefaultQuestion(session, "Where do you see yourself in 5 years?", "HR", 4)
            );
        }
    }

    private Question buildDefaultQuestion(InterviewSession session, String content, String category, int order) {
        return Question.builder()
            .session(session)
            .content(content)
            .category(category)
            .difficulty("MEDIUM")
            .orderIndex(order)
            .build();
    }

    public AnswerWithFeedback submitAnswer(UUID sessionId, SubmitAnswerRequest request, String userEmail) {
        User user = findUser(userEmail);
        InterviewSession session = sessionRepository.findByIdAndUser(sessionId, user)
            .orElseThrow(() -> new ResourceNotFoundException("InterviewSession", "id", sessionId));

        Question question = questionRepository.findById(UUID.fromString(request.getQuestionId()))
            .orElseThrow(() -> new ResourceNotFoundException("Question", "id", request.getQuestionId()));

        String answerText = request.getTextContent();
        if (answerText == null || answerText.isBlank()) {
            answerText = request.getTranscript();
        }

        Answer answer = Answer.builder()
            .question(question)
            .session(session)
            .textContent(answerText)
            .transcript(request.getTranscript())
            .wordCount(answerText != null ? answerText.split("\\s+").length : 0)
            .build();

        answer = answerRepository.save(answer);

        // Generate AI feedback
        Feedback feedback = generateFeedback(answer, question, session);

        // Update session progress
        session.setAnsweredQuestions(session.getAnsweredQuestions() + 1);
        sessionRepository.save(session);

        return new AnswerWithFeedback(answer, feedback);
    }

    private Feedback generateFeedback(Answer answer, Question question, InterviewSession session) {
        String answerText = answer.getTextContent() != null ? answer.getTextContent() : answer.getTranscript();
        if (answerText == null || answerText.isBlank()) answerText = "(No answer provided)";

        String systemPrompt = """
            You are an expert interview coach. Evaluate this interview answer and return JSON:
            {
              "technical_score": 0-10,
              "communication_score": 0-10,
              "confidence_score": 0-10,
              "relevance_score": 0-10,
              "structure_score": 0-10,
              "problem_solving_score": 0-10,
              "overall_score": 0-10,
              "strengths": ["strength1", "strength2"],
              "weaknesses": ["weakness1"],
              "suggested_answer": "A better answer would be...",
              "detailed_feedback": "Detailed evaluation paragraph"
            }
            """;

        String userMessage = String.format("Question (%s): %s\n\nCandidate Answer: %s",
            question.getCategory(), question.getContent(), answerText);

        try {
            String response = openAiClient.chatJson(systemPrompt, userMessage);
            JsonNode node = objectMapper.readTree(response);

            String[] strengths = parseStringArray(node.path("strengths"));
            String[] weaknesses = parseStringArray(node.path("weaknesses"));

            Feedback feedback = Feedback.builder()
                .answer(answer)
                .session(session)
                .technicalScore(node.path("technical_score").asInt(5))
                .communicationScore(node.path("communication_score").asInt(5))
                .confidenceScore(node.path("confidence_score").asInt(5))
                .relevanceScore(node.path("relevance_score").asInt(5))
                .structureScore(node.path("structure_score").asInt(5))
                .problemSolvingScore(node.path("problem_solving_score").asInt(5))
                .overallScore(node.path("overall_score").asInt(5))
                .strengths(String.join(",", strengths))
                .weaknesses(String.join(",", weaknesses))
                .suggestedAnswer(node.path("suggested_answer").asText())
                .detailedFeedback(node.path("detailed_feedback").asText())
                .aiRawResponse(response)
                .build();

            return feedbackRepository.save(feedback);
        } catch (Exception e) {
            log.error("Feedback generation failed: {}", e.getMessage());
            Feedback feedback = Feedback.builder()
                .answer(answer).session(session)
                .overallScore(5).technicalScore(5).communicationScore(5).confidenceScore(5)
                .detailedFeedback("Feedback generation is temporarily unavailable.")
                .build();
            return feedbackRepository.save(feedback);
        }
    }

    public InterviewSession completeSession(UUID sessionId, String userEmail) {
        User user = findUser(userEmail);
        InterviewSession session = sessionRepository.findByIdAndUser(sessionId, user)
            .orElseThrow(() -> new ResourceNotFoundException("InterviewSession", "id", sessionId));

        session.setStatus("COMPLETED");
        session.setCompletedAt(OffsetDateTime.now());
        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public Page<InterviewSession> getUserSessions(String userEmail, Pageable pageable) {
        User user = findUser(userEmail);
        return sessionRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    @Transactional(readOnly = true)
    public InterviewSession getSessionById(UUID sessionId, String userEmail) {
        User user = findUser(userEmail);
        return sessionRepository.findByIdAndUser(sessionId, user)
            .orElseThrow(() -> new ResourceNotFoundException("InterviewSession", "id", sessionId));
    }

    @Transactional(readOnly = true)
    public List<Question> getSessionQuestions(UUID sessionId, String userEmail) {
        getSessionById(sessionId, userEmail);
        return questionRepository.findBySessionIdOrderByOrderIndexAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public List<Feedback> getSessionFeedbacks(UUID sessionId, String userEmail) {
        getSessionById(sessionId, userEmail);
        return feedbackRepository.findBySessionId(sessionId);
    }

    private String[] parseStringArray(JsonNode node) {
        if (!node.isArray()) return new String[0];
        String[] arr = new String[node.size()];
        for (int i = 0; i < node.size(); i++) arr[i] = node.get(i).asText();
        return arr;
    }

    private User findUser(String email) {
        return userRepository.findByEmailAndDeletedAtIsNull(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public record AnswerWithFeedback(Answer answer, Feedback feedback) {}
}
