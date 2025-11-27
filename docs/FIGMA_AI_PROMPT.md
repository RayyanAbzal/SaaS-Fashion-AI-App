# 🎨 Figma AI Prompt - Complete Codebase Context

Use this prompt in Figma AI to provide complete context about the codebase:

---

## Project Overview

**Repository**: https://github.com/RayyanAbzal/SaaS-Fashion-AI-App

**Tech Stack**:
- React Native + Expo (TypeScript)
- Supabase (Auth, Database, Storage)
- Vercel (Backend API)
- OpenAI (AI features)
- React Navigation

**App Type**: Fashion AI app for Gen Z - TikTok-style swipe interface for outfit suggestions

---

## Key Screens & Components

### Main Screens:
1. **HomeScreen** - Dashboard with quick actions
2. **StyleSwipeScreen** - Main AI Stylist with swipe interface
3. **WardrobeScreen** - Clothing item management
4. **ProfileScreen** - User profile and settings
5. **CameraScreen** - Photo capture for wardrobe items
6. **OutfitCreationScreen** - Manual outfit creation
7. **StyleCheckScreen** - AI style analysis
8. **PinterestStyleScreen** - Pinterest board analysis (optional feature)
9. **ShoppingAssistantScreen** - Product discovery
10. **AvatarSetupScreen** - Avatar creation
11. **AvatarViewScreen** - Avatar viewing
12. **BrandSelectionScreen** - Brand preferences
13. **AchievementsScreen** - Gamification

### Key Features:
- Swipe-based outfit suggestions (TikTok-style)
- AI-powered color matching
- Weather-aware suggestions
- Pinterest integration (optional)
- Social sharing capabilities
- Achievement system
- Virtual try-on features

---

## Design System (Current)

### Colors:
- Primary: Hot Pink (#FF6B9D)
- Secondary: Mint Green (#4ECDC4)
- Accent: Electric Yellow (#FFD93D)
- Background: Pure Black (#0A0A0A)
- Text: Pure White (#FFFFFF)

### UI Patterns:
- Dark mode default
- Glassmorphism effects
- Gradient backgrounds
- Haptic feedback
- Swipe gestures
- Smooth animations (60fps)

---

## Navigation Structure

```
App
├── AuthScreen (if not logged in)
└── MainTabs (if logged in)
    ├── Home
    ├── Wardrobe
    └── Profile
    └── Stack Screens:
        ├── Camera (modal)
        ├── OutfitCreation (modal)
        ├── BrandSelection (modal)
        ├── StyleSwipe
        ├── StyleCheck
        ├── PinterestStyle
        ├── PinterestBoard
        ├── AvatarSetup
        ├── AvatarView
        ├── ShoppingAssistant
        └── Achievements
```

---

## Code Structure

```
src/
├── components/          # Reusable UI components
│   ├── PinterestBoardAnalyzer.tsx
│   └── StyleSwipeCard.tsx
├── constants/          # Colors, gradients, themes
│   └── colors.ts
├── contexts/          # React contexts
│   ├── UserContext.tsx
│   └── AvatarContext.tsx
├── screens/           # All app screens
├── services/          # API & business logic
│   ├── authService.ts (Supabase)
│   ├── wardrobeService.ts
│   ├── oracleService.ts (outfit generation)
│   ├── pinterestBoardService.ts
│   └── supabase.ts
├── types/             # TypeScript interfaces
└── utils/             # Helper functions
```

---

## User Flow

1. **Onboarding**: Sign up → Profile setup → Brand selection
2. **Daily Use**: Home → Style Swipe → Get suggestions → Save favorites
3. **Wardrobe Management**: Add items via camera → Organize by category
4. **Style Analysis**: Upload outfit photo → Get AI feedback
5. **Pinterest Integration** (optional): Link board → Get style insights

---

## Key Interactions

- **Swipe Left/Right**: Like/dislike outfits
- **Tap**: View outfit details
- **Long Press**: Quick actions
- **Pull to Refresh**: Load new suggestions
- **Swipe Down**: Dismiss modals

---

## Design Requirements

1. **All screens must have back buttons** (already implemented)
2. **Dark mode first** - Pure black backgrounds
3. **Glassmorphism** - Frosted glass effects on cards
4. **Gradients** - Pink to mint, sunset, ocean themes
5. **Haptic feedback** - On all interactions
6. **Smooth animations** - 60fps transitions
7. **Gen Z appeal** - Emojis, bold typography, instant gratification

---

## Current Issues Fixed

✅ Supabase migration complete
✅ Network error handling
✅ Back buttons on all screens
✅ Pinterest integration (optional)
✅ Vercel deployment

---

## Design Inspiration

- TikTok: Swipe interface, instant feedback
- Instagram Stories: Social sharing patterns
- Pinterest: Board-based organization
- Gen Z aesthetics: Bold, colorful, playful

---

Use this context when designing the UI/UX in Figma AI. The design should match the codebase structure and support all the features mentioned above.

