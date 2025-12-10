# Google Maps Integration Guide

## Overview

The Quote page (`/quote`) includes Google Maps integration for:
- **Address Autocomplete**: Search and select property addresses using Google Places
- **Boundary Drawing**: Draw the lawn/service area boundary on a satellite map
- **Area Calculation**: Automatically compute square footage from the drawn polygon

## Required Environment Variable

Add this to your **Vercel Environment Variables**:

```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Getting Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Library**
4. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API** (optional, for reverse geocoding)
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. (Recommended) Click **Edit** and add restrictions:
   - Application restrictions: HTTP referrers
   - Add your domains:
     - `https://app.getgreenquote.com/*`
     - `https://*.vercel.app/*` (for preview deployments)
   - API restrictions: Restrict to the enabled APIs above

## Setting Up in Vercel

1. Go to your Vercel project
2. Navigate to **Settings → Environment Variables**
3. Add new variable:
   - Name: `REACT_APP_GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key
   - Environment: Production (and optionally Preview)
4. Redeploy the app

## How It Works

### Address Autocomplete
- User types in the address field
- Google Places API provides autocomplete suggestions
- Selecting an address captures lat/lng coordinates
- Map centers on the selected location with satellite view

### Boundary Drawing
1. User clicks "Start Drawing"
2. Click on the map to add boundary points
3. Minimum 3 points required for a valid polygon
4. Click "Finish Drawing" to complete
5. Can undo points or clear to restart

### Area Calculation
- Uses Google Maps Geometry library
- `computeArea()` returns square meters
- Converted to square feet: `sqFt = sqMeters × 10.7639`
- Automatically populates the lawn size field
- Pricing recalculates based on measured area

## Pricing Logic

```javascript
// Base price from area
const calculatedFromArea = areaSqFt * pricePerSqFt;

// Enforce minimum price
const basePrice = Math.max(calculatedFromArea, minPricePerVisit);

// Add add-ons and apply frequency multiplier
const perVisit = (basePrice + addonsTotal) * frequencyMultiplier;
```

## Fallback Behavior

If Google Maps is not configured:
- A warning message appears
- Users can manually enter lawn size
- All other features work normally

## Files Modified

- `frontend/src/pages/Quote.js` - Main quote page with Maps integration
- `frontend/.env` - Added `REACT_APP_GOOGLE_MAPS_API_KEY` template
- `frontend/package.json` - Added `@react-google-maps/api` dependency

## Troubleshooting

### "Error loading Google Maps"
- Check that API key is correct
- Verify APIs are enabled in Google Cloud Console
- Check browser console for specific error messages

### Map loads but no autocomplete
- Ensure Places API is enabled
- Check API key restrictions

### "This page can't load Google Maps correctly"
- API key may be invalid or expired
- Billing might not be set up (Google requires billing for API access)
- Check API key restrictions match your domain

### Area calculation seems wrong
- Ensure geometry library is loading (included in our config)
- Draw boundary carefully - overlapping lines can cause errors
- Clear and redraw if polygon looks incorrect
