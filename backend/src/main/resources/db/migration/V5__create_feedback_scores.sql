-- V5: Feedback and Scores

CREATE TABLE feedbacks (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id               UUID NOT NULL UNIQUE REFERENCES answers(id) ON DELETE CASCADE,
    session_id              UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    technical_score         INTEGER DEFAULT 0,      -- 0–10
    communication_score     INTEGER DEFAULT 0,      -- 0–10
    confidence_score        INTEGER DEFAULT 0,      -- 0–10
    relevance_score         INTEGER DEFAULT 0,      -- 0–10
    structure_score         INTEGER DEFAULT 0,      -- 0–10
    problem_solving_score   INTEGER DEFAULT 0,      -- 0–10
    overall_score           INTEGER DEFAULT 0,      -- 0–10
    strengths               TEXT[],
    weaknesses              TEXT[],
    suggested_answer        TEXT,
    detailed_feedback       TEXT,
    ai_raw_response         JSONB,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedbacks_session_id ON feedbacks(session_id);
CREATE INDEX idx_feedbacks_answer_id ON feedbacks(answer_id);

CREATE TABLE scores (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id              UUID NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    overall_score           DECIMAL(5,2) DEFAULT 0,         -- 0–100
    technical_score         DECIMAL(5,2) DEFAULT 0,         -- 0–100
    communication_score     DECIMAL(5,2) DEFAULT 0,         -- 0–100
    confidence_score        DECIMAL(5,2) DEFAULT 0,         -- 0–100
    behavioral_score        DECIMAL(5,2) DEFAULT 0,
    problem_solving_score   DECIMAL(5,2) DEFAULT 0,
    topic_analysis          JSONB,                          -- [{topic, score, feedback}]
    strengths               TEXT[],
    weaknesses              TEXT[],
    recommendations         TEXT[],
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_session_id ON scores(session_id);
