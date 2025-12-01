# Testing Google Maps Integration

## What You Should See

When Google Maps API is properly configured, the widget will display:

### Step 2: Property Details

1. **Satellite Map View**
   - Real satellite imagery of the entered address
   - Zoom level 19 for detailed view
   - Centered on the property location

2. **Auto-Generated Boundary**
   - Green overlay showing estimated property area
   - Editable corners (drag to adjust)
   - Real-time area calculation as you edit

3. **Drawing Tools**
   - "Calculate Size" - Geocodes address and creates initial boundary
   - "Adjust Boundary" - Lets you redraw the entire area
   - "Clear" - Removes the boundary and resets

4. **Interactive Features**
   - Drag corner points to fine-tune the service area
   - See lawn size update in real-time as you adjust
   - Double-click to complete when drawing manually

---

## Current Behavior

### Without Google Maps API Key:
- ✅ Mock mode generates random property size
- ✅ Lawn size displays in square feet
- ❌ No satellite map preview (shows placeholder)
- ❌ Cannot draw or adjust boundaries
- ℹ️ Message: "Add Google Maps API key to see satellite view"

### With Google Maps API Key:
- ✅ Real satellite imagery loads
- ✅ Address geocoding works
- ✅ Auto-generated property boundary
- ✅ Editable boundary (drag corners)
- ✅ Manual redraw capability
- ✅ Real-time area calculation
- ✅ Zoom and pan controls

---

## How to Test

### Step 1: Add Your Google Maps API Key

**Option A: Use Admin Panel**
1. Open `admin.html` in browser
2. Select your client config
3. Paste API key
4. Click "Test API Key"
5. Click "Save Configuration"
6. Replace config file in `/configs/`

**Option B: Edit Config Manually**
1. Open `configs/example-lawn.json`
2. Find: `"googleMapsApiKey": ""`
3. Replace with: `"googleMapsApiKey": "YOUR_KEY_HERE"`
4. Save the file

### Step 2: Test the Widget

1. Open the widget in browser:
   ```
   http://localhost:8080/widgets/lawn/v1/index.html?client=example-lawn
   ```

2. Complete Step 1 (select service)

3. In Step 2, enter a real address:
   ```
   Example addresses to test:
   - 1600 Amphitheatre Parkway, Mountain View, CA
   - 350 Fifth Avenue, New York, NY
   - 1 Apple Park Way, Cupertino, CA
   - Your own address!
   ```

4. Click "Calculate Size"

5. **Expected Result:**
   - Map zooms to address location
   - Satellite view shows the property
   - Green boundary appears over estimated lot
   - Lawn size displays (e.g., "8,450 sq ft")
   - Instructions say "Drag corners to adjust"

### Step 3: Test Boundary Editing

**Test A: Drag Corners**
1. After calculation, hover over a corner point
2. Cursor should change to pointer
3. Click and drag the corner
4. Lawn size updates in real-time
5. Release to set new position

**Test B: Redraw Boundary**
1. Click "Adjust Boundary" button
2. Button changes to "Drawing..."
3. Click on map to place points
4. Create polygon around service area
5. Double-click to complete
6. New area calculates automatically

**Test C: Clear and Restart**
1. Click "Clear" button
2. Green boundary disappears
3. Lawn size hides
4. Instructions reset
5. Ready to calculate again

---

## Troubleshooting

### Map Shows But No Satellite View

**Issue**: Gray map or no imagery
- **Fix**: Check zoom level (should be 18-20 for residential)
- **Fix**: Verify address is specific enough
- **Fix**: Try a well-known address first

### Can't See Boundary

**Issue**: No green overlay after calculation
- **Fix**: Check browser console for errors
- **Fix**: Verify polygon creation in console logs
- **Fix**: Try zooming in/out

### Boundary Not Editable

**Issue**: Can't drag corners
- **Fix**: Check if `editable: true` in polygon options
- **Fix**: Verify Google Maps loaded completely
- **Fix**: Try clicking directly on corner points (small circles)

### Drawing Mode Not Working

**Issue**: Can't draw custom boundary
- **Fix**: Make sure "Adjust Boundary" is enabled
- **Fix**: Check if Drawing library is loaded
- **Fix**: Look for JavaScript errors in console

### Area Calculation Wrong

**Issue**: Lawn size seems incorrect
- **Fix**: Verify polygon covers intended area
- **Fix**: Check for self-intersecting polygons
- **Fix**: Ensure square feet conversion is correct (area × 10.7639)

---

## Expected Console Logs

### Successful Google Maps Load:
```
[Widget] Config loaded: {clientId: "example-lawn", ...}
[Widget] Google Maps API loaded
[Widget] Google Maps initialized successfully
[Widget] Step 2 loaded
```

### Successful Address Calculation:
```
[Widget] Property located and boundary created
[Widget] Area calculated: 8450 sq ft
```

### Drawing Mode:
```
[Widget] Drawing mode enabled
[Widget] Area calculated: 12300 sq ft
```

---

## Visual Indicators

### Map Instructions Box

**Initial State** (Light green background):
> Enter your address above and click "Calculate Size" to see your property.

**After Calculation** (Green border, success):
> ✓ Property located! Drag the corners to match your exact service area, or click "Adjust Boundary" to redraw.

**Drawing Mode** (Yellow border, warning):
> Draw Mode: Click on the map to create points around your service area. Double-click to complete.

**Mock Mode** (Gray, info):
> Mock Mode: Property size estimated. Add Google Maps API key to see satellite view.

---

## API Requirements Checklist

For full functionality, ensure these are enabled in Google Cloud Console:

- ✅ **Maps JavaScript API** - For map display
- ✅ **Geocoding API** - For address lookup  
- ✅ **Places API** - For address autocomplete (future enhancement)

### Verify Your Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Dashboard"
4. Check "Enabled APIs & services"
5. All three should be listed

---

## Demo Video Flow

If recording a demo, follow this sequence:

1. **Start on Step 1**
   - Select "Lawn Mowing"
   - Check "Edging"
   - Click "Next"

2. **Enter Address**
   - Type real address slowly
   - Show autocomplete (if available)
   - Click "Calculate Size"

3. **Show Map Loading**
   - Watch satellite imagery load
   - Point out the green boundary
   - Highlight the property

4. **Demonstrate Editing**
   - Drag a corner to show it's interactive
   - Watch lawn size update
   - Mention accuracy benefits

5. **Show Redraw**
   - Click "Adjust Boundary"
   - Draw custom shape
   - Complete and show new calculation

6. **Continue to Quote**
   - Select frequency
   - Click "Next"
   - Show final price with accurate lawn size

---

## Cost Estimation

With Google Maps API key:

- **Maps JavaScript API**: $7 per 1,000 map loads
- **Geocoding API**: $5 per 1,000 geocoding requests

**Example**: 
- 100 quotes per month = $0.70 (maps) + $0.50 (geocoding) = **$1.20/month**
- First $200/month is free (Google Cloud credit)

**Conclusion**: For most small-medium lawn care businesses, Maps integration is effectively **FREE** due to Google's generous free tier.

---

## Next Steps After Testing

1. ✅ Verify maps load correctly
2. ✅ Test boundary editing works
3. ✅ Confirm area calculations are accurate
4. ✅ Test multiple addresses
5. ✅ Deploy to GitHub Pages
6. ✅ Embed on client website
7. ✅ Monitor usage in Google Cloud Console

---

## Support

If maps aren't working:

1. Check browser console for errors
2. Verify API key in config file
3. Test API key in admin panel
4. Review ADMIN_GUIDE.md for setup help
5. Check Google Cloud Console for API errors

**Remember**: The widget works in mock mode without Google Maps for testing, but production use requires the API key for best customer experience!
