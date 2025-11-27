import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errorHandler';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

export const authenticateRequest = async (
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<boolean> => {
  // Skip auth in development if no token provided
  if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
    console.warn('⚠️  Skipping authentication in development mode');
    return true;
  }

  if (!supabase) {
    console.warn('⚠️  Supabase not configured. Skipping authentication.');
    return true;
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ 
      success: false,
      error: 'Unauthorized',
      message: 'No authentication token provided'
    });
    return false;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ 
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed'
      });
      return false;
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...user
    };

    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      success: false,
      error: 'Authentication failed',
      message: 'Could not verify authentication token'
    });
    return false;
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<boolean> => {
  // Try to authenticate, but don't fail if no token
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !supabase) {
    return true; // Continue without auth
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        ...user
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    console.warn('Optional auth failed:', error);
  }

  return true;
};

