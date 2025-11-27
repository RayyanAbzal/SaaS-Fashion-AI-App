-- Quick Fix: Replace brand with brands in migration
-- Run this if you're still getting the "column brand does not exist" error

-- Fix 1: Drop and recreate the search index
-- Note: tags is JSONB, so we convert it to text for search
DROP INDEX IF EXISTS idx_wardrobe_items_search;
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_search ON wardrobe_items 
USING gin(to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(brands, '') || ' ' || 
  COALESCE(category, '') || ' ' ||
  COALESCE(tags::text, '')
));

-- Fix 2: Recreate the function with correct column name
CREATE OR REPLACE FUNCTION get_user_style_insights(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  insights JSONB;
BEGIN
  SELECT jsonb_build_object(
    'top_colors', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('color', color, 'count', count) ORDER BY count DESC), '[]'::jsonb)
      FROM (
        SELECT 
          jsonb_array_elements_text(colors) as color,
          COUNT(*) as count
        FROM wardrobe_items
        WHERE user_id = p_user_id
        GROUP BY color
        LIMIT 5
      ) sub
    ),
    'top_brands', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('brand', brands, 'count', count) ORDER BY count DESC), '[]'::jsonb)
      FROM (
        SELECT brands, COUNT(*) as count
        FROM wardrobe_items
        WHERE user_id = p_user_id AND brands IS NOT NULL AND brands != ''
        GROUP BY brands
        LIMIT 5
      ) sub
    ),
    'total_items', (
      SELECT COUNT(*) FROM wardrobe_items WHERE user_id = p_user_id
    ),
    'most_liked_occasion', (
      SELECT occasion
      FROM swipe_history
      WHERE user_id = p_user_id AND action = 'like'
      GROUP BY occasion
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'total_outfits_saved', (
      SELECT COUNT(*) FROM outfits WHERE user_id = p_user_id
    ),
    'pinterest_boards_analyzed', (
      SELECT COUNT(*) FROM pinterest_boards WHERE user_id = p_user_id
    )
  ) INTO insights;
  
  RETURN insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

