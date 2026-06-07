-- V4: Interview Sessions, Questions, Answers

CREATE TYPE interview_type AS ENUM ('TEXT', 'VOICE', 'MIXED');
CREATE TYPE interview_status AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');
CREATE TYPE question_category AS ENUM ('HR', 'TECHNICAL', 'BEHAVIORAL', 'PROJECT', 'SYSTEM_DESIGN', 'CODING');

CREATE TABLE interview_sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id           UUID REFERENCES resumes(id),
    job_description_id  UUID REFERENCES job_descriptions(id),
    title               VARCHAR(255),
    target_role         VARCHAR(255),
    experience_level    VARCHAR(50),           -- JUNIOR, MID, SENIOR, LEAD
    interview_type      interview_type NOT NULL DEFAULT 'TEXT',
    status              interview_status NOT NULL DEFAULT 'CREATED',
    total_questions     INTEGER DEFAULT 0,
    answered_questions  INTEGER DEFAULT 0,
    duration_seconds    INTEGER DEFAULT 0,
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_interview_sessions_created_at ON interview_sessions(created_at DESC);

CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON interview_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    category        question_category NOT NULL,
    content         TEXT NOT NULL,
    follow_up_of    UUID REFERENCES questions(id),    -- null = main question
    order_index     INTEGER NOT NULL DEFAULT 0,
    difficulty      VARCHAR(20) DEFAULT 'MEDIUM',     -- EASY, MEDIUM, HARD
    tags            TEXT[],
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_session_id ON questions(session_id);

CREATE TABLE answers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    text_content    TEXT,
    audio_url       VARCHAR(1000),
    transcript      TEXT,                              -- from Whisper STT
    duration_seconds INTEGER DEFAULT 0,
    word_count      INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_session_id ON answers(session_id);
