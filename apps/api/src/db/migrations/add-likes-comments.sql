CREATE TABLE IF NOT EXISTS course_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_course_likes_user ON course_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_course_likes_course ON course_likes(course_id);

CREATE TABLE IF NOT EXISTS course_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_comments_course ON course_comments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_user ON course_comments(user_id);
