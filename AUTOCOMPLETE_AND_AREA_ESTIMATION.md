# Google Places Autocomplete & Intelligent Area Estimation

## Overview

The widget now features advanced address handling with Google Places Autocomplete and intelligent area estimation that distinguishes between measured and estimated lawn sizes.

---

## New Features

### 1. Google Places Autocomplete

**What it does:**
- Shows address suggestions as user types
- Auto-completes addresses with validation
- Extracts ZIP codes automatically
- Biases results to current map viewport

**User Experience:**
```
User types: "123 M..."
  ↓
Dropdown shows:
  • 123 Main St, Springfield, IL 62701
  • 123 Maple Ave, Springfield, IL 62702
  • 123 Market St, Springfield, MA 01103
  ↓
User selects address
  ↓
Map automatically recenters & zooms to property
  ↓
Area estimated based on property type & ZIP
```

### 2. Automatic Map Recentering

**Zoom Levels by Address Type:**

| Address Type | Zoom Level | Purpose |
|-------------|------------|---------|
| Full Street Address | 20 | Parcel-level view, draw precise boundary |
| ZIP Code Only | 14 | Neighborhood view, explore area |
| City/State | 12 | General area overview |

**What it does:**
- Centers map on selected property
- Adjusts zoom for optimal drawing
- Uses viewport bounds when available
- Provides "parcel-like" snap feeling

### 3. Measured vs Estimated Area

**Priority Order:**

1. **Measured Area (Highest Priority)**
   - User draws polygon on map
   - Calculated from actual boundary
   - Used for pricing
   - Marked as "measured" in payload
   - Display: Green background "(measured)"

2. **Estimated Area (Medium Priority)**
   - No polygon drawn
   - Based on property type + ZIP
   - Configured default values
   - Marked as "estimated" in payload
   - Display: Yellow background "(estimated)"

3. **Manual Selection (Fallback)**
   - No address or polygon
   - User selects tier (small/medium/large)
   - Traditional pricing mode
   - Marked as "none" in payload

### 4. ZIP-Based Area Defaults

**Configuration Structure:**

```json
{
  "defaultAreaEstimates": {
    "residential": 8000,
    "commercial": 15000,
    "zipOverrides": {
      "94043": 12000,
      "10001": 6000,
      "60601": 5000
    }
  }
}
```

**How it works:**

1. User selects address with ZIP 94043
2. System checks `zipOverrides` for "94043"
3. Found! Use 12,000 sq ft
4. If not found, use `residential` default (8,000 sq ft)
5. Display: "8,000 sq ft (estimated)"

---

## User Flow Examples

### Scenario 1: Full Address with Polygon (Most Accurate)

```
Step 2: Property Details
├─ User types "742 Evergreen Terrace"
├─ Selects from autocomplete dropdown
├─ Map zooms to property (zoom 20)
├─ Area estimated: 8,000 sq ft (estimated)
├─ User clicks "Draw Boundary"
├─ Draws precise lawn outline
├─ Area calculated: 7,234 sq ft (measured)
└─ Proceeds to Step 3

Quote Summary:
  Lawn Size: 7,234 sq ft (measured) ← Used for pricing
  
Payload:
  "areaData": {
    "measuredAreaSqft": 7234,
    "estimatedAreaSqft": 8000,
    "areaSource": "measured",
    "usedForPricing": 7234
  }
```

### Scenario 2: Full Address, No Polygon (Estimated)

```
Step 2: Property Details
├─ User types "123 Main St, Springfield"
├─ Selects from autocomplete
├─ Map zooms to property
├─ Area estimated: 8,000 sq ft (estimated)
├─ User does NOT draw boundary
└─ Proceeds to Step 3

Quote Summary:
  Lawn Size: 8,000 sq ft (estimated) ← Used for pricing
  
Payload:
  "areaData": {
    "measuredAreaSqft": 0,
    "estimatedAreaSqft": 8000,
    "areaSource": "estimated",
    "usedForPricing": 8000
  }
```

### Scenario 3: ZIP Only with Polygon

```
Step 2: Property Details
├─ User types "60601" (Chicago ZIP)
├─ Map zooms to neighborhood (zoom 14)
├─ Area estimated: 5,000 sq ft (from ZIP override)
├─ User navigates map to their property
├─ Clicks "Draw Boundary"
├─ Draws lawn outline
├─ Area calculated: 6,450 sq ft (measured)
└─ Proceeds to Step 3

Quote Summary:
  Lawn Size: 6,450 sq ft (measured)
  
Payload:
  "areaData": {
    "measuredAreaSqft": 6450,
    "estimatedAreaSqft": 5000,
    "areaSource": "measured",
    "usedForPricing": 6450
  }
```

### Scenario 4: Commercial Property

```
Step 2: Property Details
├─ User selects "Commercial" property type
├─ Types "456 Business Park Dr"
├─ Selects from autocomplete
├─ Area estimated: 15,000 sq ft (commercial default)
├─ User draws boundary
├─ Area calculated: 22,350 sq ft (measured)
└─ Proceeds to Step 3

Quote Summary:
  Lawn Size: 22,350 sq ft (measured)
  Property Type: Commercial
```

---

## Configuration Guide

### Setting Default Area Estimates

**Edit your config file:**

```json
{
  "clientId": "your-client",
  "defaultAreaEstimates": {
    "residential": 8000,      // Default for residential
    "commercial": 15000,      // Default for commercial
    "zipOverrides": {
      "94043": 12000,         // Mountain View, CA
      "10001": 6000,          // NYC Manhattan
      "90210": 15000,         // Beverly Hills
      "78701": 7500           // Austin, TX
    }
  }
}
```

**How to choose values:**

1. **Research your service area:**
   - Look up average lot sizes in your ZIP codes
   - Consider urban vs suburban differences
   - Account for property type variations

2. **Set conservative defaults:**
   - Residential: 7,000 - 10,000 sq ft typical
   - Commercial: 12,000 - 20,000 sq ft typical

3. **Add ZIP overrides for:**
   - Dense urban areas (smaller lots)
   - Suburban areas (larger lots)
   - High-value neighborhoods
   - Areas with known characteristics

### Example Regional Configurations

**Urban Client (NYC):**
```json
"defaultAreaEstimates": {
  "residential": 5000,
  "commercial": 10000,
  "zipOverrides": {
    "10001": 4000,  // Manhattan - very small
    "10003": 3500,
    "11201": 6000   // Brooklyn - slightly larger
  }
}
```

**Suburban Client (Texas):**
```json
"defaultAreaEstimates": {
  "residential": 10000,
  "commercial": 20000,
  "zipOverrides": {
    "78701": 8000,  // Downtown Austin
    "78732": 15000  // Suburban Austin
  }
}
```

**Mixed Client (California):**
```json
"defaultAreaEstimates": {
  "residential": 8000,
  "commercial": 15000,
  "zipOverrides": {
    "94102": 5000,  // San Francisco
    "94040": 10000, // Mountain View
    "94022": 12000  // Los Altos
  }
}
```

---

## Technical Details

### Autocomplete Initialization

**When it happens:**
- After Google Maps API loads
- When Step 2 is rendered
- Automatically bound to address input

**What it does:**
```javascript
autocomplete = new google.maps.places.Autocomplete(addressInput, {
  types: ['address'],
  fields: ['address_components', 'geometry', 'formatted_address', 'name']
});

autocomplete.bindTo('bounds', map); // Bias to current viewport
autocomplete.addListener('place_changed', onPlaceChanged);
```

### Place Change Handler

**Triggered when:**
- User selects from autocomplete dropdown
- Executes automatically

**Actions:**
1. Extract place data
2. Update state.address
3. Extract ZIP code
4. Recenter map to place
5. Estimate area if no polygon
6. Update UI instructions

### Area Estimation Logic

```javascript
function estimateAreaFromAddress() {
  let estimatedArea = 0;
  
  // Priority 1: ZIP override
  if (state.zipCode && config.defaultAreaEstimates.zipOverrides[state.zipCode]) {
    estimatedArea = config.defaultAreaEstimates.zipOverrides[state.zipCode];
  }
  
  // Priority 2: Property type default
  if (!estimatedArea) {
    estimatedArea = state.propertyType === 'commercial' 
      ? config.defaultAreaEstimates.commercial 
      : config.defaultAreaEstimates.residential;
  }
  
  // Set state
  state.estimatedAreaSqft = estimatedArea;
  state.lawnSizeSqFt = estimatedArea;
  state.areaSource = 'estimated';
  
  updateLawnSizeDisplay(true); // true = estimated
}
```

### Measured Area Calculation

```javascript
function calculatePolygonArea() {
  const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
  const sqFt = Math.round(area * 10.7639); // m² to ft²
  
  state.measuredAreaSqft = sqFt;
  state.lawnSizeSqFt = sqFt;
  state.estimatedAreaSqft = 0;
  state.areaSource = 'measured';
  
  updateLawnSizeDisplay(false); // false = measured
}
```

---

## Submission Payload

### Complete Payload Structure

```json
{
  "clientId": "example-lawn",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "propertyType": "residential",
  "primaryService": "mowing",
  "addOns": ["edging", "bush_trimming"],
  "lawnSizeSqFt": 7234,
  "lawnSizeTier": "medium",
  "frequency": "bi_weekly",
  
  "areaData": {
    "measuredAreaSqft": 7234,
    "estimatedAreaSqft": 8000,
    "areaSource": "measured",
    "usedForPricing": 7234
  },
  
  "pricing": {
    "estimatedPerVisit": 85,
    "estimatedMonthlyTotal": 170,
    "currencySymbol": "$"
  },
  
  "lead": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "address": "742 Evergreen Terrace, Springfield, IL 62704",
    "zipCode": "62704",
    "preferredTime": "Weekday mornings"
  },
  
  "tracking": {
    "utm_source": "google",
    "gclid": "abc123"
  }
}
```

### Using Payload Data

**Backend Analytics:**
```python
# Differentiate measured vs estimated quotes
if payload['areaData']['areaSource'] == 'measured':
    accuracy_level = 'high'
    confidence = 0.95
else:
    accuracy_level = 'medium'
    confidence = 0.70

# Track conversion rates by accuracy
track_conversion(payload['clientId'], accuracy_level)
```

**Billing Logic:**
```python
# Charge more for measured quotes (premium service)
if payload['areaData']['areaSource'] == 'measured':
    quote_tier = 'premium'
    commission_rate = 0.15
else:
    quote_tier = 'standard'
    commission_rate = 0.10
```

---

## Visual Indicators

### Lawn Size Display

**Measured (Green):**
```
┌─────────────────────────────────┐
│ Lawn Size: 7,234 sq ft (measured) │  ← Green background
└─────────────────────────────────┘
```

**Estimated (Yellow):**
```
┌─────────────────────────────────┐
│ Lawn Size: 8,000 sq ft (estimated) │  ← Yellow background
└─────────────────────────────────┘
```

### Map Instructions

**After Address Selection (No Polygon):**
```
✓ Property located! Area estimated at 8,000 sq ft. 
Draw boundary for accurate measurement.
```

**After Drawing Polygon:**
```
✓ Measured area! Drag corners to adjust. 
This measured area will be used for your quote.
```

**After Clearing Polygon:**
```
Boundary cleared. Using estimated area. 
Draw boundary for accurate measurement.
```

---

## Best Practices

### For Clients

1. **Configure ZIP overrides** for all major service areas
2. **Test with real addresses** in your territory
3. **Monitor measured vs estimated** conversion rates
4. **Adjust defaults** based on actual lot sizes
5. **Encourage polygon drawing** for accuracy

### For Users

1. **Type full address** for best results
2. **Select from dropdown** (don't just type and submit)
3. **Draw boundary** for accurate quote
4. **Adjust corners** to match exact service area
5. **Clear and redraw** if needed

### For Developers

1. **Always check `areaSource`** in backend
2. **Log both measured and estimated** values
3. **Track conversion by source** type
4. **Use ZIP data** for market research
5. **Monitor autocomplete** usage patterns

---

## Troubleshooting

### Autocomplete Not Showing

**Issue:** No dropdown when typing
- **Fix:** Check Places API is enabled
- **Fix:** Verify API key has Places API access
- **Fix:** Check browser console for errors

### Wrong Area Estimates

**Issue:** Estimated areas seem off
- **Fix:** Review `defaultAreaEstimates` in config
- **Fix:** Add ZIP overrides for your service area
- **Fix:** Test with known addresses

### Map Not Recentering

**Issue:** Map stays in same place after selection
- **Fix:** Check `place.geometry` exists
- **Fix:** Verify map is initialized
- **Fix:** Check console for geocoding errors

### Measured Area Not Saving

**Issue:** Polygon drawn but area not measured
- **Fix:** Ensure Geometry library is loaded
- **Fix:** Check polygon listeners attached
- **Fix:** Verify `calculatePolygonArea()` called

---

## Testing Checklist

- [ ] Autocomplete shows suggestions when typing
- [ ] Selecting address recenters map
- [ ] ZIP code extracted correctly
- [ ] Estimated area displays with yellow background
- [ ] Drawing polygon shows green "measured" display
- [ ] Clearing polygon reverts to estimated
- [ ] Step 3 shows correct area source
- [ ] Payload includes all area data fields
- [ ] Commercial properties use correct default
- [ ] ZIP overrides work as configured

---

## Future Enhancements

Potential additions:

1. **Parcel Boundary API Integration**
   - Fetch actual property boundaries
   - Auto-draw precise lot outlines

2. **Satellite Image Analysis**
   - ML-based lawn area detection
   - Automatic boundary suggestion

3. **Historical Data**
   - Use previous quotes in area
   - Improve estimation accuracy

4. **Weather Integration**
   - Adjust pricing by climate zone
   - Seasonal service recommendations

5. **Competitive Pricing**
   - Market-based area estimates
   - ZIP-level price optimization

---

**Your widget now provides intelligent area estimation with clear differentiation between measured and estimated values, giving you data-driven insights for pricing and analytics!** 🎯
