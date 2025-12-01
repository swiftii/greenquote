# Quick Google Maps Setup Guide

## Why You're Not Seeing the Satellite View

The widget is currently running in **mock mode** because it doesn't have a Google Maps API key configured. Here's what you're experiencing:

### Current Behavior (Mock Mode):
- ❌ No satellite imagery
- ❌ No visual map preview
- ❌ Cannot draw/edit boundaries
- ✅ Generates estimated lawn size
- ✅ Rest of widget works normally

### With API Key:
- ✅ Full satellite imagery
- ✅ Visual property preview
- ✅ Interactive boundary editing
- ✅ Drag corners to adjust area
- ✅ Manual redraw capability

---

## 5-Minute Setup

### Step 1: Get Your API Key (3 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a Project**
   - Click "Select a project" dropdown
   - Click "New Project"
   - Name it (e.g., "Lawn Widget")
   - Click "Create"

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable these 3 APIs:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
     - ✅ Places API (optional, for future)

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key (starts with "AIzaSy...")

### Step 2: Add Key to Widget (1 minute)

**Method A: Admin Panel (Easiest)**
```bash
1. Open admin.html in browser
2. Select "example-lawn" from dropdown
3. Paste your API key
4. Click "Test API Key" (should show ✅)
5. Click "Save Configuration"
6. Download the updated JSON file
7. Replace configs/example-lawn.json
```

**Method B: Direct Edit**
```bash
1. Open configs/example-lawn.json
2. Find: "googleMapsApiKey": ""
3. Replace with: "googleMapsApiKey": "AIzaSyYOUR_KEY_HERE"
4. Save the file
```

### Step 3: Test It (1 minute)

1. Reload the widget
2. Go to Step 2
3. Enter address: "1600 Amphitheatre Parkway, Mountain View, CA"
4. Click "Calculate Size"
5. **You should now see:**
   - Satellite imagery of Google headquarters
   - Green boundary overlay
   - Editable corners
   - Accurate property measurement

---

## Visual Comparison

### Before (Mock Mode):
```
┌─────────────────────────────┐
│                             │
│   Map Preview Unavailable   │
│                             │
│   Add Google Maps API key   │
│   to see satellite view     │
│                             │
└─────────────────────────────┘

Lawn Size: 10,453 sq ft (estimated)
```

### After (With API Key):
```
┌─────────────────────────────┐
│  🛰️ [Satellite Imagery]    │
│                             │
│    ╱────────╲              │
│   ╱   🏡     ╲ ← Green     │
│  │            │   Boundary │
│   ╲          ╱   (Editable)│
│    ╲────────╱              │
└─────────────────────────────┘

Lawn Size: 8,234 sq ft (accurate)
```

---

## What Changes With API Key

### Address Input:
- **Before**: Just calculates random size
- **After**: Geocodes to exact location, shows satellite view

### Property Boundary:
- **Before**: No visual representation
- **After**: Green overlay on satellite image you can drag/edit

### Lawn Size Accuracy:
- **Before**: Estimated (not real)
- **After**: Calculated from actual drawn area

### Customer Experience:
- **Before**: Trust the estimate
- **After**: See and customize their exact service area

---

## Interactive Features You Get

### 1. Auto-Calculate
```
Enter address → Click "Calculate Size"
↓
Widget geocodes address
↓
Map zooms to property with satellite view
↓
Green boundary drawn over estimated lot
↓
Shows lawn size in sq ft
```

### 2. Drag to Adjust
```
Click corner point → Drag to new position
↓
Boundary reshapes in real-time
↓
Lawn size updates automatically
↓
Accurate quote based on actual service area
```

### 3. Manual Redraw
```
Click "Adjust Boundary"
↓
Click points on map to draw custom shape
↓
Double-click to complete
↓
New area calculated from your drawing
```

---

## Cost Reality Check

**Google Maps Pricing:**
- Maps JavaScript API: $7 per 1,000 loads
- Geocoding API: $5 per 1,000 requests

**But you get:**
- $200 FREE credit every month
- = 28,500 free map loads/month
- = 40,000 free geocoding requests/month

**For a small lawn care business:**
- 100 quotes/month = ~$1.20
- 500 quotes/month = ~$6.00
- **Effectively FREE for most businesses**

---

## Security Best Practices

### After You Get Your Key:

1. **Restrict It** (Recommended)
   ```
   Google Cloud Console
   → Credentials
   → Click your API key
   → Application restrictions
   → HTTP referrers
   → Add: your-website.com/*
   ```

2. **Set Limits**
   ```
   → API restrictions
   → Restrict key to:
     - Maps JavaScript API
     - Geocoding API
     - Places API
   ```

3. **Monitor Usage**
   ```
   → APIs & Services
   → Dashboard
   → Check usage daily
   → Set up billing alerts
   ```

---

## Testing Checklist

After adding your API key, test these scenarios:

- [ ] Enter residential address → See satellite view
- [ ] Click "Calculate Size" → Green boundary appears
- [ ] Drag corner points → Size updates in real-time
- [ ] Click "Adjust Boundary" → Can draw custom shape
- [ ] Click "Clear" → Boundary removes, can start over
- [ ] Try different addresses → All work correctly
- [ ] Check browser console → No errors
- [ ] Complete full quote → Pricing uses accurate size

---

## Common Issues

### "Request denied" error
- **Fix**: Enable Maps JavaScript API in Google Cloud
- **Fix**: Check API key is copied correctly (no spaces)

### Map shows but gray/blank
- **Fix**: Enable Geocoding API
- **Fix**: Try more specific address

### Can't drag boundary corners
- **Fix**: Refresh page after adding API key
- **Fix**: Check browser console for JavaScript errors

### "Invalid API key" message
- **Fix**: Verify key in Google Cloud Console
- **Fix**: Check key restrictions aren't too tight

---

## Quick Commands

### Test Current Configuration:
```bash
# Check if API key is set
cat configs/example-lawn.json | grep googleMapsApiKey
```

### View Widget Locally:
```bash
# Start server
python3 -m http.server 8080

# Open in browser
http://localhost:8080/widgets/lawn/v1/index.html?client=example-lawn
```

### Deploy to GitHub:
```bash
git add configs/example-lawn.json
git commit -m "Add Google Maps API key"
git push origin main
```

---

## Summary

**Problem**: Not seeing satellite view or boundary editor

**Solution**: Add Google Maps API key

**Time Required**: 5 minutes

**Cost**: Free for typical usage

**Result**: 
- ✅ Full satellite imagery
- ✅ Visual property preview  
- ✅ Interactive boundary editing
- ✅ More accurate quotes
- ✅ Better customer experience

**Next Step**: Follow "Step 1: Get Your API Key" above!

---

## Need Help?

1. Try the admin panel test function
2. Check TEST_MAPS_INTEGRATION.md for detailed testing
3. Review ADMIN_GUIDE.md for full setup process
4. Check browser console for specific errors

The widget is fully functional in mock mode for development, but adding the API key unlocks the full visual experience your customers will love! 🚀
