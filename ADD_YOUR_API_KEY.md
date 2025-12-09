# Add Your Google Maps API Key - Simple Guide

## 3 Easy Ways to Add Your API Key

You now have 3 options to add your Google Maps API key. Choose the one that works best for you:

---

## ⚡ Option 1: Interactive Setup Page (Easiest)

**Perfect if you:** Want a visual interface

### Steps:

1. **Open the setup page:**
   ```
   Visit: https://app.getgreenquote.com/setup-api-key.html
   ```

2. **Paste your API key** in the input field

3. **Click "Generate Updated Config Files"**

4. **Download both files:**
   - `default.json`
   - `example-lawn.json`

5. **Replace the files** in your `/app/configs/` folder

6. **Done!** Your widget now has Google Maps enabled

---

## 🖥️ Option 2: Command Line (Fastest)

**Perfect if you:** Like using terminal

### Steps:

1. **Open terminal** and navigate to your project:
   ```bash
   cd /app
   ```

2. **Run the script** with your API key:
   ```bash
   ./add-api-key.sh YOUR_GOOGLE_MAPS_API_KEY
   ```
   
   **Example:**
   ```bash
   ./add-api-key.sh AIzaSyABCDEF1234567890_YourActualKey
   ```

3. **Done!** The script automatically:
   - Backs up your existing configs
   - Adds your API key to both config files
   - Confirms success

---

## ✏️ Option 3: Manual Edit (Most Control)

**Perfect if you:** Want to edit files directly

### Steps:

1. **Open** `/app/configs/default.json`

2. **Find this line:**
   ```json
   "googleMapsApiKey": "",
   ```

3. **Replace with your key:**
   ```json
   "googleMapsApiKey": "AIzaSyYOUR_ACTUAL_KEY_HERE",
   ```

4. **Save the file**

5. **Repeat for** `/app/configs/example-lawn.json`

6. **Done!**

---

## 🧪 Test Your Setup

After adding your API key:

### 1. Start the widget:
```bash
# If not already running
cd /app
python3 -m http.server 8080
```

### 2. Open in browser:
```
http://localhost:8080/widgets/lawn/v1/index.html?client=example-lawn
```

### 3. Test the maps:

**Step 1:** Select a service (e.g., "Lawn Mowing")
- Click "Next"

**Step 2:** Enter a real address:
```
Examples:
• 1600 Amphitheatre Parkway, Mountain View, CA
• 1 Apple Park Way, Cupertino, CA
• Your home address
```

**Step 3:** Click "Calculate Size"

### ✅ Expected Result:

You should now see:
- 🛰️ **Satellite imagery** of the property
- 🟢 **Green boundary** overlay on the lawn
- 📏 **Accurate square footage** calculated
- ✏️ **Draggable corners** to adjust the area
- 🎨 **"Adjust Boundary"** button to redraw

---

## 🔍 Verify It's Working

### Check the Console:

1. Open browser DevTools (F12)
2. Go to "Console" tab
3. You should see:
   ```
   [Widget] Config loaded: {...}
   [Widget] Google Maps API loaded
   [Widget] Google Maps initialized successfully
   ```

### Visual Confirmation:

**Before (Mock Mode):**
```
┌─────────────────────────┐
│ Map Preview Unavailable │
│  Add Google Maps API    │
└─────────────────────────┘
```

**After (With API Key):**
```
┌─────────────────────────┐
│  🛰️ Satellite Image    │
│    [Property View]      │
│  🟢 Green Boundary      │
└─────────────────────────┘
```

---

## 📂 What Gets Updated

Both config files will have this change:

**Before:**
```json
{
  "clientId": "example-lawn",
  "businessName": "Green Valley Lawn Care",
  "googleMapsApiKey": "",           ← Empty
  ...
}
```

**After:**
```json
{
  "clientId": "example-lawn",
  "businessName": "Green Valley Lawn Care",
  "googleMapsApiKey": "AIzaSy...",  ← Your Key
  ...
}
```

Everything else stays the same!

---

## 🎯 Quick Troubleshooting

### Issue: Still seeing "Mock Mode"

**Fix:**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check config file was actually updated
- Verify API key starts with "AIza"
- Restart your local server

### Issue: "Request denied" error

**Fix:**
- Enable required APIs in Google Cloud Console:
  - ✅ Maps JavaScript API
  - ✅ Geocoding API
  - ✅ Places API
- Check API key restrictions aren't too tight

### Issue: Gray map, no satellite view

**Fix:**
- Address might be too vague (add more details)
- Try a well-known address first
- Check zoom level (should be 18-20)

### Issue: Can't drag boundary corners

**Fix:**
- Make sure map fully loaded
- Try clicking directly on corner circles
- Check console for JavaScript errors

---

## 🔐 Security Reminder

### After Adding Your Key:

1. **Never commit to public repos:**
   ```bash
   # Add to .gitignore
   echo "configs/*" >> .gitignore
   ```

2. **Add restrictions** in Google Cloud Console:
   - Go to Credentials
   - Click your API key
   - Add HTTP referrer restrictions
   - Limit to your domain(s)

3. **Set usage limits:**
   - Prevent unexpected charges
   - Monitor usage regularly
   - Set billing alerts

---

## 💡 Pro Tips

### Tip 1: Same Key for All Configs
You can use the same Google Maps API key in all your config files. No need to create separate keys for each client.

### Tip 2: Environment Variables (Production)
For production deployments, consider using environment variables:
```javascript
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || config.googleMapsApiKey;
```

### Tip 3: Test with Known Addresses
Start testing with famous addresses (Apple Park, Google HQ, etc.) before using customer addresses.

### Tip 4: Monitor Usage
Check Google Cloud Console weekly to monitor:
- Number of map loads
- Geocoding requests
- Current costs
- Approaching limits

---

## 📊 What This Enables

With your API key added, customers can now:

✅ **See their property** - Real satellite imagery
✅ **Verify the area** - Visual confirmation of service area
✅ **Adjust boundaries** - Drag corners for accuracy
✅ **Redraw areas** - Custom shapes for irregular lots
✅ **Get accurate quotes** - Based on actual square footage
✅ **Trust the process** - Transparent, visual experience

---

## 🚀 Next Steps

After successfully adding your API key:

1. ✅ Test with multiple addresses
2. ✅ Try the boundary editing features
3. ✅ Complete a full quote flow
4. ✅ Deploy to GitHub Pages (if ready)
5. ✅ Embed on your client's website
6. ✅ Monitor usage in Google Cloud

---

## 📞 Need Help?

### Quick Checks:

```bash
# Verify API key is in config
cat /app/configs/example-lawn.json | grep googleMapsApiKey

# Should show:
# "googleMapsApiKey": "AIzaSy..."
```

### Still Having Issues?

1. Check browser console for errors
2. Verify all 3 APIs are enabled
3. Test API key in admin panel
4. Review TEST_MAPS_INTEGRATION.md
5. Check MAPS_SETUP_GUIDE.md

---

## ✨ Success Checklist

- [ ] Added API key to config files
- [ ] Reloaded/restarted widget
- [ ] Entered test address
- [ ] Saw satellite imagery load
- [ ] Green boundary appeared
- [ ] Can drag corners to edit
- [ ] Lawn size calculates correctly
- [ ] "Adjust Boundary" works
- [ ] No console errors

**All checked?** You're ready to go! 🎉

---

## Example: Complete Flow

```bash
# 1. Add your API key
./add-api-key.sh AIzaSyYourActualKeyHere

# 2. Start server (if needed)
python3 -m http.server 8080

# 3. Open widget
# Visit: http://localhost:8080/widgets/lawn/v1/index.html?client=example-lawn

# 4. Test it
# Step 1: Select "Lawn Mowing"
# Step 2: Enter "1600 Amphitheatre Parkway, Mountain View, CA"
# Step 3: Click "Calculate Size"
# Result: See Google HQ with boundary overlay! 🎉
```

---

**You're all set!** Your widget now has full Google Maps integration with satellite view and boundary editing. Time to get those accurate lawn quotes! 🌱
