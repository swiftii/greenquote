# Required Environment Variables for Vercel Deployment

## 🔐 Supabase Authentication

You **MUST** add these environment variables in Vercel for authentication to work:

### Variables to Add:

```bash
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📍 Where to Get These Values:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Sign in to your account
3. Select your GreenQuote project (or create a new project)

### Step 2: Get API Credentials
1. Click **Settings** (⚙️ icon) in the left sidebar
2. Click **API**
3. You'll see two values you need:

   **Project URL** → This is your `REACT_APP_SUPABASE_URL`
   ```
   Example: https://abcdefghijk.supabase.co
   ```

   **anon public key** → This is your `REACT_APP_SUPABASE_ANON_KEY`
   ```
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc...
   (This is a long JWT token)
   ```

---

## 🚀 How to Add in Vercel:

### Method 1: Vercel Dashboard (Recommended)

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/
   - Navigate to your "greenquote" project

2. **Go to Settings**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add First Variable**
   - Click **Add New** button
   - **Key**: `REACT_APP_SUPABASE_URL`
   - **Value**: `https://xxxxx.supabase.co` (your actual URL)
   - **Environment**: Select **Production** (and optionally Preview/Development)
   - Click **Save**

4. **Add Second Variable**
   - Click **Add New** button again
   - **Key**: `REACT_APP_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOi...` (your actual anon key)
   - **Environment**: Select **Production** (and optionally Preview/Development)
   - Click **Save**

5. **Trigger Deployment**
   - After adding both variables, Vercel will ask if you want to redeploy
   - Click **Redeploy** to apply the new environment variables
   - OR push a new commit to trigger automatic deployment

---

### Method 2: Vercel CLI (Alternative)

If you prefer using the command line:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add REACT_APP_SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add REACT_APP_SUPABASE_ANON_KEY production
# Paste your Supabase anon key when prompted

# Trigger new deployment
vercel --prod
```

---

## ✅ Verification

After adding the environment variables and redeploying:

1. **Check Build Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on the latest deployment
   - Check build logs for any errors

2. **Test the Live Site**
   - Visit: https://app.getgreenquote.com/signup
   - Try creating an account
   - If it works, environment variables are correctly set!

3. **Check Browser Console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - You should NOT see: "Supabase environment variables are not set"
   - If you do see this warning, the env vars are not properly set

---

## 🔴 Important Notes

### Security:
- ✅ **Safe to expose**: The `anon public` key is safe to expose in your frontend
- ✅ **Client-side**: These are `REACT_APP_*` variables (frontend environment variables)
- ❌ **Don't commit**: Never commit these values to Git
- ❌ **Don't share**: Don't share your actual keys publicly (the example keys above are fake)

### Supabase Row Level Security (RLS):
- The `anon` key only has permissions defined by your Supabase RLS policies
- Make sure to set up proper RLS policies in Supabase to protect your data
- By default, Supabase denies all access until you explicitly allow it

### Environment Scopes:
- **Production**: For https://app.getgreenquote.com
- **Preview**: For preview deployments (e.g., PR previews)
- **Development**: For local development (optional)

**Recommendation**: Set the same values for all three environments unless you have separate Supabase projects for dev/staging/prod.

---

## 🆘 Troubleshooting

### Problem: "Supabase environment variables are not set" in console

**Solution**:
1. Verify you added the variables in Vercel
2. Verify you selected "Production" environment
3. Redeploy the application
4. Clear browser cache and try again

### Problem: Login/Signup not working after setting variables

**Possible causes**:
1. Environment variables have typos
2. Copied the wrong key from Supabase (e.g., `service_role` instead of `anon`)
3. Supabase project has email auth disabled

**Solution**:
1. Double-check the values in Vercel match Supabase exactly
2. Make sure you copied the **anon public** key (not the service_role key)
3. Check Supabase Dashboard → Authentication → Providers → Email is enabled

### Problem: Variables not taking effect

**Solution**:
1. After adding/changing environment variables, you MUST redeploy
2. Vercel only applies env vars during build time
3. Simply visiting the site won't pick up new variables
4. Either:
   - Push a new commit (triggers auto-deploy)
   - Or click "Redeploy" in Vercel Dashboard

---

## 📋 Quick Checklist

- [ ] Created Supabase project (or using existing one)
- [ ] Copied `Project URL` from Supabase Dashboard
- [ ] Copied `anon public` key from Supabase Dashboard
- [ ] Added `REACT_APP_SUPABASE_URL` in Vercel
- [ ] Added `REACT_APP_SUPABASE_ANON_KEY` in Vercel
- [ ] Selected "Production" environment for both variables
- [ ] Triggered a new deployment
- [ ] Tested signup at https://app.getgreenquote.com/signup
- [ ] Tested login at https://app.getgreenquote.com/login
- [ ] Verified no console errors about missing env vars

---

## 🎉 You're Done!

Once you complete the checklist above, your authentication system will be fully functional on https://app.getgreenquote.com!

**Questions?** Check the full setup guide: `/app/SUPABASE_AUTH_SETUP.md`
