# 🩸 LIFORA – Digital Blood Donation Emergency Network

**Tagline:** *Connecting the Right Donor at the Right Time.*

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20MongoDB%20%7C%20Socket.IO-red)

---

## 📌 Executive Overview

**LIFORA** is a production-structured full-stack digital emergency coordination platform designed to bridge critical gaps between patients in urgent need of blood transfusions, volunteer donors, hospitals, and central blood banks. 

By utilizing automated clinical blood compatibility rules, real-time availability tracking, and WebSockets for instant in-app alerts, LIFORA minimizes the response latency during life-threatening medical emergencies while safeguarding donor privacy.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Vanilla Tailwind CSS with glassmorphic healthcare design system
- **Routing:** React Router DOM (v6)
- **API Client:** Axios (with request & response interceptors)
- **Icons:** Lucide React
- **Analytics & Charts:** Recharts
- **Interactive Mapping:** Leaflet & React-Leaflet with OpenStreetMap
- **Real-Time Push:** Socket.IO Client

### Backend
- **Runtime:** Node.js & Express.js
- **Database:** MongoDB Atlas with Mongoose ORM
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **WebSockets:** Socket.IO Server
- **Security & Reliability:** Helmet headers, CORS policy, Express Rate Limiter, Express Error Handler

### Deployment & Cloud Infrastructure
- **Source Hosting:** GitHub
- **Production Host:** Railway (Single unified web service serving built Vite React app & Express API)
- **Database Cloud:** MongoDB Atlas / MongoMemoryServer fallback

---

## 🌟 Key Features & Role Architecture

The platform supports 5 distinct role-based experiences:

1. **Volunteer Donors:**
   - Real-time availability status toggle (`Available` / `Unavailable`).
   - Matching emergency blood request alerts based on compatible blood groups.
   - One-click Accept or Decline request actions.
   - Privacy-conscious contact sharing (unlocked only upon request acceptance).
   - Personal donation response log and clinical history.

2. **Patients / Requesters:**
   - Submit emergency blood requests with patient name, required blood group, units needed, urgency rating, and hospital location.
   - Track request status lifecycle (`Pending`, `Matching`, `Donor Responded`, `In Coordination`, `Fulfilled`, `Cancelled`).
   - Monitor alerted donor candidate responses in real-time.

3. **Hospitals & Medical Facilities:**
   - Facility emergency request publishing dashboard.
   - Algorithmic donor matching engine displaying candidate donors, compatibility notes, and approximate distances.
   - Clinical donation verification modal (marks request `Fulfilled` upon confirmed physical donation).

4. **Blood Bank Inventory Management:**
   - Reported inventory tracking for all 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
   - Recorded staff transactions and stock status flags (`In Stock`, `Low Stock`, `Out of Stock`, `Critical`).
   - Reported inventory disclaimer notice ensuring compliance.

5. **Platform Administration:**
   - System analytical dashboard powered by Recharts (requests by blood group bar chart, status pie charts).
   - User account management with search, filtering, hospital licensing verification, and account suspension/reactivation.
   - System audit activity logs and public contact form inquiry viewer.

---

## 🧬 Clinical Matching Engine & Compatibility Matrix

LIFORA implements clinically reviewed blood group compatibility rules:

| Donor Type | Compatible Recipient Groups |
| :--- | :--- |
| **O-** | O-, O+, A-, A+, B-, B+, AB-, AB+ *(Universal Red Cell Donor)* |
| **O+** | O+, A+, B+, AB+ |
| **A-** | A-, A+, AB-, AB+ |
| **A+** | A+, AB+ |
| **B-** | B-, B+, AB-, AB+ |
| **B+** | B+, AB+ |
| **AB-** | AB-, AB+ |
| **AB+** | AB+ *(Universal Recipient)* |

---

## 🔑 Pre-Seeded Quick Demo Accounts

For hackathon evaluation and testing, run `npm run seed` to populate these ready-to-use accounts. Password for **ALL** demo accounts is: **`Lifora@123`**

| Role | Email Address | Password | Description |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@lifora.org` | `Lifora@123` | Root system access, analytics & approval |
| **Hospital** | `hospital@lifora.org` | `Lifora@123` | Metro Care Super Specialty Hospital |
| **Blood Bank** | `bloodbank@lifora.org` | `Lifora@123` | Red Cross Central Blood Bank |
| **Donor (O+)** | `donor@lifora.org` | `Lifora@123` | Available volunteer donor (New Delhi) |
| **Requester** | `requester@lifora.org` | `Lifora@123` | Patient family relative |

*Note: One-click demo login buttons are also provided on the Login page.*

---

## 🚀 Quick Start – Local Development

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Environment Configuration
Create a `.env` file inside the `server/` directory (or root `.env`) based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/lifora?retryWrites=true&w=majority
JWT_SECRET=lifora_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

*Note: If `MONGODB_URI` is omitted during local testing, LIFORA automatically boots an in-memory database fallback (`mongodb-memory-server`) so you can test seamlessly without external configuration!*

### 3. Install Dependencies
From the project root:

```bash
# Install root, server, and client dependencies
npm install
```

### 4. Seed Synthetic Demo Data
```bash
npm run seed
```

### 5. Launch Local Development Server
```bash
npm run dev
```

The app will be available at:
- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api/health`

---

## 📦 Railway Deployment Instructions

LIFORA is structured to deploy as a unified service on Railway:

1. **Push your code to GitHub** (see Git commands below).
2. Log in to [Railway.app](https://railway.app) and create a **New Project**.
3. Select **Deploy from GitHub repo** and pick your `lifora` repository.
4. In Railway **Variables**, configure the following environment variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lifora?retryWrites=true&w=majority`
   - `JWT_SECRET` = `your_secure_production_secret_key`
   - `PORT` = `5000` (Railway automatically overrides process.env.PORT)
5. Railway will automatically build the Vite frontend (`npm run build`) and start the production backend (`npm start`).
6. Once deployed, Railway provides a public website URL (e.g., `https://lifora-production.up.railway.app`).

---

## 🐙 GitHub Push Commands

To push this repository to GitHub, run the following commands in your shell:

```bash
git init
git add .
git commit -m "Initial commit: LIFORA Digital Blood Donation Network full-stack application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lifora-blood-network.git
git push -u origin main
```

---

## ⚠️ Medical Safety & Clinical Disclaimer

> **IMPORTANT MEDICAL NOTICE:**
> LIFORA is a preliminary communication and coordination platform. Software matches do **NOT** guarantee clinical blood compatibility, donor health qualification, or freedom from transfusion-transmitted pathogens. All blood grouping, viral screening, crossmatching, and donor eligibility verification **MUST** be performed by authorized healthcare professionals and certified blood bank laboratories prior to transfusion.

---

## 📜 License

Distributed under the MIT License. Built for human life-saving emergency coordination.
