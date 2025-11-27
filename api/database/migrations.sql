-- Database Schema Enhancements for Fashion AI App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- OUTFITS TABLE
-- ============================================
-- Stores user's saved/liked outfits
CREATE TABLE IF NOT EXISTS outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  occasion TEXT,
  weather TEXT,
  items JSONB NOT NULL,
  style_analysis JSONB,
  confidence DECIMAL(3,2),
  color_harmony TEXT,
  why_it_works TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outfits
CREATE POLICY "Users can view own outfits" ON outfits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits" ON outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits" ON outfits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits" ON outfits
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for outfits
CREATE INDEX IF NOT EXISTS idx_outfits_user_created ON outfits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfits_user_occasion ON outfits(user_id, occasion);
CREATE INDEX IF NOT EXISTS idx_outfits_user_weather ON outfits(user_id, weather);

-- ============================================
-- PINTEREST BOARDS TABLE
-- ============================================
-- Stores analyzed Pinterest boards
CREATE TABLE IF NOT EXISTS pinterest_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_url TEXT NOT NULL,
  board_name TEXT,
  board_id TEXT,
  style_insights JSONB NOT NULL,
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  processing_time DECIMAL(5,2),
  pin_count INTEGER,
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, board_url)
);

-- Enable Row Level Security
ALTER TABLE pinterest_boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pinterest_boards
CREATE POLICY "Users can view own boards" ON pinterest_boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boards" ON pinterest_boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards" ON pinterest_boards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards" ON pinterest_boards
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for pinterest_boards
CREATE INDEX IF NOT EXISTS idx_pinterest_boards_user ON pinterest_boards(user_id, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_pinterest_boards_url ON pinterest_boards(board_url);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
-- Stores user preferences for ML learning
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preference_type TEXT NOT NULL, -- 'color', 'style', 'brand', 'occasion', 'pattern', 'material'
  preference_value TEXT NOT NULL,
  preference_score DECIMAL(3,2) DEFAULT 0.5,
  interaction_count INTEGER DEFAULT 1,
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_type, preference_value)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_type ON user_preferences(user_id, preference_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_score ON user_preferences(user_id, preference_score DESC);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
-- Stores user achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================
-- Stores analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (users can only see their own events)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Anyone can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_user_event ON analytics_events(user_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_date ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id, created_at DESC);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to get user style insights
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

-- Function to update user preference score
CREATE OR REPLACE FUNCTION update_preference_score(
  p_user_id UUID,
  p_preference_type TEXT,
  p_preference_value TEXT,
  p_liked BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  current_score DECIMAL(3,2);
  new_score DECIMAL(3,2);
  current_count INTEGER;
BEGIN
  -- Get current preference if exists
  SELECT preference_score, interaction_count INTO current_score, current_count
  FROM user_preferences
  WHERE user_id = p_user_id 
    AND preference_type = p_preference_type 
    AND preference_value = p_preference_value;
  
  -- Calculate new score (weighted average)
  IF current_score IS NULL THEN
    new_score := CASE WHEN p_liked THEN 0.8 ELSE 0.2 END;
    current_count := 1;
  ELSE
    -- Weighted average: new interaction has 30% weight
    new_score := (current_score * 0.7) + (CASE WHEN p_liked THEN 0.8 ELSE 0.2 END * 0.3);
    current_count := current_count + 1;
  END IF;
  
  -- Upsert preference
  INSERT INTO user_preferences (user_id, preference_type, preference_value, preference_score, interaction_count, last_interaction)
  VALUES (p_user_id, p_preference_type, p_preference_value, new_score, current_count, NOW())
  ON CONFLICT (user_id, preference_type, preference_value)
  DO UPDATE SET
    preference_score = new_score,
    interaction_count = current_count,
    last_interaction = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================

-- Add search index for wardrobe items
-- Note: tags is JSONB, so we convert it to text for search
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_search ON wardrobe_items 
USING gin(to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(brands, '') || ' ' || 
  COALESCE(category, '') || ' ' ||
  COALESCE(tags::text, '')
));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wardrobe_user_category_color 
ON wardrobe_items(user_id, category, (colors->>0));

CREATE INDEX IF NOT EXISTS idx_swipe_history_user_action_occasion 
ON swipe_history(user_id, action, occasion);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_outfits_updated_at BEFORE UPDATE ON outfits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pinterest_boards_updated_at BEFORE UPDATE ON pinterest_boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERFUMES TABLE
-- ============================================
-- Stores user's perfume collection
CREATE TABLE IF NOT EXISTS perfumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  notes JSONB, -- {top: [], middle: [], base: []}
  seasonality TEXT[], -- ['spring', 'summer', 'fall', 'winter']
  occasion TEXT[], -- ['day', 'night', 'casual', 'formal', 'date', 'work']
  projection TEXT, -- 'intimate', 'moderate', 'strong', 'beast-mode'
  longevity TEXT, -- 'short', 'moderate', 'long', 'very-long'
  sillage TEXT, -- 'close', 'moderate', 'strong'
  weather_compatibility TEXT[], -- ['cold', 'mild', 'warm', 'hot']
  time_of_day TEXT[], -- ['morning', 'afternoon', 'evening', 'night']
  mood TEXT[], -- ['fresh', 'warm', 'spicy', 'floral', 'woody', 'citrus']
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for perfumes
CREATE POLICY "Users can view own perfumes" ON perfumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own perfumes" ON perfumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own perfumes" ON perfumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own perfumes" ON perfumes
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for perfumes
CREATE INDEX IF NOT EXISTS idx_perfumes_user ON perfumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perfumes_brand ON perfumes(brand);
CREATE INDEX IF NOT EXISTS idx_perfumes_seasonality ON perfumes USING GIN(seasonality);
CREATE INDEX IF NOT EXISTS idx_perfumes_occasion ON perfumes USING GIN(occasion);

-- ============================================
-- USER GAMIFICATION TABLE
-- ============================================
-- Stores streaks, XP, and daily activity
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_activity_date DATE,
  daily_actions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_gamification
CREATE POLICY "Users can view own gamification" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON user_gamification(user_id);

-- Trigger for perfumes updated_at
CREATE TRIGGER update_perfumes_updated_at BEFORE UPDATE ON perfumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

