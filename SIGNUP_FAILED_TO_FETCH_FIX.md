# Signup "Failed to Fetch" Error - Root Cause & Fix

## 🔴 Problem Identified

**Error**: "Failed to fetch" when users try to sign up from the marketing site or directly on the app.

**Root Cause**: **Supabase environment variables are NOT set in Vercel**, causing the app to try connecting to placeholder/invalid Supabase URLs.

---

## 🔍 Investigation Results

### 1. Signup Flow Analysis

**Marketing Site** (`https://getgreenquote.com`):
- ✅ Correctly configured
- "Get Started" button links to: `https://app.getgreenquote.com/signup`
- Does NOT make direct API calls
- Simply redirects users to the app's signup page

**App** (`https://app.getgreenquote.com`):
- When user submits signup form on `/signup`
- Calls: `supabase.auth.signUp()` (line 33 in `/app/frontend/src/pages/Signup.js`)
- This makes a network request to Supabase Auth API

### 2. Failing Network Request

**Request Details**:
- **Target**: Supabase Auth API endpoint
- **URL**: `https://placeholder.supabase.co/auth/v1/signup` (INVALID!)
- **Method**: POST
- **Error**: "Failed to fetch" - because the URL doesn't exist

**Why it fails**:
```javascript
// In supabaseClient.js (lines 32-35):
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',  // ← Using placeholder!
  supabaseAnonKey || 'placeholder-key'                // ← Using placeholder!
);
```

When `process.env.REACT_APP_SUPABASE_URL` is undefined, it falls back to the placeholder URL.

### 3. Environment Variables Check

**Local .env file** (`/app/frontend/.env`):
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url  ← Placeholder value
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key ← Placeholder value
```

**Vercel Environment Variables**: ❌ **NOT SET**

**Result**: In production, `process.env.REACT_APP_SUPABASE_URL` is undefined, so the client uses the placeholder URL.

---

## ✅ Solution

### CRITICAL: Set Supabase Environment Variables in Vercel

You **MUST** set these two environment variables in your Vercel project for authentication to work:

### Required Environment Variables:

#### 1. REACT_APP_SUPABASE_URL
- **Value**: Your Supabase project URL
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`
- **Example**: `https://abcdefghijk.supabase.co`

#### 2. REACT_APP_SUPABASE_ANON_KEY
- **Value**: Your Supabase anonymous/public key
- **Format**: JWT token (long string starting with `eyJ...`)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc...`

---

## 📋 Step-by-Step Fix Instructions

### Step 1: Get Supabase Credentials

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Sign in** to your Supabase account
3. **Select your GreenQuote project** (or create a new one if needed)
4. **Navigate to**: Settings → API (in the left sidebar)
5. **Copy these values**:
   - **Project URL** → This is your `REACT_APP_SUPABASE_URL`
   - **anon public** key → This is your `REACT_APP_SUPABASE_ANON_KEY`

**Screenshot locations in Supabase Dashboard**:
```
Settings → API
├── Project URL: https://xxxxx.supabase.co
└── Project API keys:
    ├── anon public: eyJhbGciOi... ← Copy this
    └── service_role: eyJhbGciOi... ← DO NOT use this (server-side only)
```

### Step 2: Add Environment Variables in Vercel

1. **Open Vercel Dashboard**: https://vercel.com
2. **Navigate to**: Your Projects → greenquote project
3. **Click**: Settings (top navigation)
4. **Select**: Environment Variables (left sidebar)
5. **Add First Variable**:
   - Click "Add New" button
   - **Key**: `REACT_APP_SUPABASE_URL`
   - **Value**: Paste your Supabase Project URL (from Step 1)
   - **Environment**: Select **Production**, **Preview**, and **Development**
   - Click "Save"

6. **Add Second Variable**:
   - Click "Add New" button again
   - **Key**: `REACT_APP_SUPABASE_ANON_KEY`
   - **Value**: Paste your Supabase anon key (from Step 1)
   - **Environment**: Select **Production**, **Preview**, and **Development**
   - Click "Save"

### Step 3: Redeploy the Application

After adding environment variables, you MUST redeploy:

**Option A - Automatic** (Recommended):
- Vercel will prompt: "Would you like to redeploy?"
- Click "Redeploy" button

**Option B - Manual**:
- Push a new commit to GitHub (triggers auto-deploy)
- Or go to Vercel Dashboard → Deployments → Click "..." → Redeploy

### Step 4: Configure Supabase Project Settings

While waiting for Vercel to deploy, configure Supabase:

1. **In Supabase Dashboard**: Settings → Authentication → URL Configuration
2. **Set Site URL**: `https://app.getgreenquote.com`
3. **Add Redirect URLs**:
   - `https://app.getgreenquote.com`
   - `https://app.getgreenquote.com/dashboard`
   - `https://app.getgreenquote.com/login`
4. **Save changes**

5. **Enable Email Provider** (if not already):
   - Go to: Authentication → Providers
   - Ensure "Email" provider is enabled
   - Configure email templates if needed

### Step 5: Test the Fix

Once deployment completes:

1. **Test Direct Signup**:
   - Go to: `https://app.getgreenquote.com/signup`
   - Fill in all fields:
     - Full Name: "Test User"
     - Business Name: "Test Business"
     - Email: "test@example.com"
     - Password: "password123"
   - Click "Sign Up"
   - **Expected**: No "Failed to fetch" error
   - **Expected**: Either redirect to dashboard OR show email confirmation message

2. **Test from Marketing Site**:
   - Go to: `https://getgreenquote.com`
   - Click "Get Started" button
   - Should navigate to: `https://app.getgreenquote.com/signup`
   - Fill form and submit
   - **Expected**: Same as direct signup test

3. **Verify in Supabase**:
   - Go to Supabase Dashboard → Authentication → Users
   - **Expected**: See the newly created user in the list

---

## 🔧 Additional Checks

### Verify Environment Variables Are Set:

After deployment, check the build logs in Vercel:

1. Go to: Vercel Dashboard → Deployments → Click on latest deployment
2. Look for: "Environment Variables" section in build logs
3. Should see: `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` listed (values hidden)

### Browser Console Check:

Open browser DevTools (F12) on the signup page:

**Before fix**:
```
Warning: Supabase environment variables are not set.
Authentication will not work.
```

**After fix** (no warning should appear)

### Network Tab Check:

Open browser DevTools → Network tab, then try signup:

**Before fix**:
- Request to: `https://placeholder.supabase.co/auth/v1/signup`
- Status: (failed) - "Failed to fetch"

**After fix**:
- Request to: `https://your-project-id.supabase.co/auth/v1/signup`
- Status: 200 OK (or appropriate error if credentials wrong)

---

## 🛡️ Security Notes

### Safe to Expose:
✅ `REACT_APP_SUPABASE_URL` - Public URL, safe in frontend
✅ `REACT_APP_SUPABASE_ANON_KEY` - Anonymous key, safe in frontend (protected by RLS)

### NEVER Expose:
❌ `SUPABASE_SERVICE_ROLE_KEY` - Server-side only, full admin access

### Environment Variable Prefixes:
- `REACT_APP_*` - Embedded in frontend build, accessible in browser
- `NEXT_PUBLIC_*` - For Next.js projects (not applicable here)
- No prefix - Server-side only, not accessible in browser

---

## 🚨 Why This Happened

1. **Initial Setup**: When Supabase authentication was integrated, the code was written correctly
2. **Environment Variables**: But the actual Supabase credentials were never added to Vercel
3. **Local Development**: May have worked locally if real values were in `.env`, but not in production
4. **Build Succeeded**: The app builds successfully even without env vars (uses placeholders)
5. **Runtime Failure**: Only fails at runtime when trying to make actual network requests

---

## ✅ Success Criteria

After applying the fix:

- [x] No "Failed to fetch" error during signup
- [x] Users can create accounts on `/signup`
- [x] Credentials are stored in Supabase Auth
- [x] Users can log in with created credentials
- [x] Marketing site → App signup flow works end-to-end
- [x] Browser console shows no Supabase warnings

---

## 📊 Expected Behavior After Fix

### Signup Flow:
```
1. User fills signup form
   ↓
2. Submits form
   ↓
3. App calls: supabase.auth.signUp()
   ↓
4. Request sent to: https://YOUR-PROJECT.supabase.co/auth/v1/signup
   ↓
5. Supabase creates user
   ↓
6. Returns: { user, session }
   ↓
7. App redirects to: /dashboard
```

### Network Request (Successful):
```
POST https://your-project-id.supabase.co/auth/v1/signup
Status: 200 OK
Response: {
  "user": { "id": "...", "email": "test@example.com", ... },
  "session": { "access_token": "...", ... }
}
```

---

## 🐛 Troubleshooting

### Issue: Still getting "Failed to fetch" after setting env vars

**Possible causes**:
1. Environment variables not saved correctly
2. Application not redeployed after setting vars
3. Variables set only for Preview, not Production

**Solution**:
1. Double-check env vars in Vercel (Settings → Environment Variables)
2. Ensure they're set for "Production" environment
3. Manually trigger a redeploy
4. Clear browser cache and try again

### Issue: "Invalid API key" error

**Cause**: Wrong Supabase key used

**Solution**:
- Make sure you copied the **anon public** key, not the service_role key
- Verify the key in Supabase Dashboard → Settings → API

### Issue: CORS error

**Cause**: Supabase not configured for your domain

**Solution**:
- In Supabase Dashboard → Settings → API
- Add your domains to allowed origins:
  - `https://app.getgreenquote.com`
  - `https://getgreenquote.com` (if needed)

---

## 📝 Summary

**The Problem**: Missing Supabase environment variables in Vercel
**The Fix**: Set `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in Vercel
**Time to Fix**: 5 minutes (once you have Supabase credentials)
**Impact**: Critical - Authentication completely broken without these

---

## 🎯 Action Items

### Immediate (Required):
1. [ ] Get Supabase credentials from Supabase Dashboard
2. [ ] Add `REACT_APP_SUPABASE_URL` to Vercel env vars
3. [ ] Add `REACT_APP_SUPABASE_ANON_KEY` to Vercel env vars
4. [ ] Redeploy application
5. [ ] Test signup flow

### Follow-up (Recommended):
1. [ ] Configure Supabase Site URL and Redirect URLs
2. [ ] Set up email templates in Supabase
3. [ ] Test login flow
4. [ ] Test password reset flow (when implemented)
5. [ ] Monitor Supabase Auth logs for issues

---

**Documentation created**: December 10, 2025  
**Status**: Waiting for environment variables to be set  
**Priority**: 🔴 **CRITICAL** - Authentication non-functional
