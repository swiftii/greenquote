# Testing Address Search - Quick Guide

## Quick Test Script

Follow this script to verify the address search improvements work correctly.

---

## Test 1: Autocomplete Happy Path ✅

**Expected: Most reliable, automatic recentering**

1. Open widget Step 2
2. Click in "Property Address" field
3. Type: `1600 Amphitheatre`
4. Wait for dropdown to appear
5. Select: "1600 Amphitheatre Parkway, Mountain View, CA 94043"

**Expected Result:**
- ✅ Map automatically recenters to Google headquarters
- ✅ Zooms to level 20 (close property view)
- ✅ Shows: "✓ Property located! Area estimated at 12,000 sq ft"
- ✅ Green success message
- ✅ "Draw Boundary" button enabled

---

## Test 2: Button Click with Stored Place ✅

**Expected: Uses cached place, no extra API call**

*Continue from Test 1*

6. Click "Locate Property" button

**Expected Result:**
- ✅ Map stays centered (already correct)
- ✅ Success message remains
- ✅ No loading delay (using cached data)
- ✅ Console log: "Using selected place from autocomplete"

---

## Test 3: Geocoding Fallback ✅

**Expected: Works even without dropdown selection**

1. Clear the address field
2. Type: `1 Apple Park Way Cupertino CA` (don't select from dropdown)
3. Click "Locate Property"

**Expected Result:**
- ✅ Button shows "Locating..." briefly
- ✅ Map recenters to Apple Park
- ✅ Zooms to property level
- ✅ Shows success message
- ✅ Console log: "No selected place, attempting geocode"
- ✅ Console log: "Geocoding successful"

---

## Test 4: Incomplete Address Error ❌

**Expected: Helpful error message**

1. Clear the address field
2. Type: `123 Main` (incomplete)
3. Click "Locate Property"

**Expected Result:**
- ❌ Alert popup: "Address not found. Please start typing and select from dropdown..."
- ❌ Red error message in instructions area
- ❌ Message includes helpful tips:
  * "Start typing and select from dropdown"
  * "Include full address"
  * "Check spelling"

---

## Test 5: No Selection Warning ⚠️

**Expected: Warns when geometry missing**

1. Clear the address field
2. Start typing an address
3. When dropdown appears, type over it (don't select)
4. Press Enter or Tab

**Expected Result:**
- ⚠️ Yellow warning message
- ⚠️ "Please select a complete address from the dropdown suggestions"

---

## Test 6: ZIP Code Only 📍

**Expected: Zooms to neighborhood level**

1. Clear the address field
2. Type: `94043` (just ZIP code)
3. Select from dropdown (if available) OR click "Locate Property"

**Expected Result:**
- ✅ Map recenters to Mountain View area
- ✅ Zooms to level 14 (neighborhood view)
- ✅ Shows estimated area
- ✅ User can pan around and draw boundary

---

## Test 7: Commercial Property 🏢

**Expected: Uses commercial default**

1. In Step 1, select "Commercial" property type
2. Go to Step 2
3. Enter address: `1 Infinite Loop, Cupertino, CA`
4. Select from dropdown

**Expected Result:**
- ✅ Map centers on Apple campus
- ✅ Area estimated: 15,000 sq ft (commercial default)
- ✅ Yellow "(estimated)" label

---

## Test 8: Drawing Overrides Estimate 📏

**Expected: Measured area replaces estimated**

*Continue from any test with estimated area*

1. Click "Draw Boundary"
2. Draw a polygon on the map
3. Complete the polygon (double-click)

**Expected Result:**
- ✅ Area recalculates from polygon
- ✅ Display changes to green
- ✅ Shows "(measured)" instead of "(estimated)"
- ✅ New area used for pricing

---

## Test 9: Clear and Re-estimate 🔄

**Expected: Falls back to estimated area**

*Continue from Test 8*

1. Click "Clear" button

**Expected Result:**
- ✅ Polygon removed from map
- ✅ Area reverts to estimated value
- ✅ Display changes back to yellow "(estimated)"
- ✅ Message: "Boundary cleared. Using estimated area."

---

## Test 10: Multiple Addresses 🔄

**Expected: Each address works independently**

1. Enter first address and locate it
2. Clear address field
3. Enter different address
4. Select from dropdown

**Expected Result:**
- ✅ Old place cleared
- ✅ New place selected and stored
- ✅ Map recenters to new location
- ✅ New area estimated
- ✅ No conflicts or mixed data

---

## Browser Console Checks

### Open DevTools (F12) and check Console tab

**After Test 1 (Autocomplete):**
```
[Widget] Place selected from autocomplete: {...}
[Widget] Address selected via autocomplete: 1600 Amphitheatre...
[Widget] ZIP code extracted: 94043
[Widget] Recentering map to place
[Widget] Area estimated: 12000 sq ft
```

**After Test 3 (Geocoding):**
```
[Widget] No selected place, attempting geocode
[Widget] Geocoding successful
[Widget] Place processed successfully
```

**After Test 4 (Error):**
```
[Widget] Geocoding failed with status: ZERO_RESULTS
```

---

## Payload Verification

### Check Step 3 or submission data includes:

```json
{
  "lead": {
    "address": "1600 Amphitheatre Parkway, Mountain View, CA 94043",
    "zipCode": "94043",
    "addressSource": "autocomplete"  ← Should show source
  },
  "areaData": {
    "measuredAreaSqft": 0,
    "estimatedAreaSqft": 12000,
    "areaSource": "estimated",
    "usedForPricing": 12000
  }
}
```

---

## Error Scenarios to Test

### Test Invalid Addresses

| Input | Expected Behavior |
|-------|------------------|
| `asdfghjkl` | ZERO_RESULTS error, helpful message |
| `123` | ZERO_RESULTS error, suggests full address |
| Empty string | Alert: "Please enter a property address" |
| `PO Box 123` | May work or show error (depends on location) |

### Test Edge Cases

| Input | Expected Behavior |
|-------|------------------|
| `10001` (NYC ZIP) | Uses ZIP override if configured |
| `Suite 100, 123 Main St` | Works, includes suite in address |
| `123 Main Street` (no city) | May need dropdown selection |

---

## Performance Checks

### Measure Response Times

**Autocomplete selection:**
- Should be instant (< 100ms)
- No geocoding API call
- Uses cached place data

**Geocoding fallback:**
- 200-500ms typical
- Depends on Google API response
- Shows "Locating..." indicator

**Map recentering:**
- Smooth animation
- Completes in < 1 second
- No jank or stuttering

---

## Mobile Testing

### Test on Mobile Device

1. **Touch interaction:**
   - Tap address field
   - Type with virtual keyboard
   - Select from dropdown
   - Verify map touch controls work

2. **Viewport:**
   - Map displays correctly
   - Autocomplete dropdown visible
   - Error messages readable
   - No horizontal scroll

3. **Performance:**
   - Smooth scrolling
   - Quick autocomplete response
   - No lag on map interaction

---

## Regression Checks

### Ensure Nothing Broke

- [ ] Step 1 still works (service selection)
- [ ] Step 2 map displays correctly
- [ ] Polygon drawing still works
- [ ] Area calculation accurate
- [ ] Step 3 shows correct quote
- [ ] Form validation works
- [ ] Submission sends correct data
- [ ] All existing features functional

---

## Success Criteria

**All tests should pass:**

✅ Autocomplete shows suggestions
✅ Selecting address recenters map automatically
✅ "Locate Property" uses cached place when available
✅ Geocoding fallback works for typed addresses
✅ Error messages are helpful and specific
✅ ZIP extraction works correctly
✅ Area estimation uses correct defaults
✅ Measured vs estimated areas tracked properly
✅ Payload includes address source
✅ No console errors
✅ Smooth user experience

---

## Common Issues & Fixes

### Issue: Dropdown doesn't appear
**Fix:** Check Places API enabled, API key valid

### Issue: Map doesn't recenter
**Fix:** Check console for errors, verify geometry exists

### Issue: Still see "not found" errors
**Fix:** Test with known valid addresses first (Google HQ, Apple Park)

### Issue: Estimated area wrong
**Fix:** Check defaultAreaEstimates in config

### Issue: Console shows errors
**Fix:** Read error message, check API quotas, verify setup

---

## Quick Sanity Check

**5-Minute Test:**

1. ✅ Type "1600 Amphitheatre" and select
2. ✅ Map shows Google HQ
3. ✅ Draw a boundary
4. ✅ See measured area
5. ✅ Clear boundary
6. ✅ See estimated area
7. ✅ Complete quote
8. ✅ Check payload has address data

If all pass → System working correctly! 🎉

---

## Reporting Issues

**If you find a problem:**

1. Note which test failed
2. Copy console logs
3. Screenshot error messages
4. Document steps to reproduce
5. Check RELIABLE_ADDRESS_SEARCH.md for troubleshooting

---

**Ready to test? Start with Test 1 and work through the list!** 🧪
