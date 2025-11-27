# Migration Fix - Column Name Error

## ✅ Fixed

The migration file had incorrect column names. The `wardrobe_items` table uses `brands` (plural), not `brand` (singular).

### Changes Made:
1. **Line 288**: Changed `brand` → `brands` in the full-text search index
2. **Lines 206-211**: Changed `brand` → `brands` in the `get_user_style_insights` function

## 🚀 How to Fix

### Option 1: Re-run the Fixed Migration (Recommended)
1. The migration file has been fixed
2. Re-run the entire `api/database/migrations.sql` file in Supabase SQL Editor
3. It's safe to run again - uses `CREATE IF NOT EXISTS` and `CREATE OR REPLACE`

### Option 2: Run Just the Fixed Parts

If you've already run most of the migration, just run these fixes:

```sql
-- Fix the full-text search index
DROP INDEX IF EXISTS idx_wardrobe_items_search;
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_search ON wardrobe_items 
USING gin(to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(brands, '') || ' ' || 
  COALESCE(category, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
));

-- Fix the get_user_style_insights function
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
```

## ✅ Verify

After running the fix, verify it worked:

```sql
-- Check if index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'wardrobe_items' 
  AND indexname = 'idx_wardrobe_items_search';

-- Test the function (replace with your user ID)
SELECT get_user_style_insights('your-user-id-here');
```

## 📝 Note

The `wardrobe_items` table schema uses:
- `brands` (TEXT) - singular brand name stored in plural column name
- `colors` (TEXT[]) - array of colors
- `tags` (TEXT[]) - array of tags

This is why the code maps `item.brands` to `item.brand` in the TypeScript interface.

