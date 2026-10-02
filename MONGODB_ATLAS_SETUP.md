# 🍃 MongoDB Atlas Setup Guide for LIFORA

This guide walks you through creating a free MongoDB Atlas cluster for LIFORA.

---

## Step 1 — Create a MongoDB Atlas Account

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click **Try Free** → Sign up with Google or email
3. Complete the registration

---

## Step 2 — Create a Free Cluster

1. After signing in, click **Build a Database**
2. Select **M0 (Free)** tier
3. Choose a **cloud provider** and **region** (select the closest to your users)
   - Recommended: AWS → Asia Pacific (Mumbai) for Indian deployments
4. **Cluster Name**: `lifora-cluster` (or any name)
5. Click **Create**

Wait 1–3 minutes for the cluster to be created.

---

## Step 3 — Create a Database User

1. In the left sidebar, go to **Database Access**
2. Click **Add New Database User**
3. **Authentication Method**: Password
4. **Username**: `lifora-user` (or your preferred name)
5. **Password**: Generate a secure password → **Copy and save it**
6. **Database User Privileges**: Select **Read and write to any database**
7. Click **Add User**

---

## Step 4 — Configure Network Access

1. In the left sidebar, go to **Network Access**
2. Click **Add IP Address**
3. For Railway deployment: Click **Allow Access from Anywhere** → `0.0.0.0/0`
   - This allows Railway's dynamic IPs to connect
   - You can restrict this later once you know Railway's static IPs
4. Click **Confirm**

> **For local development**: Also add your own IP address:
> Click **Add IP Address** → **Add Current IP Address** → **Confirm**

---

## Step 5 — Get Your Connection String

1. Go to **Database** (main clusters page)
2. Click **Connect** on your cluster
3. Select **Connect your application**
4. **Driver**: Node.js, **Version**: 5.5 or later
5. Copy the connection string — it looks like:
   ```
   mongodb+srv://lifora-user:<password>@lifora-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=lifora-cluster
   ```
6. Replace `<password>` with the actual password you created in Step 3
7. Add your database name before the `?`:
   ```
   mongodb+srv://lifora-user:YOUR_PASSWORD@lifora-cluster.xxxxx.mongodb.net/lifora?retryWrites=true&w=majority&appName=lifora-cluster
   ```

---

## Step 6 — Add to Environment Variables

### For Local Development

Add to `.env` in the project root:

```bash
MONGODB_URI=mongodb+srv://lifora-user:YOUR_PASSWORD@lifora-cluster.xxxxx.mongodb.net/lifora?retryWrites=true&w=majority
```

### For Railway Production

1. Open Railway → Your Project → Your Service → **Variables**
2. Add:
   ```
   MONGODB_URI = mongodb+srv://lifora-user:YOUR_PASSWORD@lifora-cluster.xxxxx.mongodb.net/lifora?retryWrites=true&w=majority
   ```

---

## Step 7 — Verify Connection

Start the server locally:

```bash
cd server
npm run dev
```

You should see:
```
[LIFORA DB] ✅ Connected to MongoDB Atlas: lifora-cluster.xxxxx.mongodb.net
```

---

## Step 8 — Create the Admin Account

Once connected to MongoDB Atlas, create your admin account:

```bash
# From the project root:
node server/scripts/createAdmin.js
```

Or set environment variables first:
```bash
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=SecurePassword123! node server/scripts/createAdmin.js
```

---

## Database Collections

LIFORA will automatically create these MongoDB collections:

| Collection | Description |
|------------|-------------|
| `users` | All user accounts |
| `donorprofiles` | Donor blood group, availability, location |
| `bloodrequests` | Emergency blood requests |
| `donorresponses` | Donor accept/decline responses |
| `donationrecords` | Verified donation records |
| `hospitalprofiles` | Hospital institution details |
| `bloodbankprofiles` | Blood bank institution details |
| `bloodinventories` | Blood unit stock levels |
| `notifications` | In-app notifications |
| `contactmessages` | Contact form submissions |
| `auditlogs` | System audit trail |
| `organdonations` | Organ donation pledges |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection timeout | Check Network Access whitelist (allow 0.0.0.0/0 for Railway) |
| Authentication failed | Verify username/password in connection string |
| Database not created | It's created automatically on first write |
| `MONGODB_URI is not configured` | Check Railway environment variables spelling |
| Data not persisting | Ensure you're NOT using MongoMemoryServer (check MONGODB_URI) |

---

## Monitoring

In MongoDB Atlas you can:
- View real-time database metrics under **Metrics**
- Browse your data under **Browse Collections**
- Monitor queries under **Performance Advisor**
- Set up **Alerts** for connection limits, etc.
