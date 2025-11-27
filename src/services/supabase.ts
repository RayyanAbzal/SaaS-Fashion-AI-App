import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suppress network errors from Supabase's internal retry mechanism
// This catches errors at multiple levels: ErrorUtils, console.error, and React Native's error handler
if (typeof ErrorUtils !== 'undefined' && ErrorUtils.getGlobalHandler) {
  try {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      // Suppress Supabase network retry errors
      const errorMessage = error?.message || '';
      const errorName = error?.name || '';
      
      if (
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('AuthRetryableFetchError') ||
        (errorName === 'TypeError' && errorMessage.includes('Network request failed'))
      ) {
        // Silently ignore - these are non-critical retry errors from Supabase
        return;
      }
      // Call original handler for other errors
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  } catch (e) {
    // ErrorUtils might not be available in all environments
  }
}

// Get Supabase config from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) ||
                    '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                        (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
                        '';

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseUrl !== '' && 
         supabaseUrl !== 'EXPO_PUBLIC_SUPABASE_URL' &&
         supabaseUrl !== 'https://placeholder.supabase.co' && 
         supabaseAnonKey && 
         supabaseAnonKey !== '' &&
         supabaseAnonKey !== 'EXPO_PUBLIC_SUPABASE_ANON_KEY' &&
         supabaseAnonKey !== 'placeholder-key';
};

// Create Supabase client only if configured, otherwise create a mock client
let supabase: ReturnType<typeof createClient>;

if (isSupabaseConfigured()) {
  // Create Supabase client with optimized configuration for reliability
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'stylemate-app',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
  console.log('🔵 Supabase initialized: ✅ Configured');
} else {
  // Create a mock client that won't make network requests
  console.warn('⚠️ Supabase not configured - using mock client');
  console.warn('📝 To configure Supabase:');
  console.warn('   1. Create a .env file in the project root');
  console.warn('   2. Add: EXPO_PUBLIC_SUPABASE_URL=your-url');
  console.warn('   3. Add: EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key');
  console.warn('   4. Restart Expo with: npx expo start -c');
  console.warn('   See SUPABASE_SETUP.md for detailed instructions');
  
  // Create a minimal client that will fail gracefully
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };

