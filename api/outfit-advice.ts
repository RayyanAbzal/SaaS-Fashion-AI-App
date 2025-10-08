import { VercelRequest, VercelResponse } from '@vercel/node';

interface OutfitAdvice {
  id: string;
  title: string;
  description: string;
  occasion: string;
  weather: string;
  tips: string[];
  items: string[];
}

const outfitAdvice: OutfitAdvice[] = [
  {
    id: 'work-casual',
    title: 'Smart Casual for Work',
    description: 'Perfect for casual Fridays or creative workplaces',
    occasion: 'work',
    weather: 'mild',
    tips: [
      'Pair a blazer with dark jeans',
      'Add a statement accessory',
      'Keep shoes polished and comfortable'
    ],
    items: ['Blazer', 'Dark Jeans', 'Button-up Shirt', 'Loafers']
  },
  {
    id: 'date-night',
    title: 'Date Night Elegance',
    description: 'Sophisticated yet approachable for evening dates',
    occasion: 'date',
    weather: 'warm',
    tips: [
      'Choose one statement piece',
      'Keep accessories minimal',
      'Ensure comfort for walking'
    ],
    items: ['Midi Dress', 'Blazer', 'Heels', 'Clutch']
  },
  {
    id: 'weekend-casual',
    title: 'Weekend Comfort',
    description: 'Relaxed and comfortable for weekend activities',
    occasion: 'casual',
    weather: 'mild',
    tips: [
      'Layer for changing temperatures',
      'Choose comfortable shoes',
      'Add a pop of color'
    ],
    items: ['Sweater', 'Jeans', 'Sneakers', 'Crossbody Bag']
  },
  {
    id: 'party-ready',
    title: 'Party Perfect',
    description: 'Stand out at social events and parties',
    occasion: 'party',
    weather: 'warm',
    tips: [
      'Choose bold colors or patterns',
      'Add statement jewelry',
      'Consider the venue dress code'
    ],
    items: ['Statement Top', 'Tailored Pants', 'Heels', 'Bold Accessories']
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { occasion, weather } = req.query;
    
    let filteredAdvice = [...outfitAdvice];
    
    // Filter by occasion
    if (occasion) {
      filteredAdvice = filteredAdvice.filter(advice => 
        advice.occasion === occasion
      );
    }
    
    // Filter by weather
    if (weather) {
      filteredAdvice = filteredAdvice.filter(advice => 
        advice.weather === weather
      );
    }
    
    console.log(`Returning ${filteredAdvice.length} outfit advice items`);
    
    res.status(200).json({
      success: true,
      advice: filteredAdvice,
      count: filteredAdvice.length,
      filters: {
        occasion,
        weather
      }
    });

  } catch (error) {
    console.error('Error fetching outfit advice:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch outfit advice' 
    });
  }
}
