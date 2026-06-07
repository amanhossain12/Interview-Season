package com.interviewai.domain.resume.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewai.domain.resume.entity.Resume;
import com.interviewai.domain.resume.entity.ResumeAnalysis;
import com.interviewai.domain.resume.repository.ResumeAnalysisRepository;
import com.interviewai.domain.resume.repository.ResumeRepository;
import com.interviewai.domain.user.entity.User;
import com.interviewai.domain.user.repository.UserRepository;
import com.interviewai.infrastructure.ai.OpenAiClient;
import com.interviewai.shared.exception.BadRequestException;
import com.interviewai.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public Resume uploadResume(MultipartFile file, String userEmail) {
        User user = findUser(userEmail);

        String fileType = getFileType(file);
        String rawText = extractText(file, fileType);

        Resume resume = Resume.builder()
            .user(user)
            .originalName(file.getOriginalFilename())
            .fileType(fileType)
            .rawText(rawText)
            .status("PROCESSING")
            .build();

        resume = resumeRepository.save(resume);
        analyzeResumeAsync(resume.getId());
        return resume;
    }

    @Async
    public void analyzeResumeAsync(UUID resumeId) {
        try {
            Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));

            // Extract structured data
            String extractionPrompt = """
                You are a resume parser. Extract structured information from this resume.
                Return a JSON object with these exact fields:
                {
                  "name": "string",
                  "email": "string",
                  "phone": "string",
                  "location": "string",
                  "summary": "string",
                  "skills": ["skill1", "skill2"],
                  "education": [{"degree": "", "institution": "", "year": "", "gpa": ""}],
                  "experience": [{"title": "", "company": "", "duration": "", "description": ""}],
                  "projects": [{"name": "", "description": "", "technologies": []}],
                  "certifications": ["cert1", "cert2"],
                  "languages": ["English"]
                }
                """;

            String extractedJson = openAiClient.chatJson(extractionPrompt, resume.getRawText());

            // Analyze the resume
            String analysisPrompt = """
                You are an expert ATS and resume quality analyzer.
                Analyze this resume and return JSON with:
                {
                  "ats_score": 0-100,
                  "quality_score": 0-100,
                  "experience_years": 0,
                  "missing_sections": ["section1"],
                  "skills_found": ["skill1"],
                  "keyword_analysis": {
                    "found": ["keyword1"],
                    "missing": ["keyword2"],
                    "density": {"keyword": count}
                  },
                  "improvement_suggestions": [
                    {"section": "Summary", "suggestion": "text", "priority": "HIGH"}
                  ]
                }
                """;

            String analysisJson = openAiClient.chatJson(analysisPrompt,
                "Resume text:\n" + resume.getRawText());

            var analysisNode = objectMapper.readTree(analysisJson);

            // Update resume
            resume.setExtractedJson(extractedJson);
            resume.setAtsScore(analysisNode.path("ats_score").asInt(50));
            resume.setStatus("ANALYZED");
            resumeRepository.save(resume);

            // Save analysis
            ResumeAnalysis analysis = analysisRepository.findByResumeId(resumeId)
                .orElse(ResumeAnalysis.builder().resume(resume).build());

            analysis.setAtsScore(analysisNode.path("ats_score").asInt(50));
            analysis.setQualityScore(analysisNode.path("quality_score").asInt(50));
            analysis.setExperienceYears(analysisNode.path("experience_years").asInt(0));

            var missingArr = analysisNode.path("missing_sections");
            if (missingArr.isArray()) {
                String[] missing = new String[missingArr.size()];
                for (int i = 0; i < missingArr.size(); i++) missing[i] = missingArr.get(i).asText();
                analysis.setMissingSections(String.join(",", missing));
            }

            var skillsArr = analysisNode.path("skills_found");
            if (skillsArr.isArray()) {
                String[] skills = new String[skillsArr.size()];
                for (int i = 0; i < skillsArr.size(); i++) skills[i] = skillsArr.get(i).asText();
                analysis.setSkillsFound(String.join(",", skills));
            }

            analysis.setKeywordAnalysis(analysisNode.path("keyword_analysis").toString());
            analysis.setImprovementSuggestions(analysisNode.path("improvement_suggestions").toString());
            analysisRepository.save(analysis);

            log.info("Resume analysis complete for resume: {}", resumeId);
        } catch (Exception e) {
            log.error("Resume analysis failed for {}: {}", resumeId, e.getMessage());
            resumeRepository.findById(resumeId).ifPresent(r -> {
                r.setStatus("FAILED");
                resumeRepository.save(r);
            });
        }
    }

    @Transactional(readOnly = true)
    public List<Resume> getUserResumes(String userEmail) {
        User user = findUser(userEmail);
        return resumeRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public Resume getResumeById(UUID resumeId, String userEmail) {
        User user = findUser(userEmail);
        return resumeRepository.findByIdAndUser(resumeId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Resume", "id", resumeId));
    }

    @Transactional(readOnly = true)
    public ResumeAnalysis getResumeAnalysis(UUID resumeId, String userEmail) {
        getResumeById(resumeId, userEmail); // security check
        return analysisRepository.findByResumeId(resumeId)
            .orElseThrow(() -> new ResourceNotFoundException("ResumeAnalysis", "resumeId", resumeId));
    }

    private String extractText(MultipartFile file, String fileType) {
        try {
            if ("PDF".equals(fileType)) {
                try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                    return new PDFTextStripper().getText(doc);
                }
            } else if ("DOCX".equals(fileType)) {
                try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
                    return new XWPFWordExtractor(doc).getText();
                }
            }
        } catch (IOException e) {
            log.error("Text extraction failed: {}", e.getMessage());
            throw new BadRequestException("Could not read file content. Please ensure it's a valid PDF or DOCX.");
        }
        throw new BadRequestException("Unsupported file type");
    }

    private String getFileType(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null) throw new BadRequestException("Invalid file");
        if (name.toLowerCase().endsWith(".pdf")) return "PDF";
        if (name.toLowerCase().endsWith(".docx")) return "DOCX";
        throw new BadRequestException("Only PDF and DOCX files are supported");
    }

    private User findUser(String email) {
        return userRepository.findByEmailAndDeletedAtIsNull(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
