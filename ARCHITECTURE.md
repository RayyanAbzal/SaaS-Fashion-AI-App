# Software Architecture

## 📁 Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/          # Generic components (Button, etc.)
│   ├── outfit/          # Outfit-related components
│   └── wardrobe/        # Wardrobe-related components
│
├── screens/             # Screen components (one per route)
│   ├── auth/            # Authentication screens
│   ├── main/            # Main app screens
│   └── modals/          # Modal screens
│
├── services/            # Business logic & API services
│   ├── api/             # External API integrations
│   ├── data/            # Database services (Supabase)
│   ├── ai/              # AI/ML services
│   └── core/            # Core business logic
│
├── contexts/            # React Context providers
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # App constants (colors, config)
└── config/              # Configuration files
```

## 🏗️ Service Organization

### API Services (`services/api/`)
- `openaiService.ts` - OpenAI API integration
- `openaiVisionService.ts` - OpenAI Vision API
- `weatherService.ts` - Weather API integration
- `countryRoadService.ts` - Country Road API

### Data Services (`services/data/`)
- `supabase.ts` - Supabase client
- `supabaseService.ts` - Supabase database operations
- `supabaseStorageService.ts` - Supabase storage operations
- `authService.ts` - Authentication service
- `wardrobeService.ts` - Wardrobe data operations
- `gamificationService.ts` - Gamification data
- `perfumeService.ts` - Perfume collection data

### AI Services (`services/ai/`)
- `oracleService.ts` - Main outfit generation service
- `smartOutfitGenerator.ts` - Smart outfit generation
- `outfitGenerator.ts` - Basic outfit generation
- `styleAdviceService.ts` - Style analysis & advice
- `styleService.ts` - Style scoring & analysis
- `pinterestBoardService.ts` - Pinterest analysis
- `pinterestService.ts` - Pinterest integration

### Core Services (`services/core/`)
- `outfitCreationService.ts` - Outfit creation logic
- `varietyService.ts` - Variety & freshness algorithms
- `retailerService.ts` - Retailer product management
- `achievementService.ts` - Achievement system
- `avatarService.ts` - Avatar management
- `hybridVirtualTryOnService.ts` - Virtual try-on
- `enhancedOracleService.ts` - Enhanced outfit features

## 📱 Screen Organization

### Auth Screens
- `AuthScreen.tsx` - Login/Signup

### Main Screens
- `HomeScreen.tsx` - Main dashboard
- `StyleSwipeScreen.tsx` - Outfit swiping interface
- `WardrobeScreen.tsx` - Wardrobe management
- `ProfileScreen.tsx` - User profile
- `StyleCheckScreen.tsx` - Style analysis

### Feature Screens
- `PinterestBoardScreen.tsx` - Pinterest board analysis
- `PinterestStyleScreen.tsx` - Pinterest style insights
- `ShoppingAssistantScreen.tsx` - Shopping recommendations
- `AchievementsScreen.tsx` - User achievements

### Modal Screens
- `CameraScreen.tsx` - Camera/photo capture
- `OutfitCreationScreen.tsx` - Outfit creation
- `BrandSelectionScreen.tsx` - Brand preferences
- `AvatarSetupScreen.tsx` - Avatar setup
- `AvatarViewScreen.tsx` - Avatar preview

## 🧩 Component Organization

### Common Components
- `Button.tsx` - Reusable button component
- `MessageBubble.tsx` - Chat message component

### Outfit Components
- `StyleSwipeCard.tsx` - Swipeable outfit card
- `OutfitDisplay.tsx` - Outfit display component
- `PerfumeRecommendationCard.tsx` - Perfume recommendation

### Wardrobe Components
- `WardrobeItemForm.tsx` - Wardrobe item form
- `TwoDAvatarPreview.tsx` - Avatar preview
- `PinterestBoardAnalyzer.tsx` - Pinterest analyzer
- `AchievementBadge.tsx` - Achievement badge

## 🔄 Data Flow

1. **User Action** → Screen Component
2. **Screen** → Service Layer
3. **Service** → API/Data Layer
4. **Response** → Service → Screen → UI Update

## 🎯 Design Principles

1. **Separation of Concerns**: Screens handle UI, Services handle logic
2. **Single Responsibility**: Each service has one clear purpose
3. **Dependency Injection**: Services are imported, not instantiated
4. **Type Safety**: Full TypeScript coverage
5. **Reusability**: Components and services are reusable

## 📦 Key Dependencies

- **React Native** - Mobile framework
- **Supabase** - Backend (Auth, Database, Storage)
- **OpenAI** - AI/ML capabilities
- **Expo** - Development platform
- **React Navigation** - Navigation

