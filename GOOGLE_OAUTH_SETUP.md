# 🔐 Google OAuth 2.0 Setup Guide for LIFORA

This guide walks you through setting up real Google OAuth for LIFORA so users can sign in with their actual Google accounts.

---

## Prerequisites

- A Google account
- Your LIFORA app's production URL (from Railway, e.g. `https://lifora.railway.app`)

---

## Step 1 — Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project selector at the top → **New Project**
3. Enter **Project Name**: `LIFORA Blood Network`
4. Click **Create**
5. Wait for the project to be created, then select it

---

## Step 2 — Enable the Google Identity API

1. In the left sidebar → **APIs & Services** → **Library**
2. Search for **"Google Identity"** or **"Google+ API"**
3. Click on it → **Enable**

---

## Step 3 — Configure the OAuth Consent Screen

1. **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public users) → **Create**
3. Fill in:
   - **App name**: `LIFORA Blood Donation Network`
   - **User support email**: your Gmail address
   - **App logo**: optional (upload your LIFORA logo)
   - **Application home page**: `https://your-lifora-app.railway.app`
   - **Privacy policy URL**: `https://your-lifora-app.railway.app/privacy` (optional)
   - **Authorized domains**: `railway.app` (and your custom domain if you have one)
   - **Developer contact email**: your Gmail address
4. Click **Save and Continue**
5. **Scopes** step: Click **Add or Remove Scopes**
   - Add: `openid`, `email`, `profile`
   - Click **Update** → **Save and Continue**
6. **Test Users** step: You can add test users now or skip
7. Click **Save and Continue** → **Back to Dashboard**

> **Note**: While the app is in "Testing" mode, only test users can sign in.
> To allow all Google users to sign in, click **Publish App** → **Confirm**.

---

## Step 4 — Create OAuth 2.0 Credentials

1. **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. **Application type**: Select **Web application**
4. **Name**: `LIFORA Web Client`

### Authorized JavaScript Origins

Add the following (exact URLs, no trailing slash):

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5173` |
| Development | `http://localhost:5000` |
| Production  | `https://your-lifora-app.railway.app` |

### Authorized Redirect URIs

LIFORA uses the "One Tap" / "Implicit" flow (no redirect URI needed).
However, add these as a safety net:

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5173` |
| Production  | `https://your-lifora-app.railway.app` |

5. Click **Create**
6. A dialog shows your credentials:
   - **Client ID**: `XXXXXXXXXXXX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`
7. **Copy and save both values securely**

---

## Step 5 — Configure Environment Variables

### For Local Development

Edit `.env` in the project root:

```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

Edit `client/.env`:

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

### For Railway Production

1. Open your Railway project
2. Click on your service → **Variables** tab
3. Add the following variables:

```
GOOGLE_CLIENT_ID     = YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = YOUR_CLIENT_SECRET
```

The `VITE_GOOGLE_CLIENT_ID` for the frontend build needs to be set **at build time**.

In Railway:
1. Go to **Settings** → **Build** tab
2. Or add `VITE_GOOGLE_CLIENT_ID` to Variables (Railway exposes all variables at build time with NIXPACKS)

---

## Step 6 — Verify Configuration

After deployment, visit your app and click **Continue with Google**.

The browser should open a Google account selection window — this confirms OAuth is working correctly.

### Server startup confirmation

When the server starts, you should see:

```
Google Auth: ✅ Configured
```

If you see `⚠️ Not configured`, the `GOOGLE_CLIENT_ID` variable is missing.

---

## Step 7 — Production Domain Setup

When you have a custom domain:

1. Go back to **APIs & Services** → **Credentials** → your client
2. Add your custom domain to **Authorized JavaScript Origins**:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
3. Save

---

## Security Notes

- ✅ The backend verifies every Google ID token using the official `google-auth-library`
- ✅ Token audience (your Client ID) is validated
- ✅ Token issuer and expiration are validated
- ✅ Profile information is only trusted after successful server-side verification
- ✅ Google Client Secret is never exposed to the frontend
- ✅ Admin roles can never be granted through Google sign-in
- ✅ Duplicate accounts are prevented — same email is linked to existing account

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Google sign-in cancelled" | Check Authorized JavaScript Origins includes your URL |
| "Invalid audience" error | GOOGLE_CLIENT_ID mismatch between frontend and backend |
| "This app isn't verified" | Publish the OAuth consent screen |
| Button doesn't appear | VITE_GOOGLE_CLIENT_ID is not set in frontend env |
| Works locally, fails in prod | Add production URL to Authorized JavaScript Origins |
