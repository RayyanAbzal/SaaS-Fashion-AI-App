# Legacy Code Notes

## Server Folder

The `server/` folder contains legacy code from the Firebase migration period. 

### Status
- **Not actively used** - API is now in `api/` folder for Vercel deployment
- **Contains Firebase Admin SDK** - We've migrated to Supabase
- **May contain utilities** - Review before deletion

### Files
- `index.js` - Legacy Express server with Firebase
- `google-vision-key.json` - Google Vision API key (if needed)
- `stylematev2-firebase-adminsdk-fbsvc-385a67ccdb.json` - Old Firebase credentials
- `scraper.js` / `scrape_countryroad.py` - Web scraping utilities

### Recommendation
- Keep for now if you need the scraping utilities
- Remove Firebase-related files if not needed
- Consider moving utilities to `src/utils/` if still useful

