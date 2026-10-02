# LIFORA – Supabase Setup Guide
## Complete Step-by-Step Setup for the Blood Donation Network

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project** and fill in:
   - **Organization**: Your organization (or personal)
   - **Project Name**: `lifora-blood-network` (or any name)
   - **Database Password**: Generate a strong password and **save it**
   - **Region**: Choose the region closest to your users (e.g., `ap-south-1` for India)
3. Click **Create new project** and wait ~2 minutes for provisioning.

---

## 2. Get Your API Keys

1. Go to **Project Settings → API** in your Supabase dashboard.
2. Copy these 3 values:
   - **Project URL** → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (**never expose in browser**)

---

## 3. Configure Environment Variables

### Root `.env` (backend server):
```bash
# Copy .env.example to .env in the project root
cp .env.example .env
```

Edit `.env` and fill in:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_URL=http://localhost:5173
```

### `client/.env` (React frontend):
```bash
# Copy client/.env.example to client/.env
cp client/.env.example client/.env
```

Edit `client/.env` and fill in:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## 4. Run Database Migrations

1. Open your Supabase project → **SQL Editor** (left sidebar).
2. Run each migration file **in order**:

   **Migration 1: Initial Schema**  
   Open `supabase/migrations/001_initial_schema.sql` → paste the entire content → click **Run**.

   **Migration 2: Row Level Security**  
   Open `supabase/migrations/002_row_level_security.sql` → paste the entire content → click **Run**.

   **Migration 3: Storage Buckets**  
   Open `supabase/migrations/003_storage_buckets.sql` → paste the entire content → click **Run**.

   **Migration 4: Realtime Setup**  
   Open `supabase/migrations/004_realtime_setup.sql` → paste the entire content → click **Run**.

3. Verify tables were created: Go to **Table Editor** → you should see tables like `profiles`, `donor_profiles`, `blood_requests`, etc.

---

## 5. Configure Google OAuth (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**.
2. Create an OAuth 2.0 Client ID (Web application type).
3. Add Authorized Redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy your **Client ID** and **Client Secret**.

5. In Supabase dashboard: **Authentication → Providers → Google**
6. Enable Google, paste your **Client ID** and **Client Secret**, and save.

That's it! Supabase handles the full OAuth flow — no custom code needed.

---

## 6. Provision Admin Account

After running migrations, create your admin user:

```bash
# From project root, set admin credentials in .env:
# ADMIN_NAME=Your Name
# ADMIN_EMAIL=admin@yoursite.com
# ADMIN_PASSWORD=SecurePassword123

node server/scripts/createAdmin.js
```

---

## 7. Start Development Server

```bash
# Install all dependencies (if not done):
npm run install:all

# Start both backend (port 5000) and frontend (port 5173):
npm run dev
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/health

---

## 8. Optional: Seed Demo Data

With your Supabase credentials configured:

```bash
AUTO_SEED=true npm run dev
# OR
npm run seed
```

Demo accounts created (all with password `Lifora@123`):
| Role | Email |
|------|-------|
| Admin | admin@lifora.org |
| Hospital | hospital@lifora.org |
| Blood Bank | bloodbank@lifora.org |
| Requester | requester@lifora.org |
| Donor | donor@lifora.org |

> ⚠️ **Security Warning**: Change all demo passwords immediately in production. Never use demo accounts in production deployments.

---

## 9. Email Configuration (Optional)

For password reset and notification emails, configure SMTP in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM="LIFORA Network" <noreply@lifora.org>
```

**Gmail App Password Setup:**
1. Enable 2-Factor Authentication on your Google account.
2. Go to: Google Account → Security → App Passwords.
3. Generate an App Password for "Mail".
4. Use the 16-character code in `EMAIL_PASSWORD`.

---

## 10. Production Deployment (Railway)

1. Push your code to GitHub.
2. Go to [Railway](https://railway.app) → **New Project → Deploy from GitHub**.
3. Set all environment variables in Railway's **Variables** tab (same as your `.env`).
4. Add `NODE_ENV=production` and your production `CLIENT_URL`.
5. Railway auto-detects the `nixpacks.toml` and deploys.

See `RAILWAY_DEPLOYMENT.md` for the complete deployment guide.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `profiles` table not found | Run all 4 migration files in Supabase SQL Editor |
| Google OAuth not working | Check redirect URI in Google Console matches `https://your-id.supabase.co/auth/v1/callback` |
| Auth token invalid | Ensure `SUPABASE_URL` and keys are identical between `.env` and `client/.env` |
| Server won't start | Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env` |
| CORS errors | Ensure `CLIENT_URL` in `.env` matches your frontend URL exactly |
