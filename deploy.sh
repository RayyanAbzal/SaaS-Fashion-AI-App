#!/bin/bash

# Fashion AI App - Vercel Deployment Script

echo "🚀 Deploying Fashion AI App to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Fashion AI App"
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy your Vercel URL (e.g., https://your-app-name.vercel.app)"
echo "2. Update src/services/countryRoadService.ts with your URL"
echo "3. Test the mobile app"
echo ""
echo "🔗 Your API endpoints will be:"
echo "- https://your-app-name.vercel.app/api/country-road-items"
echo "- https://your-app-name.vercel.app/api/retail-products"
echo "- https://your-app-name.vercel.app/api/outfit-advice"
