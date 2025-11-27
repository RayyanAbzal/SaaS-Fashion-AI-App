import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, errorHandler } from '../../utils/errorHandler';
import { handleCORS } from '../../utils/cors';
import { rateLimitMiddleware } from '../../middleware/rateLimit';
import { performanceMiddleware } from '../../middleware/performance';
import { analyticsEventSchema, validateRequest } from '../../utils/validation';
import { optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  // Handle CORS
  if (!handleCORS(req, res)) return;

  // Performance tracking
  performanceMiddleware(req, res);

  // Rate limiting (stricter for analytics)
  const rateLimitPassed = await rateLimitMiddleware(req, res);
  if (!rateLimitPassed) return;

  // Optional authentication
  await optionalAuth(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    // Validate request
    validateRequest(analyticsEventSchema)(req, res);

    const { userId, event, properties } = req.body;

    // Use authenticated user ID if available, otherwise use provided userId
    const finalUserId = req.user?.id || userId;

    if (!supabase) {
      // If Supabase not configured, just log the event
      console.log('Analytics event:', { userId: finalUserId, event, properties });
      return res.status(200).json({ 
        success: true,
        message: 'Event logged (Supabase not configured)'
      });
    }

    // Insert analytics event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: finalUserId || null,
        event_name: event,
        properties: properties || {},
        session_id: req.headers['x-session-id'] as string || null,
        ip_address: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || null,
        user_agent: req.headers['user-agent'] || null
      });

    if (error) {
      console.error('Error inserting analytics event:', error);
      // Don't fail the request if analytics fails
      return res.status(200).json({ 
        success: true,
        message: 'Event logged (database error ignored)'
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

export default asyncHandler(handler);

