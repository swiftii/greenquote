# Quick Fix: Signup "Failed to Fetch" Error

## 🔴 Problem
Users see "Failed to fetch" error when signing up.

## ✅ Solution
Set Supabase environment variables in Vercel.

---

## 📋 Quick Steps

### 1. Get Supabase Credentials (2 minutes)
```
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Settings → API
4. Copy:
   - Project URL (starts with https://)
   - anon public key (long JWT token)
```

### 2. Add to Vercel (2 minutes)
```
1. Go to: https://vercel.com
2. Select: greenquote project
3. Go to: Settings → Environment Variables
4. Add TWO new variables:

   Variable 1:
   Key: REACT_APP_SUPABASE_URL
   Value: [Paste your Project URL]
   Environment: Production, Preview, Development

   Variable 2:
   Key: REACT_APP_SUPABASE_ANON_KEY
   Value: [Paste your anon key]
   Environment: Production, Preview, Development
```

### 3. Redeploy (1 minute)
```
1. Vercel will ask: "Redeploy to apply changes?"
2. Click: "Redeploy"
3. Wait for deployment to complete (2-3 minutes)
```

### 4. Test (1 minute)
```
1. Go to: https://app.getgreenquote.com/signup
2. Fill form and submit
3. Should work without "Failed to fetch" error
```

---

## ✅ Success Check

**Before fix**: "Failed to fetch" error  
**After fix**: User created, redirected to dashboard

---

## 🆘 Need Help?

See detailed guide: `/app/SIGNUP_FAILED_TO_FETCH_FIX.md`

**Total time**: ~6 minutes
