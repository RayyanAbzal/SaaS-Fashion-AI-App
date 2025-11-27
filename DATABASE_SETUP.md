# Database Setup Instructions

## ⚠️ Missing Tables Error

The app is showing errors because these tables don't exist in your Supabase database:
- `perfumes`
- `user_gamification`

## ✅ Solution: Run Database Migrations

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration Script

1. Open the file: `api/database/migrations.sql`
2. Copy **ALL** the contents of that file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Were Created

Run this query to check if tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('perfumes', 'user_gamification', 'outfits', 'pinterest_boards', 'user_preferences', 'achievements', 'analytics_events');
```

You should see all 7 tables listed.

### Step 4: Verify RLS Policies

Check that Row Level Security is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('perfumes', 'user_gamification');
```

Both should show `rowsecurity = true`.

## 🔍 Troubleshooting

### Error: "relation already exists"
- This means the table already exists. The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run again.

### Error: "permission denied"
- Make sure you're running the migration as the database owner or with proper permissions.

### Error: "function does not exist"
- The migration creates functions. Make sure you run the entire migration file, not just parts of it.

### Tables still not found after migration
1. Check if you're in the correct database/project
2. Refresh the Supabase dashboard
3. Try running just the table creation parts:

```sql
-- Just create the missing tables
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
```

## 📋 What the Migration Creates

The migration file creates:

1. **outfits** - Saved/liked outfits
2. **pinterest_boards** - Analyzed Pinterest boards
3. **user_preferences** - ML learning preferences
4. **achievements** - User achievements
5. **analytics_events** - Analytics tracking
6. **perfumes** - User perfume collection ⚠️ MISSING
7. **user_gamification** - Streaks, XP, levels ⚠️ MISSING

Plus:
- Row Level Security (RLS) policies
- Indexes for performance
- Database functions
- Triggers for `updated_at` timestamps

## ✅ After Running Migration

Once you've run the migration:
1. Restart your Expo app (`npx expo start -c`)
2. The errors should disappear
3. The app will be able to:
   - Store perfume recommendations
   - Track gamification (streaks, XP, levels)
   - Save outfits
   - Track user preferences

## 🚀 Quick Setup Command

If you have the Supabase CLI installed:

```bash
supabase db push
```

But the easiest way is to use the SQL Editor in the Supabase dashboard.

