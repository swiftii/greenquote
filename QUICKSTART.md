# Quick Start Guide

Get your lawn care widget running in 5 minutes!

## 🚀 Super Quick Start

### 1. Deploy to GitHub Pages (2 minutes)

```bash
# Create a new repo on GitHub, then:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Enable GitHub Pages in Settings → Pages → Select "main" branch

**Your widget URL:**
```
https://YOUR-USERNAME.github.io/YOUR-REPO/widgets/lawn/v1/index.html?client=default
```

### 2. Embed Anywhere (30 seconds)

Copy this code to your website:

```html
<iframe
  src="https://YOUR-USERNAME.github.io/YOUR-REPO/widgets/lawn/v1/index.html?client=default"
  style="width:100%; max-width:480px; height:850px; border:0;"
  loading="lazy"
></iframe>
```

**That's it!** Your widget is live and working.

---

## 🎨 Customize for Your First Client (5 minutes)

### Step 1: Copy Example Config

```bash
cp configs/example-lawn.json configs/my-first-client.json
```

### Step 2: Edit Your Config

Open `configs/my-first-client.json` and change:

```json
{
  "clientId": "my-first-client",
  "businessName": "Green Lawn Services",
  "googleMapsApiKey": "",  // Add your API key here (optional)
  "ghlWebhookUrl": "https://your-ghl-webhook-url",
  
  "baseVisitFee": 30,
  "theme": {
    "primaryColor": "#2e7d32",  // Your brand color
    "accentColor": "#e8f5e9"
  }
}
```

### Step 3: Update Pricing

Adjust prices in the same file:

```json
"lawnSizeTiers": [
  {
    "id": "small",
    "label": "0–5,000 sq ft",
    "pricePerVisit": 40  // ← Change this
  }
],
"addOns": [
  {
    "id": "edging",
    "label": "Edging",
    "pricePerVisit": 15  // ← Change this
  }
]
```

### Step 4: Push & Use

```bash
git add configs/my-first-client.json
git commit -m "Add first client config"
git push
```

Wait 1 minute, then use:
```
?client=my-first-client
```

---

## 🗺️ Add Google Maps (Optional)

### Why Add Maps?

- Auto-calculates property size from satellite imagery
- Customers can draw/adjust boundaries
- Professional experience

### Get API Key (Free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Create credentials → API Key
5. Copy key to your config:

```json
"googleMapsApiKey": "YOUR_KEY_HERE"
```

**Widget works without maps** (uses mock property sizes)

---

## 📊 Usage Tracking Setup

### How It Works

1. All quotes go to central webhook first
2. Central webhook tracks usage per client
3. Forwards to client's GHL webhook
4. Returns usage stats

### Central Webhook Structure

Your central webhook should:

```javascript
// Pseudo-code
POST /quotes (payload) {
  1. Identify client from payload.clientId
  2. Count quotes used this month
  3. Check if over monthlyQuoteLimit
  4. Log for billing: "within_limit" or "over_limit"
  5. Forward to payload.ghlWebhookUrl
  6. Return: {
       status: "ok",
       planStatus: "within_limit",
       usedThisMonth: 45,
       monthlyLimit: 100
     }
}
```

**Important:** Widget never blocks users. Limits are for billing only.

---

## 🔗 GoHighLevel Integration

### Get Your Webhook URL

1. In GHL, go to Settings → Integrations
2. Create new Webhook
3. Copy the webhook URL
4. Add to your config:

```json
"ghlWebhookUrl": "https://your-ghl-instance.com/webhook/abc123"
```

### What GHL Receives

```json
{
  "lead": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "address": "123 Main St"
  },
  "pricing": {
    "estimatedPerVisit": 85,
    "estimatedMonthlyTotal": 170
  },
  "tracking": {
    "utm_source": "google",
    "gclid": "abc123"
  }
}
```

Map these fields to your GHL contact fields!

---

## 🎯 Common Scenarios

### Multiple Clients, Same Repo

Just create multiple config files:

```
configs/
  client-a.json
  client-b.json
  client-c.json
```

Use different URLs:
- `?client=client-a`
- `?client=client-b`
- `?client=client-c`

### Different Pricing Per Client

Each config has its own pricing. Easy!

### Custom Branding

Each config can have different:
- Business name
- Colors
- Services
- Add-ons
- Pricing

### Testing Changes

1. Make changes locally
2. Open `widgets/lawn/v1/index.html?client=test` in browser
3. Test thoroughly
4. Push to GitHub
5. All embeds update automatically!

---

## 🐛 Troubleshooting

### Widget Not Loading

- Check browser console (F12)
- Verify GitHub Pages is enabled
- Check config file is valid JSON
- Wait 1-2 minutes after pushing changes

### Maps Not Working

- Without API key: Widget uses mock property sizes (this is fine!)
- With API key: Check key is valid and APIs are enabled

### Form Not Submitting

- Check webhook URL in config
- Look at browser console for errors
- Test webhook with [Webhook.site](https://webhook.site)

---

## 📚 What's Next?

1. **Read full README.md** - Detailed docs for everything
2. **Customize configs** - Set up all your clients
3. **Get Google Maps key** - For the full experience
4. **Set up webhooks** - Connect to GHL
5. **Test thoroughly** - Make sure everything works
6. **Deploy** - Embed on client sites

---

## 💡 Pro Tips

- **Version control your configs** - Always commit config changes
- **Test with `?client=test`** - Before pushing to production
- **Use meaningful clientIds** - Like `johnsons-lawn` not `client1`
- **Keep pricing consistent** - Across similar service tiers
- **Monitor webhook logs** - To ensure leads are flowing
- **Ask for Google reviews** - After successful quote submission

---

## 🆘 Need Help?

- Check browser console for errors
- Validate JSON files at [JSONLint.com](https://jsonlint.com)
- Test webhooks at [Webhook.site](https://webhook.site)
- Review README.md for detailed documentation

---

**You're all set!** Start customizing and deploying. 🚀
