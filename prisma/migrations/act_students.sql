-- Migration: Create act_students table for Assumption College Thonburi
-- School system designed to be extensible for multiple schools in the future.
-- Current implementation: ACT only (act_students table in public schema).

CREATE TABLE IF NOT EXISTS "act_students" (
  "id"            SERIAL PRIMARY KEY,
  "student_id"    VARCHAR(20)  NOT NULL UNIQUE,
  "prefix"        VARCHAR(10),
  "first_name"    VARCHAR(100) NOT NULL,
  "last_name"     VARCHAR(100) NOT NULL,
  "nickname"      VARCHAR(50),
  "grade"         VARCHAR(10),
  "classroom"     VARCHAR(20),
  "study_plan"    VARCHAR(100),
  "academic_year" INTEGER      DEFAULT 2568,
  "email"         VARCHAR(255),
  "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS "idx_act_students_student_id"       ON "act_students" ("student_id");
CREATE INDEX IF NOT EXISTS "idx_act_students_grade_classroom"  ON "act_students" ("grade", "classroom");

-- Helper function to derive grade/classroom from the room string (e.g. "ม.6/2" → grade "6", classroom "2")
-- Rows from student_db.sql use the `room` column directly as classroom.
