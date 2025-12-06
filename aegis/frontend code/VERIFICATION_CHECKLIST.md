# Verification Checklist

Use this checklist to verify your Aegis authentication system is working correctly.

## ✅ Pre-Setup Verification

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB installed
- [ ] MongoDB running (`mongosh` connects successfully)

## ✅ Backend Setup Verification

- [ ] Navigated to `auth-backend/` folder
- [ ] Ran `npm install` successfully
- [ ] Created `.env` file from `.env.example`
- [ ] Set `MONGODB_URI` in `.env`
- [ ] Set `JWT_SECRET` in `.env` (generated with crypto)
- [ ] Set `PORT=8000` in `.env`
- [ ] Ran `npm run dev`
- [ ] See "✓ MongoDB connected" in terminal
- [ ] See "✓ Server running on http://localhost:8000" in terminal
- [ ] Health check works: `curl http://localhost:8000/health`
- [ ] Optional: Ran `npm test` and all tests pass

## ✅ Frontend Setup Verification

- [ ] Navigated to `aegis-dashboard/` folder
- [ ] Ran `npm install` successfully
- [ ] Verified `.env.local` contains `VITE_AEGIS_API_BASE_URL=http://localhost:8000`
- [ ] Ran `npm run dev`
- [ ] See "Local: http://localhost:5173" in terminal
- [ ] Browser opens to login page

## ✅ Registration Flow Verification

- [ ] Login page loads at http://localhost:5173
- [ ] Click "Create one" link
- [ ] Signup page loads
- [ ] Fill in email field
- [ ] Fill in password field (min 8 chars, 1 uppercase, 1 number)
- [ ] Password strength bar shows
- [ ] Fill in confirm password field
- [ ] Passwords match indicator shows green checkmark
- [ ] Check "I agree" checkbox
- [ ] "Create Account" button becomes enabled
- [ ] Click "Create Account"
- [ ] Button shows "Creating Account..." while loading
- [ ] Redirected to dashboard after success
- [ ] No error messages appear

## ✅ Dashboard Access Verification

- [ ] Dashboard page loads successfully
- [ ] Sidebar shows on the left
- [ ] User email appears in sidebar footer
- [ ] User avatar shows first letter of email
- [ ] "Logout" button visible in sidebar
- [ ] Dashboard content displays (KPI cards, charts)
- [ ] Can navigate to other pages (IDS, Settings)

## ✅ Logout Flow Verification

- [ ] Click "Logout" button in sidebar
- [ ] Redirected to login page
- [ ] Trying to access `/dashboard` directly redirects to login
- [ ] User email no longer in sidebar (if you navigate back)

## ✅ Login Flow Verification

- [ ] On login page
- [ ] Enter registered email
- [ ] Enter correct password
- [ ] Click "Sign In"
- [ ] Button shows "Signing in..." while loading
- [ ] Redirected to dashboard
- [ ] User email appears in sidebar
- [ ] No error messages

## ✅ Invalid Credentials Verification

- [ ] On login page
- [ ] Enter registered email
- [ ] Enter WRONG password
- [ ] Click "Sign In"
- [ ] Error message appears: "Invalid email or password"
- [ ] NOT redirected to dashboard
- [ ] Still on login page
- [ ] Can try again with correct password

## ✅ Invalid Email Verification

- [ ] On login page
- [ ] Enter non-existent email
- [ ] Enter any password
- [ ] Click "Sign In"
- [ ] Error message appears: "Invalid email or password"
- [ ] NOT redirected to dashboard

## ✅ Duplicate Registration Verification

- [ ] On signup page
- [ ] Enter email that's already registered
- [ ] Enter password
- [ ] Confirm password
- [ ] Check agreement
- [ ] Click "Create Account"
- [ ] Error message appears: "Email already registered"
- [ ] NOT redirected to dashboard

## ✅ Password Validation Verification

- [ ] On signup page
- [ ] Try password with less than 8 characters
- [ ] Try password without uppercase letter
- [ ] Try password without number
- [ ] Error message appears for each invalid attempt
- [ ] Valid password (8+ chars, uppercase, number) succeeds

## ✅ Token Persistence Verification

- [ ] Login successfully
- [ ] Refresh the page (F5)
- [ ] Still logged in (dashboard loads)
- [ ] User email still in sidebar
- [ ] Can navigate between pages
- [ ] Logout
- [ ] Refresh page
- [ ] Redirected to login (not logged in)

## ✅ Backend API Verification

Test with curl or Postman:

### Register:
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```
- [ ] Returns 201 status
- [ ] Returns token
- [ ] Returns user object

### Login:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```
- [ ] Returns 200 status
- [ ] Returns token
- [ ] Returns user object

### Protected Route:
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] Returns 200 status
- [ ] Returns user object

### Invalid Token:
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer invalid_token"
```
- [ ] Returns 403 status
- [ ] Returns error message

## ✅ Database Verification

Connect to MongoDB and verify:

```bash
mongosh
use aegis_auth
db.users.find()
```

- [ ] Database `aegis_auth` exists
- [ ] Collection `users` exists
- [ ] Registered users appear in collection
- [ ] Passwords are hashed (not plain text)
- [ ] Email addresses are stored

## ✅ Security Verification

- [ ] Passwords in database are hashed (long random strings)
- [ ] Passwords are NOT visible in plain text
- [ ] JWT tokens are long random strings
- [ ] Invalid credentials return 401 status
- [ ] Protected routes require token
- [ ] CORS allows only localhost:5173
- [ ] Error messages don't leak sensitive info

## ✅ Browser Console Verification

Open browser DevTools (F12):

- [ ] No JavaScript errors in console
- [ ] Network tab shows successful API calls
- [ ] Login POST returns 200 status
- [ ] Register POST returns 201 status
- [ ] Token stored in localStorage
- [ ] User object stored in localStorage

## ✅ Terminal Verification

### Backend Terminal:
- [ ] No error messages
- [ ] Shows MongoDB connected
- [ ] Shows incoming API requests
- [ ] Shows 200/201 for successful requests
- [ ] Shows 401 for invalid credentials

### Frontend Terminal:
- [ ] No error messages
- [ ] Shows "ready in X ms"
- [ ] Shows local URL

## 🎉 Final Verification

- [ ] Can register new users
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Can logout
- [ ] Can access dashboard when logged in
- [ ] Cannot access dashboard when logged out
- [ ] User email displays in sidebar
- [ ] No dummy/stub authentication remains
- [ ] All existing pages work
- [ ] Visual design unchanged
- [ ] Mobile responsive still works

---

## ❌ If Any Check Fails

1. **Check MongoDB**: Ensure it's running (`mongosh`)
2. **Check Backend**: Ensure it's running on port 8000
3. **Check Frontend**: Ensure it's running on port 5173
4. **Check .env files**: Verify configuration
5. **Check browser console**: Look for errors
6. **Check terminal logs**: Look for errors
7. **See SETUP.md**: Troubleshooting section
8. **Restart everything**: Stop all servers and start fresh

---

## 📊 Success Criteria

If all checks pass:
✅ Authentication system is working correctly
✅ Security is properly implemented
✅ Ready for development/testing
✅ Can proceed to production deployment (with production configs)

---

**All checks passed? Congratulations! 🎉**

Your Aegis Dashboard now has production-ready authentication!
