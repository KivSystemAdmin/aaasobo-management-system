-- Convert MessageBoardPost.target from text to integer-based MessageTarget
ALTER TABLE "MessageBoardPost"
ALTER COLUMN "target" TYPE INTEGER
USING CASE
  WHEN "target" = 'customers' THEN 0
  WHEN "target" = 'instructors' THEN 1
  WHEN "target" = 'both' THEN 2
  ELSE NULL
END;
