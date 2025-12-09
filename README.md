# Lawn Care Quote Widget System

A complete, production-ready lawn care pricing widget that can be hosted on GitHub Pages and embedded on any website using an iframe.

## What This Is

This is a static HTML/CSS/JavaScript widget system that:
- Calculates instant lawn care quotes based on property size and service selection
- Uses Google Maps to measure property size automatically
- Allows customers to adjust property boundaries manually
- Collects lead information
- Sends data to webhooks (perfect for GoHighLevel integration)
- Tracks usage per client for billing purposes

## Features

✅ **No build tools required** - Pure HTML, CSS, and JavaScript
✅ **Mobile-first design** - Optimized for all screen sizes
✅ **Google Maps integration** - Automatic property size calculation
✅ **Manual adjustment** - Customers can draw/adjust property boundaries
✅ **Customizable pricing** - Configure per client via JSON files
✅ **Webhook integration** - Sends leads to GoHighLevel or any webhook
✅ **Usage tracking** - Monitors quote submissions per client
✅ **UTM tracking** - Captures marketing attribution data
✅ **Pro Field Interface** - Internal quoting app for field teams

## Deployment

This application is deployed on Vercel with a custom domain:

### Production URL

Your widget is accessible at:

```
https://app.getgreenquote.com/widgets/lawn/v1/index.html?client=default
```

### Pro Interface URL

The field team interface is available at:

```
https://app.getgreenquote.com/pro/index.html?client=default
```

Replace `client=default` with your specific client configuration name.

## How to Create a New Client Config

### Step 1: Copy the Example Config

1. Go to the `/configs/` folder
2. Copy `example-lawn.json`
3. Rename it to your client's name (e.g., `johnsons-lawn.json`)

### Step 2: Edit the Config File

Open your new config file and customize:

```json
{
  "clientId": "johnsons-lawn",
  "businessName": "Johnson's Lawn Service",
  "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY",
  "ghlWebhookUrl": "YOUR_GHL_WEBHOOK_URL",
  "monthlyQuoteLimit": 100,
  "theme": {
    "primaryColor": "#2e7d32",
    "accentColor": "#e8f5e9"
  }
}
```

**Important fields:**

- `clientId`: Unique identifier for this client
- `businessName`: Displayed in the widget header
- `googleMapsApiKey`: Get from [Google Cloud Console](https://console.cloud.google.com/)
- `ghlWebhookUrl`: Your GoHighLevel webhook URL
- `centralWebhookUrl`: The central tracking webhook (same for all clients)
- `monthlyQuoteLimit`: Number of quotes included in client's plan
- `baseVisitFee`: Base price for any service visit
- `lawnSizeTiers`: Pricing based on property size
- `frequencyMultipliers`: Discounts for recurring services
- `addOns`: Additional services with pricing
- `theme`: Colors and styling

### Step 3: Upload the Config

1. In your GitHub repository, navigate to `/configs/`
2. Click "Add file" > "Upload files"
3. Upload your new config file
4. Click "Commit changes"

## How to Add Your Google Maps API Key

### Option 1: Use the Admin Panel (Easiest)

1. Open `admin.html` in your browser (locally or after deploying)
2. Select your client configuration
3. Paste your Google Maps API key
4. Click "Test API Key" to verify it works
5. Click "Save Configuration" to download the updated config file
6. Replace the config file in your `/configs/` folder
7. Commit and push to GitHub

### Option 2: Edit Config File Manually

1. Open your config file (e.g., `configs/example-lawn.json`)
2. Find the `googleMapsApiKey` field
3. Replace the empty string with your API key:
   ```json
   "googleMapsApiKey": "AIzaSyABCDEF1234567890..."
   ```
4. Save and commit the file

## How to Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs:
   - **Maps JavaScript API** - For displaying maps
   - **Geocoding API** - For address lookup
   - **Places API** - For address autocomplete
4. Go to "Credentials" and create an API key
5. Copy the API key
6. Use the Admin Panel or manually edit your config file (see above)

**Note:** The widget works without an API key (using mock data), but the maps functionality requires a valid key for production use.

## How to Embed on GoHighLevel

### Method 1: Custom HTML Element (Recommended)

1. In your GHL funnel/website, add a "Custom HTML" element
2. Paste this code:

```html
<iframe
  src="https://app.getgreenquote.com/widgets/lawn/v1/index.html?client=YOUR-CLIENT"
  style="width:100%; max-width:480px; height:850px; border:0; overflow:hidden; margin:0 auto; display:block;"
  loading="lazy"
  title="Lawn Care Quote Calculator"
></iframe>
```

3. Replace:
   - `YOUR-CLIENT`: Your client config name (e.g., `example-lawn`)

### Method 2: Direct Embed in Page Code

1. Edit your page in GHL
2. Go to "Settings" > "Tracking Code"
3. Add the iframe code in the "Header Code" or "Body Code" section

## How to Embed on Other Platforms

### WordPress

1. Edit your page/post
2. Add a "Custom HTML" block
3. Paste the iframe code

### Wix

1. Add an "Embed" element
2. Choose "Custom Code"
3. Paste the iframe code

### Squarespace

1. Add a "Code" block
2. Paste the iframe code

## How Updates Work

One of the best features of this system:

**When you update any file in your GitHub repository (JavaScript, CSS, or configs), ALL embedded widgets automatically get the updates!**

No need to update embed codes on multiple websites. Just:

1. Edit the file in GitHub
2. Commit changes
3. Wait 1-2 minutes for GitHub Pages to deploy
4. All widgets across all websites update automatically

## Webhook Integration

### Central Webhook (Usage Tracking)

The widget sends all submissions to a central webhook first. This webhook should:

1. Track how many quotes each client has used this month
2. Compare against their `monthlyQuoteLimit`
3. Log whether the submission is "within_limit" or "over_limit" (for billing)
4. Forward the submission to the client's GHL webhook
5. Return usage statistics

**Example response:**

```json
{
  "status": "ok",
  "planStatus": "within_limit",
  "usedThisMonth": 45,
  "monthlyLimit": 100
}
```

**Important:** The widget will NEVER block users from getting quotes, even if the client is over their limit. Limits are only for billing purposes.

### Client Webhook (GoHighLevel)

Each client config includes a `ghlWebhookUrl`. The central webhook forwards all submissions here.

**Payload structure:**

```json
{
  "clientId": "example-lawn",
  "timestamp": "2025-01-15T10:30:00Z",
  "propertyType": "residential",
  "primaryService": "mowing",
  "addOns": ["edging", "bush_trimming"],
  "lawnSizeSqFt": 8500,
  "frequency": "bi_weekly",
  "pricing": {
    "estimatedPerVisit": 85,
    "estimatedMonthlyTotal": 170
  },
  "lead": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "address": "123 Main St, City, State",
    "preferredTime": "Weekday mornings"
  },
  "tracking": {
    "utm_source": "google",
    "utm_campaign": "summer2025",
    "gclid": "abc123"
  }
}
```

## File Structure

```
/
├── widgets/
│   └── lawn/
│       └── v1/
│           ├── index.html       # Widget HTML page
│           ├── widget.js        # Main JavaScript logic
│           └── styles.css       # All styling
├── configs/
│   ├── default.json            # Default configuration
│   └── example-lawn.json       # Example client config
└── README.md                    # This file
```

## Customization Options

### Colors and Branding

Edit the `theme` section in your config:

```json
"theme": {
  "primaryColor": "#2e7d32",     // Main brand color
  "accentColor": "#e8f5e9",      // Light background color
  "borderRadius": "16px"         // Corner roundness
}
```

### Pricing Tiers

Adjust the `lawnSizeTiers` to match your pricing:

```json
"lawnSizeTiers": [
  {
    "id": "small",
    "label": "0–5,000 sq ft",
    "pricePerVisit": 40
  }
]
```

### Frequency Discounts

Modify `frequencyMultipliers` to offer discounts:

```json
"frequencyMultipliers": {
  "weekly": 0.85,      // 15% discount
  "bi_weekly": 0.95,   // 5% discount
  "monthly": 1.0       // No discount
}
```

### Services and Add-ons

Customize available services:

```json
"services": [
  { "id": "mowing", "label": "Lawn Mowing" },
  { "id": "custom", "label": "Custom Service" }
],
"addOns": [
  {
    "id": "edging",
    "label": "Edging",
    "pricePerVisit": 15
  }
]
```

## Testing Your Widget

### Local Testing

1. Open `widgets/lawn/v1/index.html` directly in your browser
2. The widget will load with the default config

### Testing Different Configs

Add `?client=example-lawn` to the URL:

```
file:///path/to/widgets/lawn/v1/index.html?client=example-lawn
```

### Testing After Deployment

Visit the production URL:

```
https://app.getgreenquote.com/widgets/lawn/v1/index.html?client=default
```

## Troubleshooting

### Widget Not Loading

- Check browser console for errors (F12)
- Verify config file exists and is valid JSON
- Make sure GitHub Pages is enabled

### Maps Not Working

- Verify Google Maps API key is valid
- Check that required APIs are enabled in Google Cloud Console
- The widget works without maps (using mock data) if API key is missing

### Webhook Not Receiving Data

- Check webhook URL in config file
- Look at browser console for network errors
- Test webhook with a tool like [Webhook.site](https://webhook.site)

### Styling Issues

- Clear browser cache (Ctrl+F5)
- Check that styles.css is loading properly
- Verify iframe has correct height (850px recommended)

## Support

For questions or issues:
1. Check the browser console for error messages
2. Verify your config file is valid JSON
3. Test with the default config first

## Version History

- **v1** (Current) - Initial release with full functionality

## License

This widget system is provided as-is for use with your lawn care business or client websites.

---

**Need help?** Check the troubleshooting section or review the example config files for reference.

**You're all set!** Start customizing and deploying. 🚀

---

## GreenQuote Pro - Internal Field Quoting

### What is GreenQuote Pro?

GreenQuote Pro is an internal quoting interface designed for your field teams (owners, techs, sales reps) to create quotes on-site using phones or tablets.

**Key Benefits:**
- Same pricing and configuration as your public widget
- Mobile-optimized for field use
- Works with the same Google Maps integration
- Submits to the same central webhook
- No CRM dependency required

### Accessing the Pro Interface

**URL Pattern:**
```
https://YOUR-USERNAME.github.io/YOUR-REPO/pro/index.html?client=CLIENT-NAME
```

**Example:**
```
https://yourusername.github.io/lawn-widget/pro/index.html?client=example-lawn
```

### Pro Interface Features

**Customer Information:**
- First name, last name (required)
- Phone number (required)
- Email (optional)
- Notes field for gate codes, special instructions

**Property Location:**
- Address search with autocomplete
- Google Maps satellite view
- Draw boundaries for precise measurements
- Estimated area based on ZIP/property type

**Service & Pricing:**
- Same services and add-ons as public widget
- Same frequency options
- Real-time pricing calculations
- Shows measured vs estimated area

**Actions:**
- Save quote to central webhook
- Optional: Send quote to customer email
- Copy quote summary to clipboard
- Create new quote

### How It Works

1. **Field team opens Pro interface** on their phone
2. **Enters customer info** and property address
3. **Draws lawn boundary** on satellite map for accuracy
4. **Selects services** and frequency
5. **Saves quote** - automatically sent to your webhook
6. **Quote tracked** in your system, flagged as "internal"

### Differences from Public Widget

| Feature | Public Widget | Pro Interface |
|---------|--------------|---------------|
| Purpose | Customer self-service | Internal field use |
| Workflow | 3-step wizard | Single-page mobile form |
| Branding | Customer-facing | Internal team tool |
| Data | Lead capture | Operator + customer data |
| Submission | "Lead" mode | "Internal" mode |
| Design | Marketing-focused | Utility-focused |

### Configuration

**Pro interface uses the same config files:**
- `/configs/default.json`
- `/configs/your-client.json`

**No separate configuration needed!**

All pricing, services, add-ons, and Google Maps settings are shared between the public widget and Pro interface.

### Webhook Payload

Quotes from Pro interface include:

```json
{
  "mode": "internal",
  "source": "greenquote_pro",
  "lead": {
    "firstName": "John",
    "lastName": "Smith",
    "phone": "555-123-4567",
    "notes": "Gate code: 1234"
  },
  "operator": {
    "name": "Sarah (Sales Rep)",
    "timestamp": "2025-01-15T14:30:00Z"
  },
  "actions": {
    "sendCustomerEmail": true
  }
}
```

Your webhook can distinguish between public widget leads and internal Pro quotes using the `mode` and `source` fields.

### Mobile Optimization

Pro interface is optimized for:
- iOS Safari (iPhone, iPad)
- Android Chrome
- Touch-friendly UI
- Large buttons and inputs
- Minimal data usage
- Works offline (with cached config)

### Use Cases

**Perfect for:**
- Door-to-door sales teams
- On-site estimates
- Service truck tablets
- Owner/manager field quoting
- Trade show quotes
- Quick property assessments

**Typical workflow:**
```
Field Rep → Visits Property → Opens Pro on Phone → 
Creates Quote On-Site → Sends to Customer → 
Quote Logged in System → Follow-up Automated
```

### Security Notes

**The Pro interface:**
- Does NOT require authentication (add your own if needed)
- Uses same webhook as public widget
- Includes operator tracking for accountability
- Can be password-protected via hosting (optional)

**Recommended:** If deploying publicly accessible Pro interface, consider:
- Password protection via hosting provider
- IP allowlist for your team
- Or keep URL private/internal only

---