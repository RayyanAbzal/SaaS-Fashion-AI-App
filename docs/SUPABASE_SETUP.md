# 🚀 Supabase Setup Guide for Style Oracle

Your app is now using Supabase instead of Firebase! Follow these steps to get everything working.

## Why Supabase?
- ✅ **No more Firebase Auth errors** - Works perfectly with React Native
- ✅ **Built-in AsyncStorage persistence** - User stays logged in
- ✅ **Modern & Fast** - Better developer experience
- ✅ **Free tier** - 500MB database, 1GB file storage, 50,000 monthly active users
- ✅ **Real-time subscriptions** - For future features

---

## Step 1: Create a Supabase Account (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Create a new organization (e.g., "Style Oracle")

---

## Step 2: Create Your Project (2 minutes)

1. Click "New Project"
2. Fill in:
   - **Name**: `style-oracle` (or whatever you prefer)
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (perfect for development)
3. Click "Create new project"
4. Wait ~2 minutes for setup to complete ⏱️

---

## Step 3: Create Database Tables (3 minutes)

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  style_profile JSONB DEFAULT '{}',
  brand_preferences JSONB DEFAULT '{}',
  subscription JSONB DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create wardrobe_items table
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  colors JSONB DEFAULT '[]',
  brands TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wardrobe" ON wardrobe_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wardrobe" ON wardrobe_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobe" ON wardrobe_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobe" ON wardrobe_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create swipe_history table
CREATE TABLE swipe_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_items JSONB NOT NULL,
  action TEXT NOT NULL,
  occasion TEXT,
  weather TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE swipe_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swipe history" ON swipe_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipe history" ON swipe_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_swipe_history_user_created ON swipe_history(user_id, created_at DESC);
CREATE INDEX idx_wardrobe_items_user ON wardrobe_items(user_id, created_at DESC);
```

4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

---

## Step 4: Set Up Storage for Images (2 minutes)

1. Go to **Storage** in the left sidebar
2. Click "Create a new bucket"
3. Configure:
   - **Name**: `images`
   - **Public bucket**: Toggle **ON** (so images can be viewed)
   - Click "Create bucket"

4. Click on the `images` bucket
5. Click "Policies" tab
6. Click "New Policy"
7. Select "For full customization, create a policy from scratch"
8. Paste this policy:

```sql
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Step 5: Get Your API Keys (1 minute)

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** in the left menu
3. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

4. Copy both of these!

---

## Step 6: Add Keys to Your App (1 minute)

### Option A: Quick Test (Temporary)

Open your terminal in the project folder and run:

```bash
export EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
npx expo start -c
```

### Option B: Permanent Setup (Recommended)

1. Create a `.env` file in your project root (if it doesn't exist):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Restart your Expo server:

```bash
npx expo start -c
```

---

## Step 7: Enable Email Auth (Optional, 1 minute)

1. Go to **Authentication** > **Providers** in your Supabase dashboard
2. Find "Email" and make sure it's **enabled**
3. (Optional) Customize the email templates in **Authentication** > **Email Templates**

---

## 🎉 You're Done!

Your app now has:
- ✅ User authentication (sign up/login)
- ✅ Secure database for wardrobe items
- ✅ Swipe history tracking
- ✅ Image storage for outfit photos

### Test It Out:

1. Open your app
2. Try signing up with a new account
3. Add a wardrobe item
4. Try the Style Swipe feature
5. Everything should work perfectly!

---

## 🔧 Troubleshooting

### "Invalid API key" error
- Double-check you copied the **anon public** key (not the service_role key!)
- Make sure there are no extra spaces in your `.env` file

### "Failed to upload image" error
- Make sure you created the `images` bucket in Storage
- Verify the bucket is set to **public**

### "Row Level Security policy violation"
- Your SQL policies might not have been created correctly
- Go back to Step 3 and re-run the SQL

---

## 📚 What's Next?

Want to add more features? Check out:
- [Supabase Docs](https://supabase.com/docs)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Edge Functions](https://supabase.com/docs/guides/functions)

Need help? The Supabase Discord is super active and helpful!
