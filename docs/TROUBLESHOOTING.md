# Troubleshooting Guide

## Common Issues

### App Stuck on Loading
- **Cause**: Auth state check timeout or network issues
- **Fix**: Check Supabase configuration in `.env` file
- **See**: `SIMULATOR_FIX.md` and `SUPABASE_FIX.md`

### Network Request Failed
- **Cause**: Supabase connection issues or missing credentials
- **Fix**: Verify Supabase URL and anon key are correct
- **See**: `QUICK_FIX_NETWORK_ERRORS.md`

### Simulator Connection Timeout
- **Cause**: iOS simulator not connecting to Expo
- **Fix**: Restart Expo with `npx expo start --localhost -c`
- **See**: `SIMULATOR_FIX.md`

### Database Errors
- **Cause**: Missing tables or incorrect schema
- **Fix**: Run `api/database/migrations.sql` in Supabase SQL Editor
- **See**: `MIGRATION_COMPLETE.md`

## Performance Issues

### Slow Page Loading
- Timeouts have been added to all network requests
- Check network connectivity
- Verify API endpoints are accessible

### Outfit Generation Timeout
- Default timeout: 15 seconds
- Falls back to cached/fallback data
- Check API deployment status

