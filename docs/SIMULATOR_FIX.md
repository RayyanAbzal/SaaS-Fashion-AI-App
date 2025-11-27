# iOS Simulator Connection Fix

## Issue
Simulator is timing out when trying to connect to Metro bundler.

## Solutions

### Option 1: Open Expo Go Manually (Recommended)
1. In the iOS Simulator, open Safari
2. Type in the address bar: `exp://192.168.0.79:8082`
3. It should prompt to open in Expo Go

### Option 2: Use Localhost Instead
1. Stop the current Expo server (Ctrl+C)
2. Run: `npx expo start --localhost`
3. Then press `i` to open iOS simulator

### Option 3: Install Expo Go in Simulator
1. Open App Store in the simulator
2. Search for "Expo Go"
3. Install it
4. Then try opening the app again

### Option 4: Restart Simulator
```bash
# Shut down simulator
xcrun simctl shutdown B24AD70F-392D-4EE7-8941-138914051544

# Boot it again
xcrun simctl boot B24AD70F-392D-4EE7-8941-138914051544

# Open Simulator app
open -a Simulator
```

### Option 5: Use Development Build
If you have a development build:
1. Press `s` in Expo CLI to switch to development build
2. Or build one: `npx expo run:ios`

## Quick Fix
Try this in your terminal:
```bash
# Stop current server (Ctrl+C)
# Then restart with localhost
npx expo start --localhost -c
# Press 'i' to open iOS
```

