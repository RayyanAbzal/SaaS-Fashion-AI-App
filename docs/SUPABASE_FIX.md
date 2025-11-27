# 🔧 Fix Supabase Connection Issues

## Problem
Your Supabase project URL `qmrigittswmwuajnexux.supabase.co` cannot be resolved. This means the project either:
- Doesn't exist
- Was deleted or paused
- Has an incorrect URL

## Solution Options

### Option 1: Create a New Supabase Project (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in or create an account

2. **Create a New Project**
   - Click "New Project"
   - Fill in:
     - **Name**: `fashion-ai-app` (or your preferred name)
     - **Database Password**: Create a strong password (save it!)
     - **Region**: Choose closest to you
     - **Pricing Plan**: Free
   - Click "Create new project"
   - Wait ~2 minutes for setup

3. **Get Your Credentials**
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
     - **anon public** key (long string starting with `eyJ...`)

4. **Update Your .env File**
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key-here
   ```

5. **Set Up Database Tables**
   - Go to **SQL Editor** in Supabase dashboard
   - Run the SQL from `SUPABASE_SETUP.md` to create tables

6. **Restart Expo**
   ```bash
   npx expo start -c
   ```

### Option 2: Check Existing Project

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Check if you have any existing projects

2. **If Project Exists**
   - Click on your project
   - Go to **Settings** → **API**
   - Verify the **Project URL** matches what's in your `.env` file
   - If different, update your `.env` file

3. **If Project is Paused**
   - Click "Resume" to reactivate it
   - Wait a few minutes for it to come back online

### Option 3: Use Offline Mode (Temporary)

The app has been updated to work in offline mode. You can:
- Use the app without Supabase (limited features)
- Test UI and other features
- Set up Supabase later when ready

## Verify Connection

After updating your `.env` file, test the connection:

```bash
node check-supabase.js
```

You should see: `✅ Connection successful!`

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check `SUPABASE_SETUP.md` for detailed setup instructions

