-- Quick Fix: Fix tags JSONB array handling in search index
-- Run this if you're getting "function array_to_string(jsonb, unknown) does not exist"

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_wardrobe_items_search;

-- Recreate with proper JSONB handling
-- The tags column is JSONB, so we convert it to text for search
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_search ON wardrobe_items 
USING gin(to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(brands, '') || ' ' || 
  COALESCE(category, '') || ' ' ||
  COALESCE(tags::text, '')
));

