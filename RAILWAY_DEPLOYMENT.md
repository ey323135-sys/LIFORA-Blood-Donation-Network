# 🚂 Railway Deployment Guide for LIFORA

This guide walks you through deploying LIFORA to Railway from GitHub.

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account with the LIFORA repository pushed
- [ ] MongoDB Atlas cluster created and connection string ready
- [ ] Google OAuth Client ID configured
- [ ] Strong JWT secret generated

---

## Step 1 — Push to GitHub

### Initialize Git (if not done already)

```bash
cd "blood donation"
git init
git add .
git commit -m "feat: LIFORA production-ready full-stack app"
```

### Create GitHub Repository

1. Go to [github.com](https://github.com) → **New repository**
2. Name: `lifora-blood-donation-network`
3. **Private** (recommended) or Public
4. Do NOT initialize with README (you already have files)
5. Click **Create repository**

### Push Code

```bash
git remote add origin https://github.com/YOUR_USERNAME/lifora-blood-donation-network.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with **GitHub** (recommended — enables automatic deploys)

---

## Step 3 — Create Railway Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Authorize Railway to access your GitHub account
4. Select your `lifora-blood-donation-network` repository
5. Click **Deploy Now**

Railway will start building immediately (this first build may fail — that's OK, we need to set env variables first).

---

## Step 4 — Configure Environment Variables

In your Railway project:

1. Click on your **service** (the one Railway created)
2. Go to **Variables** tab
3. Add each variable below:

### Required Variables

```
NODE_ENV                = production
MONGODB_URI             = mongodb+srv://lifora-user:PASSWORD@cluster.mongodb.net/lifora?retryWrites=true&w=majority
JWT_SECRET              = (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_EXPIRES_IN          = 7d
GOOGLE_CLIENT_ID        = YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET    = YOUR_CLIENT_SECRET
CLIENT_URL              = https://your-lifora-app.railway.app
CORS_ORIGIN             = https://your-lifora-app.railway.app
```

### Frontend Build Variables (VITE)

> ⚠️ IMPORTANT: Vite environment variables must be prefixed with `VITE_` and are baked in at build time.

```
VITE_GOOGLE_CLIENT_ID   = YOUR_CLIENT_ID.apps.googleusercontent.com
```

### Optional Email Variables

```
EMAIL_HOST              = smtp.gmail.com
EMAIL_PORT              = 587
EMAIL_SECURE            = false
EMAIL_USER              = your-gmail@gmail.com
EMAIL_PASSWORD          = your-app-password
EMAIL_FROM              = LIFORA Network <noreply@lifora.org>
```

---

## Step 5 — Set Build & Start Commands

In Railway:

1. Click on your service → **Settings** tab
2. Scroll to **Build & Deploy**
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

Or Railway will auto-detect from `railway.json` and `nixpacks.toml`.

---

## Step 6 — Get Your Railway Domain

1. Go to **Settings** → **Networking** → **Generate Domain**
2. Railway gives you a URL like `https://lifora-network.railway.app`
3. Copy this URL

---

## Step 7 — Update Environment Variables with Your Domain

Go back to **Variables** and update:

```
CLIENT_URL   = https://lifora-network.railway.app
CORS_ORIGIN  = https://lifora-network.railway.app
```

Then **Redeploy** the service.

---

## Step 8 — Update Google OAuth with Production Domain

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials** → Your OAuth Client
3. Add to **Authorized JavaScript Origins**:
   ```
   https://lifora-network.railway.app
   ```
4. Save

---

## Step 9 — Create Admin Account

After successful deployment, SSH into Railway or run this via Railway Shell:

```bash
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=SecurePassword123! node server/scripts/createAdmin.js
```

Or use Railway's service shell:
1. Click your service → **Deploy** tab → click the latest deployment
2. Click **Shell** (if available in your plan)
3. Run the admin creation command

---

## Step 10 — Verify Deployment

Visit your Railway URL and check:

- [ ] Home page loads
- [ ] `/api/health` returns `{"status":"healthy"}`
- [ ] Login page shows Google sign-in button
- [ ] Can register a new user
- [ ] Google OAuth works
- [ ] Dashboard loads after login

---

## Automatic Deploys

Once connected to GitHub, every `git push` to `main` automatically triggers a new Railway deployment.

```bash
git add .
git commit -m "feat: your feature description"
git push origin main
# Railway automatically deploys!
```

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | Must be `production` |
| `PORT` | Auto | Set by Railway automatically |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Long random secret for tokens |
| `JWT_EXPIRES_IN` | ✅ | Token expiry (e.g. `7d`) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret |
| `CLIENT_URL` | ✅ | Frontend URL (Railway domain) |
| `CORS_ORIGIN` | ✅ | Same as CLIENT_URL |
| `VITE_GOOGLE_CLIENT_ID` | ✅ | Frontend build-time Google Client ID |
| `EMAIL_HOST` | Optional | SMTP host for emails |
| `EMAIL_USER` | Optional | SMTP username |
| `EMAIL_PASSWORD` | Optional | SMTP password or App Password |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check `nixpacks.toml` exists; check Railway build logs |
| `MONGODB_URI not configured` | Add the variable in Railway → Variables |
| Google sign-in fails | Add Railway domain to Google OAuth Authorized Origins |
| API 404 errors | Check build completed, frontend served by Express |
| CORS errors | Update `CLIENT_URL` and `CORS_ORIGIN` with Railway domain |
| Page refresh gives 404 | Express serves React SPA — should work automatically |
| Slow first load | First request after cold start; normal for free tier |
