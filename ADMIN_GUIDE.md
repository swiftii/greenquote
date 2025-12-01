# Admin Panel Guide

## 📍 What is the Admin Panel?

The Admin Panel (`admin.html`) is a user-friendly interface that allows you to easily configure your Google Maps API key and manage client settings without manually editing JSON files.

## 🚀 How to Access

### Locally:
```
Open: /app/admin.html in your browser
```

### After GitHub Pages Deployment:
```
https://YOUR-USERNAME.github.io/YOUR-REPO/admin.html
```

---

## ✨ Features

### 1. **Client Selection**
- Dropdown showing all available client configurations
- Displays business name for easy identification
- Loads current configuration when selected

### 2. **API Key Management**
- Text input for your Google Maps API key
- Shows current key status (Set / Not set)
- Visual feedback with current configuration

### 3. **Test API Key**
- Built-in testing functionality
- Verifies your API key by loading Google Maps
- Instant feedback on whether the key is valid
- Checks if required APIs are enabled

### 4. **Save Configuration**
- Downloads updated config file with your API key
- Preserves all other settings
- Ready to upload back to your project

### 5. **Configuration Preview**
- View complete JSON configuration
- See all pricing, services, and settings
- Syntax-highlighted display

### 6. **Step-by-Step Instructions**
- Integrated guide for getting Google Maps API key
- Links directly to Google Cloud Console
- Lists all required APIs to enable

---

## 📖 How to Use

### Step 1: Open the Admin Panel

Navigate to `admin.html` in your browser (locally or from GitHub Pages URL)

### Step 2: Select Your Client

Use the dropdown to select which client configuration you want to update:
- **Default** - The fallback configuration
- **Example Lawn** - Sample client configuration
- Any custom clients you've added

### Step 3: Enter Your API Key

Paste your Google Maps API key into the input field.

Don't have one yet? Follow the instructions on the page to get one from Google Cloud Console.

### Step 4: Test Your API Key

Click **"Test API Key"** to verify it works:
- ✅ **Success**: "API key is valid! Google Maps loaded successfully"
- ❌ **Error**: Shows what went wrong and how to fix it

### Step 5: Save Configuration

Click **"Save Configuration"**:
- A JSON file will automatically download
- Replace the existing config file in `/configs/` folder
- Commit and push to GitHub

### Step 6: Verify

Test your widget to ensure the Google Maps integration is working.

---

## 🗺️ Google Maps API Setup

### Required APIs

Enable these three APIs in Google Cloud Console:

1. **Maps JavaScript API**
   - Purpose: Display interactive maps
   - Required for: Map visualization

2. **Geocoding API**
   - Purpose: Convert addresses to coordinates
   - Required for: Address lookup

3. **Places API**
   - Purpose: Address autocomplete
   - Required for: Better user experience

### How to Get Your API Key

1. **Go to Google Cloud Console**
   https://console.cloud.google.com/

2. **Create/Select Project**
   - Click "Select a project" dropdown
   - Click "New Project" or select existing

3. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Search for each required API
   - Click "Enable" on each

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

5. **Optional: Restrict Your Key**
   - Click on your API key name
   - Add HTTP referrers (your website URLs)
   - Select specific APIs to restrict to
   - This improves security

6. **Add to Widget**
   - Use the Admin Panel to add your key
   - Or manually edit your config file

---

## 🔍 Testing Your Configuration

### Test in Admin Panel

1. Enter your API key
2. Click "Test API Key"
3. Wait for result:
   - ✅ Success = Key is working
   - ❌ Error = Check the error message

### Test in Widget

1. Open your widget with the updated config
2. Go to Step 2 (Property Details)
3. Enter a real address
4. Click "Calculate Size"
5. Map should load and show your property

### Common Issues

**Issue**: "Failed to load Google Maps"
- **Fix**: Check if all 3 APIs are enabled
- **Fix**: Verify API key is copied correctly (no extra spaces)

**Issue**: "Request denied"
- **Fix**: Check API key restrictions
- **Fix**: Make sure HTTP referrer includes your domain

**Issue**: Map shows but address doesn't work
- **Fix**: Enable Geocoding API
- **Fix**: Enable Places API

---

## 💾 Configuration File Structure

When you save a configuration, it includes:

```json
{
  "clientId": "example-lawn",
  "businessName": "Green Valley Lawn Care",
  "googleMapsApiKey": "YOUR_API_KEY_HERE",
  "centralWebhookUrl": "...",
  "ghlWebhookUrl": "...",
  "baseVisitFee": 30,
  "monthlyQuoteLimit": 150,
  "lawnSizeTiers": [...],
  "frequencyMultipliers": {...},
  "services": [...],
  "addOns": [...],
  "theme": {...}
}
```

The Admin Panel ONLY modifies the `googleMapsApiKey` field. All other settings remain unchanged.

---

## 🎯 Workflow

### One-Time Setup:

1. Get Google Maps API key
2. Open Admin Panel
3. Select your client
4. Add API key
5. Test it
6. Save configuration
7. Replace config file
8. Commit & push
9. Done! ✅

### Adding New Clients:

1. Copy existing config file (e.g., `example-lawn.json`)
2. Rename to new client name (e.g., `johnsons-lawn.json`)
3. Open Admin Panel
4. Select new client
5. Add API key (reuse same key for all clients)
6. Customize pricing, colors, etc. in the JSON file
7. Save and deploy

---

## 🔐 Security Notes

### API Key Security:

- **Never commit API keys to public repositories**
- Use environment variables for production
- Add HTTP referrer restrictions
- Rotate keys periodically

### Admin Panel Access:

- The admin panel is client-side only
- No sensitive data is stored
- Configuration downloads locally
- Consider protecting admin.html with authentication if deployed publicly

---

## 🚀 Production Best Practices

### 1. Separate Keys for Development & Production

- Development: Unrestricted key for testing
- Production: Restricted key with HTTP referrers

### 2. Monitor Usage

- Check Google Cloud Console regularly
- Set up billing alerts
- Monitor API quota usage

### 3. Cost Management

- Google Maps has a free tier ($200/month credit)
- Estimate: ~28,000 free map loads per month
- Set daily limits to prevent unexpected charges

### 4. Update Process

- Test changes locally first
- Use staging environment if available
- Deploy during low-traffic periods
- Keep backup of working config files

---

## 📊 Expected Costs

### Google Maps Pricing (as of 2025):

- **Maps JavaScript API**: $7 per 1,000 loads
- **Geocoding API**: $5 per 1,000 requests
- **Places API**: $17 per 1,000 requests (autocomplete)

### Free Tier:

- $200 monthly credit
- Covers approximately:
  - 28,500 map loads
  - 40,000 geocoding requests
  - 11,700 autocomplete requests

### Cost-Saving Tips:

1. Cache geocoded addresses
2. Only load maps when needed
3. Use static maps for previews
4. Implement usage tracking

---

## 🆘 Troubleshooting

### Admin Panel Won't Load

**Issue**: Blank page or errors
- **Fix**: Check browser console for errors
- **Fix**: Ensure config files exist in `/configs/`
- **Fix**: Verify file paths are correct

### Can't Select Client

**Issue**: Dropdown shows "Loading..." forever
- **Fix**: Check config files are valid JSON
- **Fix**: Verify file names match (no typos)
- **Fix**: Look for CORS issues in console

### Save Button Doesn't Work

**Issue**: Nothing downloads when clicking Save
- **Fix**: Check browser popup/download settings
- **Fix**: Verify JavaScript is enabled
- **Fix**: Try a different browser

### API Key Test Fails

**Issue**: Always shows error even with valid key
- **Fix**: Check internet connection
- **Fix**: Verify Google Maps can load in your browser
- **Fix**: Try the key directly in widget

---

## 📝 Quick Reference

### Admin Panel URL Formats:

**Local**:
```
file:///path/to/admin.html
http://localhost:8080/admin.html
```

**GitHub Pages**:
```
https://username.github.io/repo/admin.html
```

### Config File Locations:

```
/configs/default.json
/configs/example-lawn.json
/configs/your-client-name.json
```

### Required APIs:

- ✅ Maps JavaScript API
- ✅ Geocoding API
- ✅ Places API

---

## 🎉 You're All Set!

The Admin Panel makes it easy to manage your Google Maps API configuration without touching code. Just:

1. Open the panel
2. Select your client
3. Add your API key
4. Test it
5. Save it
6. Done!

For more detailed information, see:
- `README.md` - Full documentation
- `QUICKSTART.md` - Quick setup guide
- `PREVIEW_SUMMARY.md` - Feature overview

---

**Questions?** Check the main README.md or test the configuration in your browser!
