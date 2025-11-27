import { VercelRequest, VercelResponse } from '@vercel/node';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:19006',
  'http://localhost:8081',
  process.env.EXPO_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter(Boolean) as string[];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be set dynamically
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
  'Access-Control-Max-Age': '86400',
};

export const handleCORS = (req: VercelRequest, res: VercelResponse): boolean => {
  const origin = req.headers.origin;

  // Set CORS headers
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\//, '')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  Object.entries(corsHeaders).forEach(([key, value]) => {
    if (key !== 'Access-Control-Allow-Origin') {
      res.setHeader(key, value);
    }
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // Don't continue processing
  }

  return true; // Continue processing
};

