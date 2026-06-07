-- V3: Job Descriptions and Job Matches

CREATE TABLE job_descriptions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    company     VARCHAR(255),
    content     TEXT NOT NULL,
    source      VARCHAR(50) DEFAULT 'PASTED', -- PASTED, UPLOADED
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_descriptions_user_id ON job_descriptions(user_id);

CREATE TABLE job_matches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id           UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    job_description_id  UUID NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    match_percentage    INTEGER DEFAULT 0,       -- 0–100
    missing_skills      TEXT[],
    strong_skills       TEXT[],
    suggested_improvements JSONB,               -- [{area, suggestion}]
    ats_compatibility   INTEGER DEFAULT 0,       -- 0–100
    analysis_json       JSONB,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_matches_user_id ON job_matches(user_id);
CREATE INDEX idx_job_matches_resume_id ON job_matches(resume_id);
CREATE INDEX idx_job_matches_jd_id ON job_matches(job_description_id);
