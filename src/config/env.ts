import Constants from 'expo-constants';

interface Env {
  OPENWEATHER_API_KEY: string;
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export const env: Env = {
  OPENWEATHER_API_KEY: 'dea5bf614a1c5eee965149b436f21b39',
  OPENAI_API_KEY: Constants.expoConfig?.extra?.openaiApiKey || '',
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || '',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || '',
};

interface EnvConfig {
  openaiApiKey: string;
  supabaseConfig: {
    url: string;
    anonKey: string;
  };
  weatherApiKey: string;
}

// Get environment variables from Expo's extra config
const extra = Constants.expoConfig?.extra;

if (!extra) {
  throw new Error('Missing environment configuration. Please check app.json or app.config.js');
}

// Validate required environment variables
const requiredVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(key => !extra[key]);
if (missingVars.length > 0) {
  console.warn(`Missing environment variables: ${missingVars.join(', ')}. Some features may not work.`);
}

// Export typed configuration
export const config: EnvConfig = {
  openaiApiKey: extra.OPENAI_API_KEY,
  supabaseConfig: {
    url: extra.SUPABASE_URL,
    anonKey: extra.SUPABASE_ANON_KEY,
  },
  weatherApiKey: extra.WEATHER_API_KEY,
};

// Helper function to mask sensitive values for logging
export const getMaskedConfig = (): Record<string, any> => {
  return {
    openaiApiKey: maskString(config.openaiApiKey),
    supabaseConfig: {
      url: config.supabaseConfig.url,
      anonKey: maskString(config.supabaseConfig.anonKey),
    },
    weatherApiKey: maskString(config.weatherApiKey),
  };
};

// Utility to mask sensitive strings
const maskString = (str: string): string => {
  if (!str) return '';
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}; 