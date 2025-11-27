# 🔧 Quick Fix: Network Request Failed Errors

## Problem
The app is showing "Network request failed" errors because Supabase is not configured.

## Solution

### Option 1: Configure Supabase (Recommended)

1. **Create a `.env` file** in the project root:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Get your Supabase credentials:**
   - Go to [supabase.com](https://supabase.com)
   - Create a project (or use existing)
   - Go to Settings → API
   - Copy the "Project URL" and "anon public" key

3. **Restart Expo:**
```bash
npx expo start -c
```

### Option 2: Test Without Supabase (Temporary)

The app has been updated to handle missing Supabase configuration gracefully. You can:
- View the UI (but can't sign in/sign up)
- Browse screens
- Test other features that don't require authentication

**Note:** Authentication features won't work without Supabase configured.

## What Was Fixed

✅ Updated `src/services/supabase.ts` to check configuration before making requests
✅ Updated `src/services/authService.ts` to handle missing Supabase gracefully
✅ Added helpful console warnings when Supabase is not configured

## Next Steps

1. Set up Supabase (see `SUPABASE_SETUP.md` for detailed instructions)
2. Add your credentials to `.env` file
3. Restart the app

The network errors should stop once Supabase is configured!

