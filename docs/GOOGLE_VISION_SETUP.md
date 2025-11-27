# Google Vision API Setup Guide

## 🚀 Quick Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Vision API

### 2. Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `fashion-ai-vision`
4. Role: `Cloud Vision API User`
5. Create and download the JSON key file

### 3. Add Credentials to Project
1. Place the downloaded JSON file in project root as `google-vision-key.json`
2. Add to `.gitignore` to keep it secure

### 4. Set Environment Variable
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./google-vision-key.json"
```

## 💰 Pricing
- **Free Tier**: 1,000 requests/month
- **Paid**: $1.50 per 1,000 requests
- **Perfect for MVP**: Very cost-effective

## 🧪 Testing
The service includes fallback analysis if the API fails, so your app will work even without credentials during development.

## 🔧 Implementation
The Google Vision service is already integrated into your Pinterest similarity search. It will:
1. Analyze Pinterest images
2. Extract fashion details (colors, styles, materials)
3. Generate intelligent search results
4. Fall back gracefully if API is unavailable
