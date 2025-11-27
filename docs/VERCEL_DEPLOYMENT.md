# Vercel Deployment Guide

This guide will help you deploy the backend API to Vercel for your Fashion AI App.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: For connecting your repository
3. **Node.js**: Version 18 or higher

## Deployment Steps

### 1. Push to GitHub

First, push your code to a GitHub repository:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Add Vercel API endpoints for Fashion AI App"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/fashion-ai-app.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Other
   - **Root Directory**: Leave as default
   - **Build Command**: Leave empty (Vercel will auto-detect)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Click "Deploy"**

### 3. Update Mobile App Configuration

After deployment, Vercel will give you a URL like `https://your-app-name.vercel.app`

Update the mobile app to use this URL:

1. **Open** `src/services/countryRoadService.ts`
2. **Replace** `https://your-app-name.vercel.app/api` with your actual Vercel URL
3. **Save** the file

### 4. Test the API

Test your deployed API endpoints:

- **Country Road Items**: `https://your-app-name.vercel.app/api/country-road-items`
- **Retail Products**: `https://your-app-name.vercel.app/api/retail-products`
- **Outfit Advice**: `https://your-app-name.vercel.app/api/outfit-advice`

### 5. Environment Variables (Optional)

If you need to add environment variables later:

1. **Go to your Vercel project dashboard**
2. **Click "Settings"**
3. **Click "Environment Variables"**
4. **Add your variables** (e.g., API keys, database URLs)

## API Endpoints

Your deployed API will have these endpoints:

### GET /api/country-road-items
Returns Country Road clothing items with fallback data.

### GET /api/retail-products
Returns retail products from various Australian retailers.

**Query Parameters:**
- `category`: Filter by category (e.g., 'tops', 'bottoms')
- `color`: Filter by color (e.g., 'blue', 'white')
- `formality`: Filter by formality ('casual', 'smart-casual', 'business', 'formal')
- `minTemp`: Minimum temperature
- `maxTemp`: Maximum temperature

### GET /api/outfit-advice
Returns outfit styling advice.

**Query Parameters:**
- `occasion`: Filter by occasion (e.g., 'work', 'date', 'casual', 'party')
- `weather`: Filter by weather (e.g., 'mild', 'warm', 'cold')

## Benefits of Vercel Deployment

✅ **Reliable**: No more "Network request failed" errors  
✅ **Fast**: Global CDN for fast response times  
✅ **Scalable**: Automatically handles traffic spikes  
✅ **Easy**: Simple deployment from GitHub  
✅ **Free**: Generous free tier for development  

## Troubleshooting

### Common Issues:

1. **Build Errors**: Check that all dependencies are in `package.json`
2. **CORS Issues**: The API includes CORS headers for mobile app access
3. **Timeout**: Vercel has a 10-second timeout for serverless functions

### Debugging:

1. **Check Vercel Function Logs** in your dashboard
2. **Test endpoints** directly in browser
3. **Check mobile app console** for network errors

## Next Steps

After deployment:

1. **Update the mobile app** with your Vercel URL
2. **Test the outfit generation** feature
3. **Add more retail data** as needed
4. **Implement web scraping** for real-time product data

Your Fashion AI App will now have a reliable backend for retail products! 🚀
