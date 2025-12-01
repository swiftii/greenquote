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

## How to Deploy to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., `lawn-care-widgets`)
4. Choose "Public" (required for GitHub Pages)
5. Click "Create repository"

### Step 2: Upload Files

1. Download all files from this project
2. In your new GitHub repository, click "Add file" > "Upload files"
3. Drag and drop all the project files and folders:
   - `/widgets/` folder
   - `/configs/` folder
   - `README.md`
4. Click "Commit changes"

### Step 3: Enable GitHub Pages

1. In your repository, click "Settings"
2. Scroll down to "Pages" in the left sidebar
3. Under "Source", select "main" branch
4. Click "Save"
5. Wait 2-3 minutes for deployment

### Step 4: Find Your Widget URL

Your widget will be available at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/widgets/lawn/v1/index.html?client=default
```

Replace:
- `YOUR-USERNAME` with your GitHub username
- `YOUR-REPO-NAME` with your repository name

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
  src="https://YOUR-USERNAME.github.io/YOUR-REPO/widgets/lawn/v1/index.html?client=YOUR-CLIENT"
  style="width:100%; max-width:480px; height:850px; border:0; overflow:hidden; margin:0 auto; display:block;"
  loading="lazy"
  title="Lawn Care Quote Calculator"
></iframe>
```

3. Replace:
   - `YOUR-USERNAME`: Your GitHub username
   - `YOUR-REPO`: Your repository name
   - `YOUR-CLIENT`: Your client config name (e.g., `johnsons-lawn`)

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

Visit your GitHub Pages URL:

```
https://YOUR-USERNAME.github.io/YOUR-REPO/widgets/lawn/v1/index.html?client=default
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