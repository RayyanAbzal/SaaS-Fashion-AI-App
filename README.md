# 🎯 StyleMate - Your AI Fashion Bestie

> **The dopamine-driven React Native fashion app for Gen Z students with short attention spans**

StyleMate is a revolutionary fashion app designed specifically for college students who want instant outfit decisions, social validation, and addictive engagement patterns. Built with React Native, Expo, and Firebase, it delivers a TikTok-style experience for fashion discovery.

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

## 🛠 **Tech Stack**

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: OpenAI Vision API (clothing recognition)
- **Navigation**: React Navigation with smooth transitions
- **UI**: Linear gradients, glassmorphism, haptics
- **Animations**: React Native Reanimated

## 🚀 **Quick Start**

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator
- Firebase project setup

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

3. **Configure Firebase**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Update `src/services/firebase.ts` with your config

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

```
src/
├── components/          # Reusable UI components
├── constants/          # Colors, gradients, themes
├── screens/           # Main app screens
│   ├── StyleMateScreen.tsx    # Main swipe interface
│   ├── StyleMomentsScreen.tsx # Stories-style sharing
│   ├── WardrobeScreen.tsx     # Clothing management
│   ├── ProfileScreen.tsx      # User profile & stats
│   └── LoginScreen.tsx        # Authentication
├── services/          # Firebase & API services
├── types/            # TypeScript interfaces
└── utils/            # Helper functions
```

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
Create a `.env` file:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

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
- **Firebase**: Backend infrastructure and real-time capabilities
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
2. Configure Firebase in `src/services/firebase.ts`
3. Add your OpenAI API key to `app.json`
4. Run: `npx expo start`

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: OpenAI GPT-3.5-turbo
- **Weather**: OpenWeatherMap API
- **UI**: React Native Linear Gradient, Expo Vector Icons 