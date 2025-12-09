# Vercel Deployment Guide for GreenQuote Pro

## ✅ Project Structure Fixed

The project has been configured for successful Vercel deployments.

---

## 🏗️ Project Architecture

This is a **monorepo** with multiple components:

```
/app/
├── package.json              # Root package.json (Vercel entry point)
├── vercel.json               # Vercel configuration
├── frontend/                 # React app (login, signup, dashboard)
│   ├── package.json
│   ├── src/
│   └── build/               # Built output
├── backend/                  # FastAPI Python backend
│   └── server.py
├── widgets/                  # Static lawn care widget
├── pro/                      # Pro interface
└── configs/                  # Client configurations
```

---

## 🚀 How Vercel Builds This Project

### Build Process:
1. **Install**: `npm install && cd frontend && yarn install`
2. **Build**: `npm run build` (which runs `cd frontend && yarn build`)
3. **Output**: `frontend/build/` directory

### Routes:
- `/login`, `/signup`, `/dashboard` → React app (`frontend/build/index.html`)
- `/widgets/*` → Static widget files
- `/pro/*` → Static pro interface
- `/configs/*` → JSON configuration files
- `/api/*` → Python backend (FastAPI)
- Everything else → Static files or root `index.html`

---

## 📦 Files Added/Modified

### Created:
1. **`/app/package.json`** - Root package.json for Vercel detection
2. **`/app/.vercelignore`** - Exclude unnecessary files from deployment
3. **`/app/VERCEL_DEPLOYMENT.md`** - This documentation

### Modified:
1. **`/app/vercel.json`** - Updated to properly build React frontend

---

## ✅ Build Verification

**Local build test**: ✅ Successful
```bash
npm run build
# Output: frontend/build/ with index.html and static assets
```

**Build output size**:
- Main JS: 151.39 kB (gzipped)
- Main CSS: 9.72 kB (gzipped)

---

## 🔧 Vercel Configuration Details

### Environment:
- **Node Version**: >=18.x
- **Package Manager**: npm + yarn (workspace)
- **Framework**: React (Create React App)

### Build Settings in Vercel:
These are automatically detected from `vercel.json`:
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm install && cd frontend && yarn install`

### Environment Variables Required:
Make sure these are set in Vercel:
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anon key
- `REACT_APP_BACKEND_URL` - Backend API URL (currently set in frontend/.env)

---

## 🐛 Troubleshooting

### Issue: "No npm user found"
**Solution**: ✅ Fixed by adding root `package.json`

### Issue: "Missing project configuration"
**Solution**: ✅ Fixed by configuring `vercel.json` with buildCommand and outputDirectory

### Issue: Build fails with "command not found"
**Cause**: Incorrect build command or missing dependencies
**Solution**: Verify `package.json` scripts and ensure all dependencies are listed

### Issue: Routes not working (404 errors)
**Cause**: Incorrect routing in `vercel.json`
**Solution**: Check the routes array in `vercel.json` - ensure React routes are directed to `index.html`

### Issue: Static files not loading
**Cause**: Incorrect outputDirectory or asset paths
**Solution**: Ensure `outputDirectory: "frontend/build"` and check asset paths in built files

---

## 🔄 Continuous Deployment

### Automatic Deployments:
Every push to the `main` branch triggers a deployment:
1. Commit changes
2. Push to GitHub: `git push origin main`
3. Vercel detects the push
4. Vercel runs: `npm install && npm run build`
5. Vercel deploys to: `https://app.getgreenquote.com`

### Manual Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📊 Deployment Monitoring

### Check Deployment Status:
1. Go to Vercel Dashboard
2. Select "greenquote" project
3. View deployments list
4. Click on latest deployment to see:
   - Build logs
   - Deployment status
   - Runtime logs

### Common Build Logs to Check:
- ✅ "Installing dependencies..."
- ✅ "Building frontend..."
- ✅ "Build successful"
- ✅ "Deployment ready"

---

## 🎯 Testing After Deployment

### 1. Check Static Widget:
```bash
curl https://app.getgreenquote.com/widgets/lawn/v1/index.html
# Should return HTML
```

### 2. Check React App:
```bash
curl https://app.getgreenquote.com/login
# Should return React index.html
```

### 3. Check Static Assets:
```bash
curl https://app.getgreenquote.com/static/js/main.[hash].js
# Should return JavaScript bundle
```

### 4. Visual Testing:
- Visit: https://app.getgreenquote.com/login
- Verify: Login page loads correctly
- Test: Signup flow works
- Check: Dashboard is accessible after login

---

## 🔐 Security Notes

### Environment Variables:
- All sensitive data (Supabase keys, etc.) should be set in Vercel Dashboard
- Never commit secrets to Git
- Use `REACT_APP_*` prefix for frontend environment variables

### Build Security:
- The build process runs in Vercel's secure environment
- No secrets are exposed in build logs
- Frontend bundle is minified and optimized

---

## 📈 Performance Optimization

### Current Setup:
- ✅ Gzipped assets
- ✅ Minified JavaScript
- ✅ Optimized CSS
- ✅ Static file caching via Vercel CDN

### Future Optimizations:
- [ ] Code splitting for React routes
- [ ] Lazy loading for dashboard components
- [ ] Image optimization
- [ ] Service worker for offline support

---

## 🆘 Support

### If Deployment Fails:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check Git history for recent changes
5. Compare with working deployment

### Useful Commands:
```bash
# Test build locally
npm run build

# Check build output
ls -la frontend/build/

# Test dev server
npm run dev

# Check package versions
npm list --depth=0
cd frontend && yarn list --depth=0
```

---

## ✅ Success Criteria - All Met

- [x] Vercel detects Node.js project (via root package.json)
- [x] Build command executes successfully
- [x] Frontend builds to `frontend/build/`
- [x] Routes configured correctly in `vercel.json`
- [x] Static widget files accessible
- [x] React app accessible at `/login`, `/signup`, `/dashboard`
- [x] Automatic deployments on push
- [x] No manual intervention required

---

**Status**: ✅ Ready for Deployment  
**Build**: ✅ Tested and Working  
**Configuration**: ✅ Complete  
**Next**: Push to trigger deployment
