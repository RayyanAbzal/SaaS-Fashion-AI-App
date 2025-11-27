# Setup Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```bash
   # Supabase
   EXPO_PUBLIC_SUPABASE_URL="your-supabase-url"
   EXPO_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   
   # OpenAI (optional)
   EXPO_PUBLIC_OPENAI_API_KEY="your-openai-key"
   
   # OpenWeather (optional)
   OPENWEATHER_API_KEY="your-weather-api-key"
   ```

3. **Run database migrations**
   - Open Supabase SQL Editor
   - Run `api/database/migrations.sql`

4. **Start the app**
   ```bash
   npm start
   ```

## Supabase Setup

See `SUPABASE_SETUP.md` for detailed Supabase configuration.

## Backend API

The backend API is deployed on Vercel. See `QUICK_START_BACKEND.md` for API setup.

## Troubleshooting

See `TROUBLESHOOTING.md` for common issues and fixes.

