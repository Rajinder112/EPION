-- Waheguru Nursing Classes Database Schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for Google login
    google_id VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    xp_points INT DEFAULT 0,
    streak INT DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    phone VARCHAR(50),
    country VARCHAR(100),
    state VARCHAR(100),
    address TEXT,
    security_question TEXT,
    security_answer TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    batch_id INT,
    profile_pic TEXT,
    last_active_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Format: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer INT NOT NULL CHECK (correct_answer BETWEEN 0 AND 3), -- index of options array (0-3)
    explanation TEXT NOT NULL,
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    tags TEXT[] DEFAULT '{}',
    previous_year_indicator VARCHAR(100), -- e.g., 'SGPGI 2023'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id)
);

-- 4. Question Attempts Table
CREATE TABLE IF NOT EXISTS question_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    chosen_option INT NOT NULL CHECK (chosen_option BETWEEN 0 AND 3),
    is_correct BOOLEAN NOT NULL,
    confidence_rating INT CHECK (confidence_rating BETWEEN 1 AND 5), -- 1 to 5 stars
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Mock Tests Table
CREATE TABLE IF NOT EXISTS mock_tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    total_questions INT NOT NULL,
    negative_marking DECIMAL(3,2) DEFAULT 0.25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Mock Test Questions (Mapping table)
CREATE TABLE IF NOT EXISTS mock_test_questions (
    mock_test_id INT REFERENCES mock_tests(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    PRIMARY KEY (mock_test_id, question_id)
);

-- 7. Mock Test Attempts Table
CREATE TABLE IF NOT EXISTS mock_test_attempts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mock_test_id INT REFERENCES mock_tests(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    total_attempted INT NOT NULL,
    correct_count INT NOT NULL,
    incorrect_count INT NOT NULL,
    time_taken_seconds INT NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for search optimization
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user ON mock_test_attempts(user_id);

-- 8. NCLEX-RN Notes Table
CREATE TABLE IF NOT EXISTS nclex_notes (
    id SERIAL PRIMARY KEY,
    topic_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    pdf_path VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255),
    pages INT DEFAULT 0,
    file_size VARCHAR(50),
    reading_time INT DEFAULT 0,
    downloads INT DEFAULT 0,
    views INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Hidden')),
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. User Note Progress Table
CREATE TABLE IF NOT EXISTS user_note_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note_id INT REFERENCES nclex_notes(id) ON DELETE CASCADE,
    last_page INT DEFAULT 1,
    progress_percent INT DEFAULT 0,
    bookmarked BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    last_opened TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, note_id)
);

-- Indices for NCLEX Notes optimization
CREATE INDEX IF NOT EXISTS idx_nclex_notes_slug ON nclex_notes(slug);
CREATE INDEX IF NOT EXISTS idx_nclex_notes_category ON nclex_notes(category);
CREATE INDEX IF NOT EXISTS idx_note_progress_user ON user_note_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_note_progress_note ON user_note_progress(note_id);

