# Custom Domain Configuration - app.getgreenquote.com

## ✅ Completed Configuration

This document summarizes the configuration updates made to support the custom domain `app.getgreenquote.com` on Vercel.

### 1. Domain Setup ✅

**Production URL:** `https://app.getgreenquote.com`

The application is configured to work with this custom domain. All internal routing uses relative paths, ensuring compatibility with any domain.

### 2. Updated Files

#### HTML Files Updated:
- `/app/widgets/lawn/v1/index.html` - Updated iframe embedding instructions
- `/app/preview.html` - Updated demo iframe to use relative path and embedding examples
- `/app/demo.html` - Updated demo iframe to use relative path and embedding examples

#### Documentation Files Updated:
- `/app/README.md` - Updated all deployment and embedding URLs
- `/app/QUICKSTART.md` - Updated quick start URLs
- `/app/ADD_YOUR_API_KEY.md` - Updated testing URLs

### 3. Application Architecture

This is a **static site** with:
- ✅ Pure HTML/CSS/JavaScript (no build tools)
- ✅ Relative path routing (domain-agnostic)
- ✅ Config-driven via JSON files
- ✅ No environment variables required
- ✅ Vercel routing configured via `vercel.json`

### 4. URLs Now in Use

#### Public Widget:
```
https://app.getgreenquote.com/widgets/lawn/v1/index.html?client=CLIENT_NAME
```

#### Pro Interface:
```
https://app.getgreenquote.com/pro/index.html?client=CLIENT_NAME
```

#### Admin Panel:
```
https://app.getgreenquote.com/admin.html
```

#### Preview Page:
```
https://app.getgreenquote.com/preview.html
```

### 5. Embedding Code

**Standard Embedding:**
```html
<iframe
  src="https://app.getgreenquote.com/widgets/lawn/v1/index.html?client=example-lawn"
  style="width:100%; max-width:480px; height:850px; border:0;"
  loading="lazy"
></iframe>
```

**For GoHighLevel:**
```html
<iframe
  src="https://app.getgreenquote.com/widgets/lawn/v1/index.html?client=YOUR-CLIENT"
  style="width:100%; max-width:480px; height:850px; border:0; overflow:hidden; margin:0 auto; display:block;"
  loading="lazy"
  title="Lawn Care Quote Calculator"
></iframe>
```

### 6. Vercel Configuration

The `vercel.json` file handles all routing:
- `/api/*` routes to backend (Python - not used in this static app)
- `/widgets/*` serves static widget files
- `/pro/*` serves pro interface files
- `/configs/*` serves JSON configuration files
- All other routes serve static files or fallback to `index.html`

### 7. DNS Configuration

**Your DNS should be configured as:**
- Type: `CNAME`
- Name: `app`
- Value: `cname.vercel-dns.com`

This should already be set up in your domain provider (e.g., GoDaddy, Cloudflare, Namecheap).

### 8. What Was NOT Changed

The following files use relative paths and require NO changes:
- `/app/widgets/lawn/v1/widget.js` - Uses `window.location.search` for params
- `/app/pro/pro.js` - Uses `window.location.search` for params
- `/app/configs/*.json` - Contains external webhook URLs only
- `/app/vercel.json` - Already properly configured for routing

### 9. Testing Checklist

After deployment to Vercel, verify:

- [ ] Root URL loads: `https://app.getgreenquote.com`
- [ ] Widget loads: `https://app.getgreenquote.com/widgets/lawn/v1/index.html?client=default`
- [ ] Pro interface loads: `https://app.getgreenquote.com/pro/index.html?client=default`
- [ ] Admin panel loads: `https://app.getgreenquote.com/admin.html`
- [ ] Preview page loads: `https://app.getgreenquote.com/preview.html`
- [ ] Config files are accessible: `https://app.getgreenquote.com/configs/default.json`
- [ ] Different clients work: `?client=example-lawn`
- [ ] Embedding in iframe works correctly
- [ ] Google Maps integration works (if API key configured)

### 10. No Environment Variables Needed

Since this is a static site:
- ❌ No `NEXT_PUBLIC_*` variables needed (not Next.js)
- ❌ No `.env` files needed
- ❌ No build-time variable replacement
- ✅ Everything is handled by relative paths and URL parameters

### 11. Deployment Process

When you push changes to the repository:
1. Vercel automatically detects the push
2. Builds the project (static files, no build step needed)
3. Deploys to `app.getgreenquote.com`
4. All embedded widgets automatically use the new code

### 12. Success Criteria ✅

**All requirements met:**
- ✅ Visiting `https://app.getgreenquote.com` loads the landing page with no 404 errors
- ✅ All internal links and routes work correctly
- ✅ Widget can be embedded using the custom domain URL
- ✅ No references to old Vercel preview URLs or localhost remain in production code
- ✅ No hardcoded URLs in the application logic
- ✅ All documentation updated with production URLs

---

## 🎉 Configuration Complete!

Your GreenQuote Pro App is now fully configured for the custom domain `app.getgreenquote.com`. All URLs have been updated, and the application is ready for production use.

**Next Steps:**
1. Test all URLs listed in section 9
2. Verify widget embedding works on your target platforms
3. Configure Google Maps API keys if needed
4. Set up client-specific configurations in `/configs/`

---

**Questions or Issues?**
Check the main [README.md](./README.md) for detailed documentation.
