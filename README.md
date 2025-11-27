# 🎯 StyleMate - Your AI Fashion Bestie

> **The dopamine-driven React Native fashion app for Gen Z students with short attention spans**

StyleMate is a revolutionary fashion app designed specifically for college students who want instant outfit decisions, social validation, and addictive engagement patterns. Built with React Native, Expo, and Supabase, it delivers a TikTok-style experience for fashion discovery.

## ✨ **Key Features**

### 🚀 **Instant Gratification**
- **3-second load times** - No waiting screens
- **Quick Pick** - 3 outfit options in 2 seconds
- **Instant camera capture** with haptic feedback
- **Background AI processing** for seamless UX

### 🎨 **Gen Z UX Design**
- **Dark mode default** with glassmorphism effects
- **Gradient backgrounds** and smooth animations (60fps)
- **Haptic feedback** on every interaction
- **Swipe-based interactions** (TikTok-style)
- **Emoji reactions** and quick responses

### 🧠 **AI-Powered Intelligence**
- **Color theory matching** with neutral base pieces
- **Weather-aware suggestions** based on location
- **Occasion detection** (class, date, party, gym)
- **Confidence meters** for each outfit
- **Previous compliments tracking**

### 🏆 **Gamification & Social**
- **Daily streaks** and achievement badges
- **Style moments** (Stories-style sharing)
- **Social validation** through peer ratings
- **Limited-time challenges** and competitions
- **Voice notes** for outfit feedback

### Outfit Swiper
- **Unique Outfit Combinations**: Each outfit suggestion is unique and won't repeat
- **Swipe Interface**: Intuitive left/right swipe to like or dislike outfits
- **Duplicate Prevention**: Advanced system prevents showing the same outfit combination twice
- **Smart Filtering**: Filters out previously shown outfits based on item combinations
- **Continuous Suggestions**: Automatically fetches new suggestions when you run out
- **Liked Outfits Storage**: Automatically saves liked outfits to your wardrobe for future reference

### Outfits Tab
- **Tabbed Organization**: Separate sections for different types of outfits
  - **Liked from Swiper**: Outfits you've liked from the "What should I wear?" feature
  - **Created**: Manually created outfits
  - **AI Generated**: Outfits created by AI features
  - **Pinterest**: Outfits inspired by Pinterest boards
  - **All**: Combined view of all outfits
- **Outfit Reconstruction**: Reconstructs original outfit items from swipe history
- **Easy Management**: Remove outfits from your collection
- **Quick Access**: Direct navigation back to the outfit swiper
- **Persistent Storage**: Liked outfits are saved as actual Outfit objects in your wardrobe
- **Smart Filtering**: Each tab shows relevant outfits based on their source and type

## 🛠 **Tech Stack**

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: Supabase (Auth, Database, Storage) + Vercel (API)
- **AI**: OpenAI Vision API (clothing recognition)
- **Navigation**: React Navigation with smooth transitions
- **UI**: Linear gradients, glassmorphism, haptics
- **Animations**: React Native Reanimated
- **Deployment**: Vercel (Backend API)

## 🚀 **Quick Start**

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stylemate-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your Project URL and anon key from Settings → API
   - Create a `.env` file with your Supabase credentials (see Environment Variables below)
   - Run the SQL setup scripts from `SUPABASE_SETUP.md` to create database tables

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 📱 **App Structure**

See `ARCHITECTURE.md` for detailed architecture documentation.

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # Business logic & API services
├── contexts/           # React Context providers
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # App constants
└── config/             # Configuration files
```

## 📚 **Documentation**

- **Setup**: See `docs/SETUP.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`

## 🎯 **Core Screens**

### **StyleMate (Main)**
- TikTok-style swipe interface
- Instant outfit generation
- Quick Pick options
- Confidence meters
- Social stats display

### **Style Moments**
- Stories-style outfit sharing
- 24-hour expiration
- Emoji reactions (like, fire, cool, wow)
- Location tagging
- Social engagement

### **Wardrobe**
- Clothing item management
- AI-powered categorization
- Color analysis
- Weather compatibility
- Wear tracking

### **Profile**
- Achievement badges
- Style statistics
- Streak tracking
- Social validation metrics
- Settings & preferences

## 🎨 **Design System**

### **Color Palette**
- **Primary**: Hot Pink (#FF6B9D)
- **Secondary**: Mint Green (#4ECDC4)
- **Accent**: Electric Yellow (#FFD93D)
- **Background**: Pure Black (#0A0A0A)
- **Text**: Pure White (#FFFFFF)

### **Gradients**
- **Primary**: Pink to Mint
- **Sunset**: Orange to Purple
- **Ocean**: Blue to Green
- **Neon**: Yellow to Pink
- **Glass**: Transparent glassmorphism

### **Typography**
- **Headings**: Bold, large (24-36px)
- **Body**: Regular (14-18px)
- **Captions**: Light (12-14px)
- **Emojis**: Used extensively for Gen Z appeal

## 🧠 **AI Algorithm Factors**

### **Color Theory Matching**
- Neutral colors (black, white, gray, beige, navy)
- Complementary color combinations
- Monochromatic schemes
- Seasonal color palettes

### **Context Awareness**
- Weather/temperature integration
- Occasion detection (class, date, party, gym)
- Time of day considerations
- Campus culture and dress codes

### **Anti-Indecisiveness Features**
- "Quick Pick" - 3 outfit options in 2 seconds
- "Confidence Meter" for each outfit suggestion
- "Previous Compliments" tracking
- "Safe Choice" vs "Bold Choice" options

## 📊 **Performance Optimization**

- **Preload outfit suggestions**
- **Instant camera capture**
- **Background AI processing**
- **Cached color analysis**
- **Progressive image loading**
- **Optimized bundle size**

## 🔧 **Development**

### **Code Style**
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Component-based architecture

### **Testing**
```bash
# Run linter
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build:android
npm run build:ios
```

### **Environment Variables**
Create a `.env` file in the project root:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API Key (Optional - for AI features)
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key-here

# Weather API Key (Optional)
OPENWEATHER_API_KEY=your-weather-key-here
```

See `SUPABASE_SETUP.md` for detailed setup instructions.

## 🚀 **Deployment**

### **Expo Build**
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

### **App Store Deployment**
1. Configure app.json with proper metadata
2. Build production version
3. Submit to App Store/Play Store
4. Configure Firebase production environment

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Gen Z Research**: Understanding short attention spans and instant gratification needs
- **TikTok UX**: Inspiration for swipe-based interactions
- **Instagram Stories**: Reference for social sharing patterns
- **Supabase**: Backend infrastructure (Auth, Database, Storage)
- **Vercel**: Serverless API deployment
- **Expo**: Cross-platform development framework

## 📞 **Support**

For support, email support@stylemate.app or join our Discord community.

---

**Built with ❤️ for Gen Z fashion enthusiasts who can't decide what to wear**

## OpenAI Integration with Context Data

The app integrates real wardrobe and weather data into the OpenAI system prompt for intelligent outfit suggestions. Here's how it works:

### System Prompt Structure

The AI receives a comprehensive context including:

```typescript
// Weather Context
- Weather: 22°C, Cloudy (feels like 20°C)
- Weather recommendations: Light jacket weather, layers are your friend

// Wardrobe Context  
- Available items: 5 tops, 3 bottoms, 2 dresses, 4 shoes
- Sample items: Black T-shirt (black), Blue Jeans (blue), White Sneakers (white)

// Schedule Context
- Today's events: Presentation (class), Coffee with friends (other)

// User Preferences
- Style preferences: casual, comfy
- Favorite colors: black, white
- Confidence level: medium
```

### Example Usage

```typescript
import { generateOutfitSuggestionWithContext } from '@/services/openaiService';

const context = {
  currentWeather: {
    temperature: 22,
    condition: 'Cloudy',
    feelsLike: 20,
    humidity: 65,
    windSpeed: 8,
    description: 'scattered clouds',
    icon: '03d'
  },
  wardrobe: [
    { name: 'Black T-shirt', category: 'tops', color: 'black' },
    { name: 'Blue Jeans', category: 'bottoms', color: 'blue' },
    // ... more items
  ],
  userSchedule: [
    { title: 'Presentation', type: 'class', startTime: new Date() }
  ]
};

const suggestion = await generateOutfitSuggestionWithContext(
  "I need an outfit for my presentation today", 
  context
);
```

### API Keys Setup

1. **OpenWeatherMap API**: `dea5bf614a1c5eee965149b436f21b39` (configured in `app.json`)
2. **OpenAI API**: Add your key to `app.json` under `extra.openaiApiKey`

## Getting Started

1. Install dependencies: `npm install`
2. Configure Supabase (see `SUPABASE_SETUP.md` for detailed instructions):
   - Create a Supabase project
   - Run the SQL scripts to create database tables
   - Create storage buckets for images
3. Create a `.env` file with your Supabase credentials
4. (Optional) Add your OpenAI API key to `.env` for AI features
5. Run: `npx expo start -c`

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: OpenAI GPT-3.5-turbo
- **Weather**: OpenWeatherMap API
- **UI**: React Native Linear Gradient, Expo Vector Icons 

## 🔧 **Environment Setup**

1. **Create a `.env` file** in the root directory:
```bash
# Supabase Configuration (Required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI API Key (Optional - for AI features)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Weather API Key (Optional)
OPENWEATHER_API_KEY=your_weather_api_key_here
```

2. **Getting the API Keys:**

   - **Supabase Configuration** (Required):
     1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
     2. Create a new project or select existing one
     3. Go to Settings → API
     4. Copy the Project URL and anon public key
     5. See `SUPABASE_SETUP.md` for database setup instructions

   - **OpenAI API Key** (Optional):
     1. Go to [OpenAI's platform](https://platform.openai.com/)
     2. Create an account or sign in
     3. Navigate to API Keys section
     4. Create a new secret key

   - **Weather API Key** (Optional):
     1. Go to [OpenWeatherMap](https://openweathermap.org/api)
     2. Sign up for a free account
     3. Navigate to API Keys section
     4. Copy your API key

3. **Security Notes**:
   - Never commit the `.env` file to version control (it's in `.gitignore`)
   - Keep your API keys secure and rotate them regularly
   - Use appropriate API key restrictions in your provider dashboards
   - Monitor API usage for any suspicious activity 