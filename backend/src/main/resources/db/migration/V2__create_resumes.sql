-- V2: Resumes and Resume Analysis

CREATE TABLE resumes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name   VARCHAR(255) NOT NULL,
    file_url        VARCHAR(1000),
    file_type       VARCHAR(20) NOT NULL, -- PDF, DOCX
    raw_text        TEXT,
    extracted_json  JSONB,               -- {name, skills, education, experience, projects, certifications}
    ats_score       INTEGER DEFAULT 0,   -- 0–100
    status          VARCHAR(50) NOT NULL DEFAULT 'UPLOADED', -- UPLOADED, PROCESSING, ANALYZED, FAILED
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE resume_analyses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id           UUID NOT NULL UNIQUE REFERENCES resumes(id) ON DELETE CASCADE,
    quality_score       INTEGER DEFAULT 0,           -- 0–100
    ats_score           INTEGER DEFAULT 0,           -- 0–100
    missing_sections    TEXT[],
    keyword_analysis    JSONB,                       -- {found: [], missing: [], density: {}}
    improvement_suggestions JSONB,                   -- [{section, suggestion, priority}]
    skills_found        TEXT[],
    experience_years    INTEGER,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resume_analyses_resume_id ON resume_analyses(resume_id);
