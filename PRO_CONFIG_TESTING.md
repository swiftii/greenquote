# Testing Pro App Configuration Loading

## Quick Testing Guide

### Test 1: Verify Config Loading

**Open Browser Console (F12)**

**Load Pro App:**
```
http://localhost:8080/pro/index.html?client=example-lawn
```

**Expected Console Output:**
```
[Pro] Initializing GreenQuote Pro
[Pro] Loading config for client: example-lawn
[Pro] Config loaded successfully for client: example-lawn
[Pro] ✓ Google Maps API key found in config
[Pro] Config structure: {
  clientId: "example-lawn",
  businessName: "Green Valley Lawn Care",
  hasGoogleMapsKey: true,
  hasDefaultAreaEstimates: true,
  servicesCount: 6,
  addOnsCount: 3
}
```

**If API Key Present:**
```
[Pro] Loading Google Maps API with key from config...
[Pro] API Key starts with: AIzaSy...
[Pro] Google Maps script tag added to document
[Pro] ✓ Google Maps API loaded successfully
[Pro] Google Maps version: 3.x
[Pro] Initializing map...
[Pro] ✓ Map initialized successfully
[Pro] ✓ Drawing manager ready
[Pro] ✓ Autocomplete bound to map viewport
[Pro] ✓ Autocomplete initialized and ready
[Pro] ✓ Map is ready for use
```

**If No API Key:**
```
[Pro] ⚠️ No Google Maps API key provided in config
[Pro] Maps features will be disabled
[Pro] To enable maps, add "googleMapsApiKey" to your config file
```

---

### Test 2: Verify Default Config Fallback

**Load with non-existent client:**
```
http://localhost:8080/pro/index.html?client=nonexistent
```

**Expected Console Output:**
```
[Pro] Loading config for client: nonexistent
[Pro] Client config not found at: ../configs/nonexistent.json
[Pro] Falling back to default config
[Pro] Config loaded successfully for client: default
```

---

### Test 3: Verify No Client Parameter

**Load without client parameter:**
```
http://localhost:8080/pro/index.html
```

**Expected Console Output:**
```
[Pro] Loading config for client: default
[Pro] Config loaded successfully for client: default
```

---

### Test 4: Check UI Elements

**After successful load, verify:**

1. **Header shows correct business name:**
   - Should show: "[Business Name] Pro"
   - Badge shows: client ID

2. **Map status message:**
   - With API key: "Enter address to locate property"
   - Without API key: "Maps unavailable - API key required"

3. **Map tools enabled/disabled:**
   - With API key: All buttons clickable
   - Without API key: All buttons disabled (grayed out)

4. **Services populated:**
   - Primary Service dropdown has options
   - Add-ons list shows configured add-ons
   - Frequency options displayed

5. **Theme applied:**
   - Colors match config theme
   - Buttons use primary color
   - Headers use theme colors

---

### Test 5: Test Maps Functionality (If API Key Present)

**Step 1: Enter Address**
```
1. Type in address field: "1600 Amphitheatre"
2. Wait for autocomplete dropdown
3. Select: "1600 Amphitheatre Parkway, Mountain View, CA"
```

**Expected Console Output:**
```
[Pro] Place selected: 1600 Amphitheatre Parkway...
[Pro] ZIP code extracted: 94043
[Pro] Recentering map to place
[Pro] Area estimated: 12000 sq ft
```

**Expected UI Changes:**
- Map recenters to Google HQ
- Map zooms to level 20
- Area display shows: "12,000 sq ft (estimated)"
- Area display has orange background
- Map status: "✓ Property located! Draw boundary..."

---

**Step 2: Draw Boundary**
```
1. Click "✏️ Draw Area" button
2. Click on map to create polygon points
3. Double-click to complete
```

**Expected Console Output:**
```
[Pro] Area measured: [number] sq ft
```

**Expected UI Changes:**
- Area display updates with measured area
- Background changes to green
- Shows: "[number] sq ft (measured)"
- Map status: "✓ Area measured! Drag corners..."

---

### Test 6: Test Pricing Calculation

**Complete form:**
```
1. Customer info filled
2. Address located
3. Primary service selected: "Lawn Mowing"
4. Frequency selected: "Bi-Weekly"
```

**Expected Console Output:**
```
[Pro] Pricing calculated: [perVisit] [monthly]
```

**Expected UI Changes:**
- Quote summary appears
- Shows per visit price
- Shows monthly estimate
- Pricing note indicates measured/estimated

---

### Test 7: Verify Config Path Resolution

**Check Network Tab (F12 → Network):**

**Request should be:**
```
Request URL: http://localhost:8080/configs/example-lawn.json
Status: 200 OK
```

**NOT:**
```
Request URL: http://localhost:8080/pro/configs/example-lawn.json
Status: 404 Not Found
```

**Path Resolution from /pro/:**
- `../configs/` → Goes up one level to root, then into configs
- Resolves to: `/configs/`
- NOT: `/pro/configs/`

---

### Test 8: Test Error Handling

**Test 1: Invalid API Key**

Edit config temporarily to have invalid key:
```json
"googleMapsApiKey": "INVALID_KEY"
```

**Expected Console Output:**
```
[Pro] ❌ Failed to load Google Maps API
[Pro] Check that your API key is valid
[Pro] Verify these APIs are enabled in Google Cloud Console:
[Pro]   - Maps JavaScript API
[Pro]   - Places API
[Pro]   - Geocoding API
```

**Expected UI:**
- Map status: "Maps failed to load - check API key" (red)
- Map buttons disabled

---

**Test 2: Missing Config File**

Try to load non-existent client with broken default:

**Expected Console Output:**
```
[Pro] Client config not found at: ../configs/test.json
[Pro] Falling back to default config
[Pro] Critical error loading config: [error]
```

**Expected UI:**
- Client badge shows: "Config Error" (red background)
- Error alert displayed

---

### Test 9: Compare with Widget

**Load both in separate tabs:**

**Tab 1: Widget**
```
http://localhost:8080/widgets/lawn/v1/index.html?client=example-lawn
```

**Tab 2: Pro**
```
http://localhost:8080/pro/index.html?client=example-lawn
```

**Verify same config used:**
- Same business name
- Same theme colors
- Same services
- Same pricing
- Same Google Maps API key
- Both maps work identically

---

### Test 10: Test Submission Payload

**Complete a quote and submit:**

**Check Console for payload:**
```json
{
  "mode": "internal",
  "source": "greenquote_pro",
  "clientId": "example-lawn",
  "areaData": {
    "measuredAreaSqft": 8234,
    "estimatedAreaSqft": 0,
    "areaSource": "measured",
    "usedForPricing": 8234
  },
  "lead": {
    "addressSource": "autocomplete"
  },
  "operator": {
    "name": "Test User"
  }
}
```

**Verify:**
- ✅ Mode is "internal"
- ✅ Source is "greenquote_pro"
- ✅ Area data includes measured/estimated
- ✅ Operator info included
- ✅ Same structure as widget (except internal flags)

---

## Troubleshooting Common Issues

### Issue: Config returns 404

**Check:**
```
1. Are you accessing from /pro/index.html?
2. Is the path ../configs/ (with ../ prefix)?
3. Does configs/example-lawn.json exist?
4. Check Network tab for actual request URL
```

**Fix:**
- Path should be `../configs/example-lawn.json`
- NOT `configs/example-lawn.json`
- NOT `/configs/example-lawn.json`

---

### Issue: Google Maps not loading

**Check Console for:**
```
[Pro] ⚠️ No Google Maps API key provided in config
```

**Fix:**
1. Open config file
2. Find "googleMapsApiKey" field
3. Ensure it has valid value:
   ```json
   "googleMapsApiKey": "AIzaSyABCDEF..."
   ```
4. NOT empty string: `""`
5. NOT missing field

---

### Issue: Autocomplete not working

**Check Console for:**
```
[Pro] Places API not available
```

**Fix:**
1. Go to Google Cloud Console
2. Enable "Places API"
3. Wait 1-2 minutes
4. Reload page

---

### Issue: Different config than widget

**Check:**
1. Both using same client parameter?
2. Both loading same config file?
3. Check Network tab - same file requested?

**Verify:**
```
Widget URL: ?client=example-lawn
Pro URL: ?client=example-lawn

Both should load: /configs/example-lawn.json
```

---

## Success Checklist

After testing, you should have:

- ✅ Pro app loads config successfully
- ✅ Console shows detailed logging
- ✅ Google Maps API key detected
- ✅ Maps load and work correctly
- ✅ Autocomplete functions properly
- ✅ Drawing tools work
- ✅ Pricing matches widget
- ✅ Theme applies correctly
- ✅ Error states handled gracefully
- ✅ Submission includes internal flags

---

## Quick Debugging Commands

**Check if config loaded:**
```javascript
// In browser console
console.log(config);
```

**Check if Google Maps loaded:**
```javascript
console.log(typeof google !== 'undefined');
console.log(google?.maps?.version);
```

**Check current state:**
```javascript
console.log(state);
```

**Check map object:**
```javascript
console.log(map);
```

---

**Ready to test!** Open the Pro app and work through these tests to verify everything works correctly.
