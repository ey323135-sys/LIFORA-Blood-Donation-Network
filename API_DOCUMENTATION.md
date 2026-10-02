# 📚 LIFORA API Documentation

Complete REST API specification for **LIFORA – Digital Blood Donation Emergency Network**.

All endpoints are prefixed with `/api`.  
Unless marked **Public**, all requests require a JWT token passed in the `Authorization` header:  
`Authorization: Bearer <your_jwt_token>`

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Continue with Google
- **Endpoint**: `POST /api/auth/google`
- **Access**: Public
- **Description**: Verifies Google Identity Services ID token on backend using Google's official library, links or creates user account, generates JWT session.
- **Request Body**:
  ```json
  {
    "credential": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "isNewUser": false,
    "requiresProfileCompletion": false,
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "Alex Mercer",
      "email": "alex@gmail.com",
      "role": "donor",
      "city": "Bengaluru",
      "state": "Karnataka",
      "avatar": "https://lh3.googleusercontent.com/...",
      "isVerified": true,
      "authProvider": "google"
    }
  }
  ```

### 1.2 User Registration
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Description**: Registers a new user with local credentials and creates role profile. Note: Normal users cannot register as `admin`.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "StrongPassword123!",
    "confirmPassword": "StrongPassword123!",
    "phone": "+91 98765 43210",
    "role": "donor",
    "city": "Mumbai",
    "state": "Maharashtra",
    "bloodGroup": "O+",
    "dateOfBirth": "1998-05-14",
    "availabilityPreference": "Available"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGci...",
    "user": { ... },
    "message": "Registration successful! Verification email has been sent."
  }
  ```

### 1.3 User Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGci...",
    "user": { ... }
  }
  ```

### 1.4 Get Authenticated User
- **Endpoint**: `GET /api/auth/me`
- **Access**: Private (Any role)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": { ... },
    "profile": { ... }
  }
  ```

### 1.5 Complete Profile
- **Endpoint**: `POST /api/auth/complete-profile`
- **Access**: Private (Any role)
- **Request Body**:
  ```json
  {
    "phone": "+91 98765 43210",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "role": "donor",
    "bloodGroup": "B+"
  }
  ```

### 1.6 User Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Private
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 1.7 Password Recovery
- **Request Reset**: `POST /api/auth/forgot-password` (`{ "email": "user@example.com" }`)
- **Execute Reset**: `POST /api/auth/reset-password` (`{ "token": "...", "newPassword": "...", "confirmPassword": "..." }`)

---

## 2. Donor Endpoints (`/api/donors`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/donors/profile` | Donor | Get donor profile and statistics |
| `PUT` | `/api/donors/profile` | Donor | Update personal details & blood group |
| `PATCH` | `/api/donors/availability` | Donor | Toggle `isAvailable` (true/false) |
| `GET` | `/api/donors/matching-requests` | Donor | View emergency requests matching donor's blood group |
| `POST` | `/api/donors/respond` | Donor | Accept or decline a blood request (`{ requestId, status: 'accepted'\|'declined', estimatedArrivalTime }`) |
| `GET` | `/api/donors/history` | Donor | View past donation history and confirmed records |
| `GET` | `/api/donors/stats` | Donor | Donor impact metrics (units, lives impacted, responses) |

---

## 3. Blood Request Endpoints (`/api/requests`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/requests` | Requester, Hospital, Admin | Create emergency blood request (triggers donor matching & Socket notifications) |
| `GET` | `/api/requests` | Private | List requests created by current user or filtered by status |
| `GET` | `/api/requests/:id` | Private | Request details, patient condition, matched counts |
| `GET` | `/api/requests/:id/responses` | Requester, Hospital | View donors who accepted/responded to request |
| `PATCH` | `/api/requests/:id/cancel` | Creator, Admin | Cancel a request (`{ reason }`) |
| `PATCH` | `/api/requests/:id/fulfill` | Creator, Hospital, Admin | Mark request fulfilled (`{ donorId, unitsFulfilled }`) |

---

## 4. Matching Engine (`/api/matching`)

- **Endpoint**: `GET /api/matching/find-donors/:requestId`
- **Access**: Requester, Hospital, Admin
- **Description**: Runs red-blood-cell compatibility algorithm, filters available donors in the city/state, sorts by urgency and distance.

---

## 5. Hospital Endpoints (`/api/hospitals`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/hospitals/profile` | Hospital | Get hospital profile & verification status |
| `PUT` | `/api/hospitals/profile` | Hospital | Update institution details |
| `GET` | `/api/hospitals/requests` | Hospital | View all hospital emergency requests |
| `POST` | `/api/hospitals/emergency-request` | Hospital | Create high-priority verified clinical request |
| `PATCH` | `/api/hospitals/requests/:id/status` | Hospital | Update clinical progress / record fulfillment |

---

## 6. Blood Bank Endpoints (`/api/bloodbanks`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/bloodbanks/profile` | Blood Bank | Get blood bank profile & verification status |
| `GET` | `/api/bloodbanks/inventory` | Blood Bank | Get current stock for all 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) |
| `POST` | `/api/bloodbanks/inventory/update` | Blood Bank | Add/subtract stock units (`{ bloodGroup, units, action: 'add'\|'dispatch'\|'set', notes }`) |
| `GET` | `/api/bloodbanks/inventory/history` | Blood Bank | Audit trail of inventory updates |

---

## 7. Real-Time Notifications (`/api/notifications`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/notifications` | Private | Get user notifications with unread count |
| `PATCH` | `/api/notifications/:id/read` | Private | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Private | Mark all user notifications as read |

---

## 8. Admin Dashboard Endpoints (`/api/admin`)

> 🔒 **Requires role: `admin`**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | System overview: total users, donors, requests, hospitals, blood banks |
| `GET` | `/api/admin/users` | List registered users with pagination & role filtering |
| `PATCH` | `/api/admin/users/:id/status` | Suspend or reactivate user account (`{ status: 'active'\|'suspended' }`) |
| `GET` | `/api/admin/institutions` | List hospitals & blood banks requiring verification |
| `PATCH` | `/api/admin/institutions/:id/verify` | Approve or reject institutional verification (`{ isVerified: true\|false }`) |
| `GET` | `/api/admin/audit-logs` | Query platform audit trails with filters |
| `GET` | `/api/admin/contact-messages` | Review contact messages submitted by users |
| `PATCH` | `/api/admin/contact-messages/:id` | Update contact ticket status (`{ status: 'read'\|'replied'\|'resolved' }`) |

---

## 9. Contact & Support (`/api/contact`)

- **Endpoint**: `POST /api/contact`
- **Access**: Public (Rate-limited to 5 requests per 15 min per IP)
- **Request Body**:
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "subject": "Inquiry regarding blood donation drive",
    "message": "We would like to organize a campus blood donation camp..."
  }
  ```

---

## 10. Health Check

- **Endpoint**: `GET /api/health`
- **Access**: Public
- **Response**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-01T15:00:00.000Z",
    "database": "connected",
    "environment": "production"
  }
  ```
