# Fashion Styling App

A React Native fashion styling app for college students built with Expo, TypeScript, and Firebase.

## Features

- **Authentication**: Secure user registration and login with Firebase Auth
- **Wardrobe Management**: Add, organize, and categorize clothing items
- **Outfit Creation**: Create and save complete outfits
- **Camera Integration**: Take photos of clothing items and outfits
- **Search & Filter**: Find items and outfits quickly with advanced filtering
- **User Profiles**: Manage preferences and personal information
- **Cross-Platform**: Works on both iOS and Android

## Tech Stack

- **React Native** with Expo (managed workflow)
- **TypeScript** for type safety
- **Firebase** for backend services (Auth, Firestore, Storage)
- **React Navigation** for screen navigation
- **Expo Camera** for photo capture
- **AsyncStorage** for local data persistence

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fashion-styling-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Enable Storage
   - Get your Firebase configuration and update `src/services/firebase.ts`

4. **Configure Firebase**
   ```typescript
   // src/services/firebase.ts
   const firebaseConfig: FirebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

6. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/           # App constants (colors, themes)
├── screens/            # Screen components
│   ├── LoginScreen.tsx
│   ├── CameraScreen.tsx
│   ├── WardrobeScreen.tsx
│   ├── OutfitScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # API and external services
│   ├── firebase.ts
│   └── authService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions
    └── validation.ts
```

## Key Features Implementation

### Authentication
- Firebase Authentication with email/password
- User profile management
- Secure session handling

### Camera & Image Handling
- Photo capture with Expo Camera
- Image picker from gallery
- Image compression and optimization

### Data Management
- Firestore for wardrobe items and outfits
- Real-time data synchronization
- Offline support with AsyncStorage

### Navigation
- Bottom tab navigation for main screens
- Stack navigation for authentication flow
- Type-safe navigation with TypeScript

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Setup

### iOS Development
1. Install Xcode from the App Store
2. Install iOS Simulator
3. Run `npm run ios`

### Android Development
1. Install Android Studio
2. Set up Android SDK and emulator
3. Run `npm run android`

## Firebase Security Rules

Make sure to set up proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/wardrobe/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/outfits/{outfitId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@fashionstylingapp.com or create an issue in the repository.

## Roadmap

- [ ] AI-powered outfit recommendations
- [ ] Social features (share outfits)
- [ ] Weather integration
- [ ] Shopping recommendations
- [ ] Outfit calendar
- [ ] Style analytics
- [ ] Push notifications
- [ ] Dark mode support 