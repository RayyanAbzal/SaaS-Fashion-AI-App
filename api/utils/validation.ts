import { z } from 'zod';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { AppError } from './errorHandler';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: VercelRequest, res: VercelResponse, next?: Function) => {
    try {
      // Validate body for POST/PUT requests
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        schema.parse(req.body);
      }
      // Validate query for GET requests
      else if (req.method === 'GET') {
        schema.parse(req.query);
      }
      
      if (next) next();
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      throw new AppError(400, 'Invalid request data');
    }
  };
};

// Common validation schemas
export const outfitRequestSchema = z.object({
  occasion: z.enum(['casual', 'professional', 'date', 'party']).optional(),
  weather: z.enum(['cold', 'mild', 'warm', 'hot']).optional(),
  userId: z.string().uuid().optional()
});

export const generateOutfitSchema = z.object({
  userId: z.string().uuid(),
  occasion: z.enum(['casual', 'professional', 'date', 'party']),
  weather: z.enum(['cold', 'mild', 'warm', 'hot']),
  count: z.number().int().min(1).max(50).optional().default(10),
  includePinterest: z.boolean().optional().default(false)
});

export const pinterestBoardSchema = z.object({
  boardUrl: z.string().url().refine(
    (url) => url.includes('pinterest.com'),
    { message: 'Must be a valid Pinterest board URL' }
  )
});

export const analyticsEventSchema = z.object({
  userId: z.string().uuid().optional(),
  event: z.string().min(1),
  properties: z.record(z.any()).optional()
});

