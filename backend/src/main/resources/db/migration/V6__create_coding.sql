-- V6: Coding Challenges and Submissions

CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE submission_status AS ENUM ('PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT', 'RUNTIME_ERROR', 'COMPILE_ERROR');

CREATE TABLE coding_challenges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    difficulty      difficulty_level NOT NULL DEFAULT 'MEDIUM',
    category        VARCHAR(100),                   -- Arrays, Trees, DP, etc.
    tags            TEXT[],
    constraints     TEXT,
    examples        JSONB,                           -- [{input, output, explanation}]
    test_cases      JSONB NOT NULL,                 -- [{input, expected_output, is_hidden}]
    starter_code    JSONB,                           -- {java: "...", python: "...", javascript: "..."}
    solution_code   JSONB,                           -- hidden solutions per language
    time_limit_ms   INTEGER DEFAULT 2000,
    memory_limit_mb INTEGER DEFAULT 256,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coding_challenges_difficulty ON coding_challenges(difficulty);
CREATE INDEX idx_coding_challenges_category ON coding_challenges(category);

CREATE TABLE coding_submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id    UUID NOT NULL REFERENCES coding_challenges(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES interview_sessions(id),
    code            TEXT NOT NULL,
    language        VARCHAR(50) NOT NULL,           -- JAVA, PYTHON, JAVASCRIPT, CPP
    language_id     INTEGER,                        -- Judge0 language ID
    status          submission_status NOT NULL DEFAULT 'PENDING',
    runtime_ms      INTEGER,
    memory_kb       INTEGER,
    test_results    JSONB,                           -- [{passed, input, expected, actual}]
    passed_tests    INTEGER DEFAULT 0,
    total_tests     INTEGER DEFAULT 0,
    ai_review       TEXT,
    complexity_analysis JSONB,                      -- {time: "O(n)", space: "O(1)", explanation}
    judge0_token    VARCHAR(255),
    submitted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coding_submissions_user_id ON coding_submissions(user_id);
CREATE INDEX idx_coding_submissions_challenge_id ON coding_submissions(challenge_id);
CREATE INDEX idx_coding_submissions_status ON coding_submissions(status);

CREATE TRIGGER update_coding_challenges_updated_at BEFORE UPDATE ON coding_challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
