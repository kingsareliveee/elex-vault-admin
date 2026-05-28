-- 1. Add moderation_status column
ALTER TABLE elex_papers 
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending';

-- 2. Backfill existing rows
UPDATE elex_papers 
SET moderation_status = 'approved' 
WHERE is_approved = true AND moderation_status = 'pending';

UPDATE elex_papers 
SET moderation_status = 'pending' 
WHERE is_approved = false AND moderation_status = 'pending';

-- 3. Add Indexes for performance
CREATE INDEX IF NOT EXISTS idx_elex_papers_moderation_status ON elex_papers(moderation_status);
CREATE INDEX IF NOT EXISTS idx_elex_papers_contributor_name ON elex_papers(contributor_name);
CREATE INDEX IF NOT EXISTS idx_elex_papers_subject_code ON elex_papers(subject_code);
