# GreenQuote Pro - Field Quoting Interface Guide

## Complete Guide for Internal Field Use

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Interface Walkthrough](#interface-walkthrough)
4. [Using in the Field](#using-in-the-field)
5. [Pricing Logic](#pricing-logic)
6. [Webhook Integration](#webhook-integration)
7. [Mobile Tips](#mobile-tips)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What is GreenQuote Pro?

GreenQuote Pro is a mobile-optimized internal quoting tool for lawn care field teams. It reuses all the same configurations, pricing logic, and Google Maps integration as your public website widget, but in a streamlined interface designed for on-site use.

### Key Advantages

✅ **Same pricing as your website** - Consistency across all quotes
✅ **Mobile-first design** - Optimized for phones and tablets
✅ **Works in the field** - Perfect for door-to-door or on-site estimates
✅ **No CRM required** - Submit to central webhook like public widget
✅ **Operator tracking** - Know who created each quote
✅ **Offline capable** - Works with cached configs

### Who Should Use It?

- **Field sales reps** creating quotes at customer properties
- **Service technicians** providing on-spot estimates
- **Business owners** quoting while visiting job sites
- **Door-to-door teams** generating quotes in real-time
- **Trade show staff** creating instant quotes at events

---

## Getting Started

### Step 1: Access the Interface

**URL Format:**
```
https://YOUR-USERNAME.github.io/YOUR-REPO/pro/index.html?client=CLIENT-ID
```

**Example:**
```
https://greenquote.github.io/widgets/pro/index.html?client=johnsons-lawn
```

**Save to Home Screen (iOS):**
1. Open URL in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Icon appears like an app

**Save to Home Screen (Android):**
1. Open URL in Chrome
2. Tap menu (3 dots)
3. Select "Add to Home screen"
4. Shortcut created

### Step 2: Bookmark the Link

**Create bookmarks for each client:**
- `Pro - Johnson's Lawn` → `...pro/index.html?client=johnsons-lawn`
- `Pro - Smith Garden` → `...pro/index.html?client=smith-garden`
- `Pro - Default` → `...pro/index.html?client=default`

### Step 3: Understand the Layout

```
┌─────────────────────────────────┐
│ [Business Name] Pro   [Client]  │ ← Header
├─────────────────────────────────┤
│                                 │
│ 📝 Customer Information         │
│    [Form fields]                │
│                                 │
│ 📍 Property Location            │
│    [Address + Map]              │
│                                 │
│ 💰 Service & Pricing            │
│    [Services + Quote]           │
│                                 │
│ 👤 Created By                   │
│    [Your name]                  │
│                                 │
│ [💾 Save Quote]                 │ ← Sticky button
└─────────────────────────────────┘
```

---

## Interface Walkthrough

### Section 1: Customer Information

**Required Fields:**
- First Name
- Last Name
- Phone Number

**Optional Fields:**
- Email (recommended for sending quotes)
- Notes (gate codes, pets, special instructions)

**Example Notes:**
```
Gate code: 1234
Dog in backyard - careful!
Key under mat if nobody home
```

### Section 2: Property Location

**Property Type:**
- Residential (default estimate: 8,000 sq ft)
- Commercial (default estimate: 15,000 sq ft)

**Address Input:**
- Start typing address
- Select from autocomplete dropdown
- Map will auto-center to property

**Map Tools:**
- **📍 Locate** - Center map on entered address
- **✏️ Draw Area** - Draw boundary around lawn
- **🗑️ Clear** - Remove drawn boundary

**Area Display:**
- Green = Measured (from drawn polygon)
- Orange = Estimated (from defaults/ZIP)

**Pro Tip:** Always draw the boundary for accurate quotes!

### Section 3: Service & Pricing

**Primary Service:**
Select the main service (required):
- Lawn Mowing
- Fertilization
- Aeration
- Overseeding
- Leaf Cleanup
- etc.

**Add-ons:**
Select optional add-on services:
- ☐ Edging (+$15)
- ☐ Bush Trimming (+$30)
- ☐ Mulching (+$45)

**Frequency:**
Select how often:
- One-Time (1.0x price)
- Weekly (0.85x - 15% discount)
- Bi-Weekly (0.95x - 5% discount)
- Monthly (1.1x - 10% premium)

**Quote Summary:**
Once all fields are filled:
```
┌────────────────────────┐
│ Per Visit:    $85      │
│ Est. Monthly: $170     │
│                        │
│ Based on measured area │
│ (8,234 sq ft)          │
└────────────────────────┘
```

### Section 4: Created By

**Your Name:**
Enter your name so quotes can be tracked to the operator who created them.

Example: "Sarah - Sales Team" or "Mike Johnson"

### Section 5: Actions

**Save Quote Button:**
- Enabled when all required fields complete
- Submits quote to central webhook
- Shows success confirmation

**Send Quote to Customer:**
- ☐ Check this box to email quote to customer
- Requires valid email address
- Handled by your backend/automation

---

## Using in the Field

### Typical Workflow

**1. Arrive at Property**
```
Pull out phone/tablet
Open Pro interface (bookmarked)
Verify correct client loaded
```

**2. Collect Customer Info**
```
Ask for name and phone
"What's a good email for you?"
Note any gate codes or special instructions
```

**3. Locate & Measure Property**
```
Enter address in Pro interface
Wait for map to load
Walk property perimeter
Draw boundary on map matching lawn area
```

**4. Select Services**
```
"What service are you interested in?"
"Would you like weekly, bi-weekly, or monthly?"
"Any add-ons? We also do edging and trimming."
```

**5. Review & Save**
```
Show customer the quote on screen
"Here's what we can do for you..."
Enter your name as operator
Tap Save Quote
```

**6. Follow Up**
```
Check "Send quote to customer"
Quote emailed automatically
Or copy summary and text it
```

### Best Practices

**Before You Visit:**
- ✅ Test your bookmarked Pro link
- ✅ Ensure you have internet connection
- ✅ Bring power bank for your device
- ✅ Know your client's pricing structure

**While On-Site:**
- ✅ Always draw the boundary for accuracy
- ✅ Take photos for your records (separate)
- ✅ Double-check customer contact info
- ✅ Explain pricing clearly before saving

**After the Visit:**
- ✅ Verify quote saved successfully
- ✅ Follow up within 24 hours
- ✅ Check your system for the quote record

---

## Pricing Logic

### How Pricing Works

The Pro interface uses **identical pricing logic** to the public widget.

**Formula:**
```
Base Visit Price = Base Fee + Area Tier Price + Add-ons
Final Per Visit = Base Visit Price × Frequency Multiplier
Monthly Total = Per Visit × Visits per Month
```

**Example Calculation:**

```
Configuration:
- Base Fee: $30
- Area: 8,234 sq ft → Medium tier ($55)
- Add-ons: Edging ($15)
- Frequency: Bi-Weekly (0.95x)

Calculation:
Base = $30 + $55 + $15 = $100
Per Visit = $100 × 0.95 = $95
Monthly = $95 × 2 visits = $190
```

### Area Tiers

Default tiers (configurable per client):

| Tier | Range | Base Price |
|------|-------|------------|
| Small | 0-5,000 sq ft | $40 |
| Medium | 5,001-10,000 sq ft | $55 |
| Large | 10,001-20,000 sq ft | $75 |
| XL | 20,000+ sq ft | $100 |

### Frequency Multipliers

Default multipliers (configurable per client):

| Frequency | Multiplier | Meaning |
|-----------|------------|---------|
| One-Time | 1.0 | No discount |
| Weekly | 0.85 | 15% discount |
| Bi-Weekly | 0.95 | 5% discount |
| Monthly | 1.1 | 10% premium |

### Measured vs Estimated Area

**Measured (Accurate):**
- You drew a polygon on the map
- Area calculated from actual boundary
- Used for precise quotes
- Customer sees exact measurements

**Estimated (Approximate):**
- Based on property type + ZIP code
- Falls back to configured defaults
- Less accurate but faster
- Used when map unavailable

---

## Webhook Integration

### What Gets Sent

When you save a quote, the Pro interface sends data to the **same central webhook** as the public widget.

**Payload Structure:**

```json
{
  "mode": "internal",
  "source": "greenquote_pro",
  "clientId": "johnsons-lawn",
  "timestamp": "2025-01-15T14:30:00Z",
  
  "propertyType": "residential",
  "primaryService": "mowing",
  "addOns": ["edging"],
  "frequency": "bi_weekly",
  
  "areaData": {
    "measuredAreaSqft": 8234,
    "estimatedAreaSqft": 0,
    "areaSource": "measured",
    "usedForPricing": 8234
  },
  
  "pricing": {
    "estimatedPerVisit": 95,
    "estimatedMonthlyTotal": 190,
    "currencySymbol": "$"
  },
  
  "lead": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "address": "123 Main St, City, ST 12345",
    "zipCode": "12345",
    "notes": "Gate code: 1234"
  },
  
  "operator": {
    "name": "Sarah Johnson",
    "timestamp": "2025-01-15T14:30:00Z"
  },
  
  "actions": {
    "sendCustomerEmail": true
  }
}
```

### Key Differences from Public Widget

**Pro interface includes:**
- `"mode": "internal"` - Flag for internal quote
- `"source": "greenquote_pro"` - Identifies Pro interface
- `operator` object - Who created the quote
- `actions.sendCustomerEmail` - Customer notification flag

**Your webhook can:**
- Distinguish internal vs public quotes
- Track which rep created the quote
- Trigger different workflows
- Send customer emails when flagged

---

## Mobile Tips

### Optimizing for Field Use

**Battery Life:**
- Lower screen brightness
- Close unused apps
- Bring portable charger
- Use airplane mode when not needed

**Data Usage:**
- Maps use data - load area before arriving
- Configs cached after first load
- Satellite imagery is bandwidth-heavy
- Consider offline maps if available

**Screen Protection:**
- Use screen protector
- Consider waterproof case
- Clean screen regularly
- Adjust font size if needed

### iOS Specific

**Save to Home Screen:**
Makes Pro interface feel like native app

**Enable Location Services:**
Helps with address autocomplete

**Disable Auto-Lock:**
Settings → Display & Brightness → Auto-Lock → Never
(While using in field)

### Android Specific

**Chrome Data Saver:**
Helps reduce mobile data usage

**Keep Screen On:**
Developer Options → Stay Awake
(Only when needed)

**Install PWA:**
Chrome menu → Add to Home Screen
(Acts like installed app)

---

## Troubleshooting

### Common Issues

**Issue: "Loading..." never completes**

**Causes:**
- No internet connection
- Config file not found
- Wrong client parameter

**Fix:**
1. Check internet connection
2. Verify URL has correct client parameter
3. Try default client: `?client=default`
4. Reload page

---

**Issue: Map shows but address search doesn't work**

**Causes:**
- Google Maps API key missing
- Places API not enabled
- API quota exceeded

**Fix:**
1. Check if API key in config
2. Verify Places API enabled in Google Cloud
3. Check API usage in console
4. Use "Locate" button as fallback

---

**Issue: Can't draw on map**

**Causes:**
- No address located yet
- Map not fully loaded
- Drawing library not available

**Fix:**
1. Enter and locate address first
2. Wait for map to fully load
3. Tap "Draw Area" button
4. Try clearing and redrawing

---

**Issue: "Save Quote" button disabled**

**Causes:**
- Missing required fields
- No area calculated
- No service selected

**Fix:**
1. Check all required fields filled:
   - First name, last name, phone
   - Address located
   - Primary service selected
   - Frequency selected
2. Ensure area shows in display

---

**Issue: Quote saves but nothing happens**

**Causes:**
- Webhook URL incorrect
- Webhook server down
- Network timeout

**Fix:**
1. Check webhook URL in config
2. Test webhook with curl
3. Check browser console for errors
4. Quote may still be saved despite error

---

**Issue: Pricing seems wrong**

**Causes:**
- Using wrong client config
- Area tier miscalculated
- Frequency multiplier not applied

**Fix:**
1. Verify correct client in URL
2. Check area is correct tier
3. Review config pricing structure
4. Test with known values

---

### Getting Help

**Check:**
1. Browser console (F12 or inspect)
2. Config file loaded correctly
3. Internet connection stable
4. API keys valid

**Report Issues:**
Include:
- Device (iPhone 13, Samsung Galaxy, etc.)
- Browser (Safari, Chrome version)
- Client ID used
- Screenshot of issue
- Steps to reproduce

---

## Advanced Tips

### Multiple Clients

**Bookmark each client separately:**
```
Home Screen Folder: "Quotes"
├─ ABC Lawn Care Pro
├─ XYZ Garden Pro
└─ Default Pro
```

### Batch Quoting

**For events or door-to-door:**
1. Open multiple tabs (one per prospect)
2. Fill info as you go
3. Save all at end of day
4. Or use "Copy Summary" to save locally

### Offline Mode

**Prepare before going offline:**
1. Load Pro interface while online
2. Load target area in maps
3. Config cached automatically
4. Create quotes (saved when reconnected)

### Custom Operator Names

**Track by team or role:**
- "Sarah - North Territory"
- "Mike - Commercial Team"
- "Lisa - Door-to-Door"
- "Owner - John Smith"

---

## Summary

### Quick Reference Card

**Starting a Quote:**
1. Open bookmarked Pro link
2. Enter customer name & phone
3. Enter & locate address
4. Draw lawn boundary
5. Select service & frequency
6. Enter your name
7. Save quote

**Required Fields:**
- ✓ First name
- ✓ Last name
- ✓ Phone
- ✓ Address (located)
- ✓ Primary service
- ✓ Frequency

**Best Practice:**
Always draw the boundary for measured area!

---

**You're ready to use GreenQuote Pro in the field!** 📱✨
