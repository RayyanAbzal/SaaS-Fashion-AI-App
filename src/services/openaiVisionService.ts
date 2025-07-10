import { fileToBase64 } from '@/utils/fileUtils';

export interface VisionAnalysis {
  category: 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'outerwear';
  subcategory: string;
  color: string;
  style: string;
  brand?: string;
  season?: string;
  tags: string[];
  confidence: number;
  description: string;
  isValidClothing: boolean;
}

export interface VisionResponse {
  analysis: VisionAnalysis;
  processingTime: number;
}

class OpenAIVisionService {
  private static instance: OpenAIVisionService;
  private apiKey: string;

  // New Zealand clothing brands
  private nzBrands = [
    'Hallensteins', 'Glassons', 'Country Road', 'Witchery', 'Portmans', 
    'Trenery', 'Mimco', 'Seed Heritage', 'Cotton On', 'Supre',
    'Just Jeans', 'Jacqui E', 'Sussan', 'Forever New', 'Valleygirl',
    'Dotti', 'Pumpkin Patch', 'Max', 'Postie Plus', 'The Warehouse',
    'Kmart NZ', 'Farmers', 'Briscoes', 'Noel Leeming', 'Harvey Norman',
    'Kathmandu', 'Macpac', 'Icebreaker', 'Untouched World', 'Karen Walker',
    'Zambesi', 'World', 'Stolen Girlfriends Club', 'Huffer', 'Asuwere',
    'Maggie Marilyn', 'Deadly Ponies', 'Kate Sylvester', 'Trelise Cooper',
    'Annah Stretton', 'Carla Zampatti', 'Aje', 'Camilla and Marc'
  ];

  private constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
  }

  static getInstance(): OpenAIVisionService {
    if (!OpenAIVisionService.instance) {
      OpenAIVisionService.instance = new OpenAIVisionService();
    }
    return OpenAIVisionService.instance;
  }

  async analyzeClothingImage(imageUrl: string): Promise<VisionResponse> {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured.');
    }

    try {
      const base64Image = await fileToBase64(imageUrl);
      const dataUri = `data:image/jpeg;base64,${base64Image}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze the provided image for a fashion app. Your primary goal is to identify a single, clear clothing item.

**CRITICAL VALIDATION:**
1.  Examine the image to determine if it contains a recognizable piece of clothing or accessory (like a shirt, pants, dress, shoes, hat, or bag).
2.  If the image is NOT a clothing item (e.g., it's a landscape, a car, an animal, a blurry photo, abstract art), you MUST return a JSON object with only one field: \`{"isValidClothing": false}\`. Do not provide any other fields.
3.  If a clothing item is present but is not the main focus (e.g., a person wearing clothes in a busy scene), try to isolate the most prominent clothing item for analysis. If no single item can be clearly identified, return \`{"isValidClothing": false}\`.

**CLOTHING ANALYSIS (Only if 'isValidClothing' is true):**
If you've confirmed the image contains a valid clothing item, provide a detailed analysis in a JSON object. Be concise, accurate, and use a tone suitable for a Gen Z college student in New Zealand.

**Required JSON Structure:**
{
  "isValidClothing": true,
  "category": "'tops', 'bottoms', 'shoes', 'accessories', or 'outerwear'",
  "subcategory": "A specific subcategory, e.g., 't-shirt', 'jeans', 'sneakers', 'handbag'",
  "color": "The dominant color of the item",
  "style": "A few descriptive keywords (e.g., 'vintage, casual, graphic-tee')",
  "brand": "Identify the brand from the logo if clearly visible, otherwise use 'unknown'",
  "season": "Suggest the best season(s): 'Summer', 'Winter', 'Autumn', 'Spring', or 'All-Season'",
  "tags": ["Provide 5-7 relevant tags for searching, like 'denim', 'high-waisted', 'streetwear', '90s-fashion'"],
  "description": "A brief, one-sentence description for the user's wardrobe.",
  "confidence": "A score from 0.0 to 1.0 on your confidence in this analysis."
}

**IMPORTANT CONTEXT:**
-   **Audience**: Gen Z in New Zealand.
-   **Local Brands**: Be aware of NZ brands like Hallensteins, Glassons, ASOS, Karen Walker, Zambesi, World, Icebreaker, Kathmandu, alongside global brands like Nike, Adidas, and Zara.
-   **Segmentation Focus**: Your description and analysis should focus *only* on the clothing item, effectively segmenting it from the background and any person wearing it. For example, if it's a person wearing a hoodie, describe the hoodie, not the person.

**EXAMPLE (VALID CLOTHING):**
-   **Input:** Image of a person wearing a black leather jacket.
-   **Output:** \`{ "isValidClothing": true, "category": "outerwear", "subcategory": "leather jacket", "color": "black", "style": "edgy, biker, classic", "brand": "unknown", "season": "All-Season", "tags": ["leather jacket", "biker jacket", "outerwear", "black jacket", "moto"], "description": "A classic black leather biker jacket.", "confidence": 0.98 }\`

**EXAMPLE (INVALID ITEM):**
-   **Input:** Image of a dog on a beach.
-   **Output:** \`{ "isValidClothing": false }\`

Proceed with your analysis of the image provided.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUri,
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.error('Invalid OpenAI response structure:', data);
        throw new Error('Invalid response from OpenAI API - no content found');
      }
      
      // Try to parse the content as JSON
      let analysis: VisionAnalysis;
      try {
        // Handle markdown-wrapped JSON responses
        let jsonContent = content.trim();
        
        // Remove markdown code blocks if present
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        analysis = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', content);
        console.error('Parse error:', parseError);
        
        // Check if the content indicates it's not clothing
        if (content.toLowerCase().includes('not a clothing') || 
            content.toLowerCase().includes('no clothing') ||
            content.toLowerCase().includes('isvalidclothing: false')) {
          throw new Error('The image does not appear to contain a recognizable clothing item. Please try a different photo.');
        }
        
        throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }
      
      if (analysis.isValidClothing === false) {
        throw new Error('The image does not appear to contain a recognizable clothing item. Please try a different photo.');
      }
      
      return {
        analysis,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error analyzing image with OpenAI:', error);
      
      if (error instanceof Error && error.message.includes('clothing item')) {
        throw error;
      }
      
      throw new Error('Failed to analyze image. Please try again later.');
    }
  }

  async extractColors(imageUrl: string): Promise<string[]> {
    try {
      // In production, this would use a color extraction library or API
      // For now, return common colors based on the analysis
      const analysis = await this.analyzeClothingImage(imageUrl);
      const baseColor = analysis.analysis.color;
      
      // Generate complementary colors
      const colorMap: { [key: string]: string[] } = {
        'white': ['white', 'black', 'gray'],
        'black': ['black', 'white', 'gray'],
        'blue': ['blue', 'white', 'navy'],
        'red': ['red', 'white', 'black'],
        'green': ['green', 'white', 'brown'],
        'yellow': ['yellow', 'white', 'black'],
        'pink': ['pink', 'white', 'black'],
        'purple': ['purple', 'white', 'black'],
        'orange': ['orange', 'white', 'black'],
        'brown': ['brown', 'white', 'beige']
      };

      return colorMap[baseColor] || [baseColor, 'white', 'black'];
    } catch (error) {
      console.error('Error extracting colors:', error);
      return ['white', 'black', 'gray'];
    }
  }

  async suggestTags(imageUrl: string): Promise<string[]> {
    try {
      const analysis = await this.analyzeClothingImage(imageUrl);
      return analysis.analysis.tags;
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return ['casual', 'versatile'];
    }
  }

  getNZBrands(): string[] {
    return this.nzBrands;
  }
}

export default OpenAIVisionService; 