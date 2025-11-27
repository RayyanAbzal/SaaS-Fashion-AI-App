# Quick Fix: Missing Database Tables

## 🚨 Current Issue

Your app is showing these errors:
```
ERROR Error fetching perfumes: Could not find the table 'public.perfumes'
ERROR Error initializing gamification: Could not find the table 'public.user_gamification'
```

## ✅ Quick Fix (2 minutes)

### Option 1: Run Full Migration (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** → **New Query**

2. **Copy Migration File**
   - Open: `api/database/migrations.sql`
   - Copy **ALL** contents (Cmd/Ctrl + A, then Cmd/Ctrl + C)

3. **Paste and Run**
   - Paste into SQL Editor
   - Click **Run** (or Cmd/Ctrl + Enter)
   - Wait for "Success" message

4. **Restart App**
   ```bash
   # Stop current Expo (Ctrl+C)
   npx expo start -c
   ```

### Option 2: Create Just Missing Tables (Faster)

If you only want to fix the immediate errors, run this in Supabase SQL Editor:

```sql
-- Create perfumes table
CREATE TABLE IF NOT EXISTS perfumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  notes JSONB,
  seasonality TEXT[],
  occasion TEXT[],
  projection TEXT,
  longevity TEXT,
  sillage TEXT,
  weather_compatibility TEXT[],
  time_of_day TEXT[],
  mood TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own perfumes" ON perfumes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own perfumes" ON perfumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own perfumes" ON perfumes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own perfumes" ON perfumes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_perfumes_user ON perfumes(user_id, created_at DESC);

-- Create user_gamification table
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

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON user_gamification(user_id);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_perfumes_updated_at BEFORE UPDATE ON perfumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## ✅ Verify It Worked

After running the SQL, check your Expo logs. You should see:
- ✅ No more "Could not find the table" errors
- ✅ App loads successfully
- ✅ Perfume and gamification features work

## 📝 What Changed in Code

The app now:
1. **Gracefully handles missing tables** - Returns empty arrays/defaults instead of crashing
2. **Shows helpful warnings** - Tells you to run migrations
3. **Fixed health check** - Uses auth check instead of querying non-existent tables

## 🎯 Next Steps

After fixing the tables:
1. The app will work normally
2. Perfume recommendations will save to database
3. Gamification (streaks, XP) will track properly
4. All features will be fully functional

