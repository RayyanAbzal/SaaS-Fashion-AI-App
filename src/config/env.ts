import Constants from 'expo-constants';

interface Env {
  OPENWEATHER_API_KEY: string;
  OPENAI_API_KEY: string;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
}

export const env: Env = {
  OPENWEATHER_API_KEY: Constants.expoConfig?.extra?.openWeatherApiKey || '',
  OPENAI_API_KEY: Constants.expoConfig?.extra?.openaiApiKey || '',
  FIREBASE_API_KEY: Constants.expoConfig?.extra?.firebaseApiKey || '',
  FIREBASE_AUTH_DOMAIN: Constants.expoConfig?.extra?.firebaseAuthDomain || '',
  FIREBASE_PROJECT_ID: Constants.expoConfig?.extra?.firebaseProjectId || '',
  FIREBASE_STORAGE_BUCKET: Constants.expoConfig?.extra?.firebaseStorageBucket || '',
  FIREBASE_MESSAGING_SENDER_ID: Constants.expoConfig?.extra?.firebaseMessagingSenderId || '',
  FIREBASE_APP_ID: Constants.expoConfig?.extra?.firebaseAppId || '',
};

interface EnvConfig {
  openaiApiKey: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
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
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'WEATHER_API_KEY',
];

const missingVars = requiredVars.filter(key => !extra[key]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Export typed configuration
export const config: EnvConfig = {
  openaiApiKey: extra.OPENAI_API_KEY,
  firebaseConfig: {
    apiKey: extra.FIREBASE_API_KEY,
    authDomain: extra.FIREBASE_AUTH_DOMAIN,
    projectId: extra.FIREBASE_PROJECT_ID,
    storageBucket: extra.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
    appId: extra.FIREBASE_APP_ID,
  },
  weatherApiKey: extra.WEATHER_API_KEY,
};

// Helper function to mask sensitive values for logging
export const getMaskedConfig = (): Record<string, any> => {
  return {
    openaiApiKey: maskString(config.openaiApiKey),
    firebaseConfig: {
      ...config.firebaseConfig,
      apiKey: maskString(config.firebaseConfig.apiKey),
    },
    weatherApiKey: maskString(config.weatherApiKey),
  };
};

// Utility to mask sensitive strings
const maskString = (str: string): string => {
  if (!str) return '';
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}; 