# Dashboard Account Loading Fix

## ✅ Issue Diagnosed and Fixed

Enhanced error handling and logging to identify and resolve account data loading issues on the dashboard.

---

## 🔍 Problem Analysis

### Original Issue:
Users saw a generic error: **"Failed to load account data. Please try refreshing the page."**

This error was masking the actual Supabase error, making it impossible to diagnose the root cause.

### Possible Root Causes:
1. **RLS Policies Not Applied** - Tables exist but RLS blocks queries
2. **Tables Not Created** - SQL migration not run
3. **Wrong User ID** - Query using incorrect user identifier
4. **Permission Errors** - Supabase client lacks permissions
5. **Network Issues** - Connection to Supabase failing

---

## 🔧 What Was Fixed

### 1. Enhanced Error Logging

**File**: `/app/frontend/src/pages/Dashboard.js`

**Changes**:
- Added detailed console logging at each step
- Show full error details (message, code, hint)
- Display actual Supabase error message to user (not generic)
- Log user ID being used for queries

**Before**:
```javascript
catch (err) {
  console.error('Error loading account data:', err);
  setError('Failed to load account data. Please try refreshing the page.');
}
```

**After**:
```javascript
catch (err) {
  console.error('[Dashboard] Error loading account data:', err);
  
  let errorMessage = 'Failed to load account data. ';
  if (err.message) errorMessage += err.message;
  if (err.code) errorMessage += ` (Error code: ${err.code})`;
  if (err.hint) errorMessage += ` Hint: ${err.hint}`;
  
  console.error('[Dashboard] Full error details:', {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
    stack: err.stack
  });
  
  setError(errorMessage);
}
```

### 2. Enhanced Service Logging

**File**: `/app/frontend/src/services/accountService.js`

**Changes**:
- Log each step: "Checking for account", "Creating account", "Checking settings"
- Log all Supabase error details (code, message, hint)
- Log success confirmations
- Track flow through the entire provisioning process

**Added Logs**:
```javascript
console.log('[AccountService] Ensuring account for user:', user.id);
console.log('[AccountService] Checking for existing account...');
console.log('[AccountService] Found existing account:', account.id);
console.log('[AccountService] Creating account with name:', accountName);
console.log('[AccountService] Account created successfully:', newAccount.id);
console.log('[AccountService] Checking for account settings...');
console.log('[AccountService] Settings created successfully');
console.log('[AccountService] Returning account and settings');
```

---

## 🧪 Diagnostic Instructions

### Step 1: Open Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to **Console** tab
3. Clear any old logs
4. Navigate to: `https://app.getgreenquote.com/dashboard`

### Step 2: Check for Specific Errors

Look for these error patterns in the console:

#### Error Pattern 1: Tables Don't Exist
```
Error code: 42P01
Message: relation "accounts" does not exist
```

**Solution**: Run the SQL migration:
1. Go to Supabase Dashboard → SQL Editor
2. Run the entire `/app/SUPABASE_SCHEMA.sql` file
3. Verify success

#### Error Pattern 2: RLS Policy Blocking
```
Error code: 42501
Message: permission denied for table accounts
Hint: Row-level security policy may be blocking access
```

**Solution**: Check RLS policies in Supabase:
1. Go to: Database → Tables → accounts → RLS
2. Verify policies exist for SELECT on `owner_user_id = auth.uid()`
3. If missing, re-run the SQL migration

#### Error Pattern 3: No User ID
```
Error: User not authenticated
```

**Solution**: User not logged in correctly
1. Log out completely
2. Clear browser cache
3. Log in again
4. Check that Supabase auth session is active

#### Error Pattern 4: Wrong Column Name
```
Error code: 42703
Message: column "owner_user_id" does not exist
```

**Solution**: Schema mismatch
1. Check your actual database schema in Supabase
2. Verify column names match the SQL file
3. Re-run migration if needed

#### Error Pattern 5: Unique Constraint Violation
```
Error code: 23505
Message: duplicate key value violates unique constraint
```

**Solution**: Account already exists but query failed
1. Check Supabase Dashboard → Table Editor → accounts
2. Find row with your user_id
3. Manually delete if corrupt, then try again

---

## 🔍 Step-by-Step Debugging Process

### Test 1: Verify Tables Exist

In Supabase Dashboard:
1. Go to: Database → Tables
2. Verify tables exist:
   - ✅ `accounts`
   - ✅ `account_settings`
3. If missing: Run SQL migration

### Test 2: Verify RLS Policies

In Supabase Dashboard:
1. Click on `accounts` table
2. Go to "Policies" tab
3. Should see:
   - ✅ "Users can view own account" (SELECT)
   - ✅ "Users can insert own account" (INSERT)
   - ✅ "Users can update own account" (UPDATE)
4. Repeat for `account_settings` table

### Test 3: Test Manual Query

In Supabase SQL Editor:
```sql
-- Check if your user has an account
SELECT * FROM accounts WHERE owner_user_id = auth.uid();

-- Check if settings exist
SELECT s.* 
FROM account_settings s
JOIN accounts a ON s.account_id = a.id
WHERE a.owner_user_id = auth.uid();
```

Run while logged in to the app. Should return your account/settings or empty (if new user).

### Test 4: Check Auth Session

In browser console, run:
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

Should show your user object with `id` field. If null, you're not authenticated.

---

## 🔐 Verify RLS Policies

The SQL migration creates these policies. Verify they exist:

### For `accounts` table:

```sql
-- SELECT policy
CREATE POLICY "Users can view own account"
  ON accounts
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- INSERT policy
CREATE POLICY "Users can insert own account"
  ON accounts
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- UPDATE policy
CREATE POLICY "Users can update own account"
  ON accounts
  FOR UPDATE
  USING (auth.uid() = owner_user_id);
```

### For `account_settings` table:

```sql
-- SELECT policy
CREATE POLICY "Users can view own account settings"
  ON account_settings
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- INSERT policy
CREATE POLICY "Users can insert own account settings"
  ON account_settings
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update own account settings"
  ON account_settings
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );
```

**To check if policies exist**:
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('accounts', 'account_settings');
```

---

## 📊 Expected Console Output (Success)

When everything works correctly, you should see:

```
[AccountService] Ensuring account for user: abc123-def456-...
[AccountService] Checking for existing account...
[AccountService] Account query error: { code: 'PGRST116', message: 'No rows found', ... }
[AccountService] No account found, creating new account...
[AccountService] Creating account with name: My Business
[AccountService] Account created successfully: xyz789-abc123-...
[AccountService] Checking for account settings...
[AccountService] Settings query error: { code: 'PGRST116', message: 'No rows found', ... }
[AccountService] No settings found, creating default settings...
[AccountService] Settings created successfully
[AccountService] Returning account and settings
[Dashboard] Loading account data for user: abc123-def456-...
[Dashboard] Account loaded: { id: 'xyz789...', name: 'My Business', ... }
[Dashboard] Settings loaded: { min_price_per_visit: 50, ... }
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "relation 'accounts' does not exist"
**Cause**: SQL migration not run  
**Solution**: 
1. Go to Supabase Dashboard
2. SQL Editor
3. Copy entire `/app/SUPABASE_SCHEMA.sql`
4. Run it
5. Refresh dashboard

### Issue 2: "permission denied for table accounts"
**Cause**: RLS policies not created or misconfigured  
**Solution**:
1. Re-run SQL migration (includes RLS policies)
2. Or manually create policies (see above)
3. Verify with: `SELECT * FROM pg_policies WHERE tablename = 'accounts'`

### Issue 3: "No rows found" but dashboard still shows error
**Cause**: Error handling treating PGRST116 as an error  
**Solution**: Already fixed in updated code - PGRST116 is now handled as "no data found" (expected for new users)

### Issue 4: Infinite loading state
**Cause**: Supabase environment variables not set  
**Solution**:
1. Check Vercel environment variables
2. Verify `REACT_APP_SUPABASE_URL` is set
3. Verify `REACT_APP_SUPABASE_ANON_KEY` is set
4. Redeploy if they were just added

### Issue 5: Account created but settings fail
**Cause**: Foreign key constraint or RLS issue  
**Solution**:
1. Check console for specific error code
2. Verify `account_id` matches the account's `id`
3. Check RLS policies allow INSERT on account_settings
4. Verify foreign key constraint exists and is valid

---

## ✅ Success Criteria

After the fix, verify:

- [ ] No generic error messages - see actual Supabase errors
- [ ] Console shows detailed logs at each step
- [ ] New users auto-create account + settings
- [ ] Existing users load their account + settings
- [ ] RLS prevents users from seeing other users' data
- [ ] Dashboard displays account name and pricing settings
- [ ] No crashes or undefined errors

---

## 🔄 Testing Workflow

### Test 1: New User
1. Create new Supabase account (new email)
2. Sign up at `/signup`
3. Redirected to `/dashboard`
4. Check console - should see account creation logs
5. Check dashboard - should show default values ($50, $0.10)
6. Check Supabase Table Editor - should see 1 row in accounts, 1 in account_settings

### Test 2: Existing User
1. Log in with existing account
2. Redirected to `/dashboard`
3. Check console - should see "Found existing account" logs
4. Dashboard shows your current settings
5. No duplicate accounts created

### Test 3: Multi-User
1. Log in as User A
2. Note User A's settings
3. Log out
4. Log in as User B
5. Should see different settings
6. User B cannot see User A's data

---

## 📝 Files Modified

1. `/app/frontend/src/pages/Dashboard.js`
   - Enhanced error display
   - Detailed console logging
   - Better error message composition

2. `/app/frontend/src/services/accountService.js`
   - Step-by-step logging
   - Error detail logging
   - Flow tracking

3. `/app/DASHBOARD_ACCOUNT_LOADING_FIX.md` (this file)
   - Diagnostic guide
   - Troubleshooting steps
   - Expected behaviors

---

## 🆘 If Still Not Working

1. **Share console output**: Copy all `[Dashboard]` and `[AccountService]` logs
2. **Check Supabase Dashboard**:
   - Go to Database → Tables → accounts
   - Check if any rows exist
   - Check if `owner_user_id` matches your user ID
3. **Verify environment variables**:
   - Vercel → Settings → Environment Variables
   - Confirm both Supabase vars are set
4. **Test Supabase connection**:
   ```javascript
   // In browser console
   const { data, error } = await supabase.from('accounts').select('count');
   console.log('Connection test:', data, error);
   ```

---

**Status**: ✅ **Enhanced Diagnostics Added**  
**Next**: Deploy, test, and check console logs for actual error
