# Green-Tax Compliance & Rebate Monitor - Backend API

A comprehensive backend system for monitoring waste segregation compliance and calculating tax rebates for housing societies.

## 🎯 Overview

This backend powers a governance platform that:
- Tracks waste segregation proof submissions from societies
- Automatically validates proof authenticity (location, timestamp, duplicate detection)
- Evaluates compliance status (GREEN/YELLOW/RED)
- Calculates property tax rebates based on compliance
- Provides BMC admin dashboard for oversight
- Offers resident-facing views for transparency

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Image Storage**: Mock Cloudinary (can be integrated with real service)

## 📁 Project Structure

```
green-tax-backend/
├── config/
│   └── database.js           # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── societyController.js  # Society management
│   ├── proofController.js    # Proof upload & retrieval
│   ├── adminController.js    # BMC admin operations
│   └── complianceController.js # Compliance & rebate logic
├── middleware/
│   ├── auth.js               # JWT authentication & authorization
│   └── upload.js             # Multer file upload config
├── models/
│   ├── User.js               # User schema
│   ├── Society.js            # Society schema
│   ├── ProofLog.js           # Proof log schema (immutable)
│   └── ComplianceRecord.js   # Compliance record schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── societyRoutes.js      # Society endpoints
│   ├── proofRoutes.js        # Proof endpoints
│   ├── adminRoutes.js        # Admin endpoints
│   └── complianceRoutes.js   # Compliance & resident endpoints
├── services/
│   ├── validationService.js  # Proof validation logic
│   └── complianceService.js  # Compliance evaluation logic
├── utils/
│   └── helpers.js            # Utility functions
├── .env                      # Environment variables
├── server.js                 # Main server file
├── seed.js                   # Database seeder
└── package.json              # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)

### Installation

1. Clone and navigate to the project:
```bash
cd green-tax-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/green-tax-db
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

4. Seed the database with test data:
```bash
node seed.js
```

5. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## 🔑 Test Credentials

After seeding, use these credentials:

**BMC Admin:**
- Email: `admin@bmc.gov.in`
- Password: `admin123`

**Secretary (Green Valley):**
- Email: `secretary1@greenvalley.com`
- Password: `secretary123`

**Resident (Green Valley):**
- Email: `resident1@greenvalley.com`
- Password: `resident123`

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/login`
Login user and receive JWT token.

**Request:**
```json
{
  "email": "admin@bmc.gov.in",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "USR-001",
    "name": "BMC Admin",
    "email": "admin@bmc.gov.in",
    "role": "BMC_ADMIN",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/register`
Register new user (for testing).

#### GET `/api/auth/me`
Get current user details (requires auth).

---

### Society Management

#### POST `/api/society/register`
Register new society (BMC_ADMIN only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Green Valley Apartments",
  "ward": "A-Ward",
  "geoLocation": {
    "lat": 19.0760,
    "lng": 72.8777
  },
  "propertyTaxNumber": "PTN-2024-001",
  "address": "Andheri West, Mumbai",
  "totalUnits": 50,
  "contactEmail": "greenvalley@example.com"
}
```

#### GET `/api/society/:societyId`
Get society details.

#### GET `/api/society`
Get all societies with filters (BMC_ADMIN only).

**Query Params:**
- `ward`: Filter by ward (e.g., "A-Ward")
- `status`: Filter by active/inactive

---

### Proof Upload & Management

#### POST `/api/proof/upload`
Upload waste segregation proof (SECRETARY only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image`: Image file (JPEG/PNG, max 5MB)
- `societyId`: Society MongoDB ObjectId
- `geoLocation`: JSON string `{"lat": 19.0760, "lng": 72.8777}`

**Response:**
```json
{
  "success": true,
  "data": {
    "proof": {
      "logId": "PROOF-001",
      "societyId": "...",
      "imageUrl": "https://mock-cloudinary.com/...",
      "status": "VERIFIED",
      "timestamp": "2026-02-02T10:30:00.000Z"
    },
    "validation": {
      "status": "VERIFIED",
      "reason": "All validation checks passed"
    }
  }
}
```

**Validation Rules:**
1. **Geo-radius**: Upload location must be within 500m of society location
2. **Timestamp**: Image timestamp must be within 30 minutes
3. **Duplicate**: Image hash must be unique (no resubmissions)

**Possible Statuses:**
- `VERIFIED`: All checks passed
- `FLAGGED`: Some checks failed (requires admin review)
- `REJECTED`: Duplicate or critical failure

#### GET `/api/proof/society/:societyId`
Get all proofs for a society.

**Query Params:**
- `status`: Filter by VERIFIED/FLAGGED/REJECTED
- `limit`: Max results (default: 50)

#### GET `/api/proof/:logId`
Get single proof details.

---

### Compliance & Rebate

#### POST `/api/compliance/evaluate`
Evaluate compliance for a society (BMC_ADMIN, SECRETARY).

**Request:**
```json
{
  "societyId": "65f7b8c9d4e5f6a7b8c9d0e1"
}
```

**Compliance Rules:**
- **GREEN** (10% rebate): Proof submitted today
- **YELLOW** (5% rebate): Last proof 1-2 days ago
- **RED** (0% rebate): Last proof 3+ days ago

**Response:**
```json
{
  "success": true,
  "data": {
    "societyId": "...",
    "complianceStatus": "GREEN",
    "rebatePercent": 10,
    "proofCount": 5,
    "lastProofDate": "2026-02-02T08:00:00.000Z",
    "daysSinceLastProof": 0,
    "complianceScore": 100
  }
}
```

#### GET `/api/rebate/:societyId`
Get rebate calculation for society.

---

### Resident View

#### GET `/api/resident/society/:societyId/summary`
Get society summary for residents (RESIDENT, SECRETARY).

**Response:**
```json
{
  "success": true,
  "data": {
    "society": {
      "name": "Green Valley Apartments",
      "ward": "A-Ward",
      "propertyTaxNumber": "PTN-2024-001"
    },
    "compliance": {
      "complianceStatus": "GREEN",
      "rebatePercent": 10,
      "proofCount": 5,
      "lastProofDate": "2026-02-02T08:00:00.000Z"
    },
    "recentProofs": [...],
    "wasteStats": {
      "totalWasteCollected": 450,
      "recyclableWaste": 120,
      "organicWaste": 280
    }
  }
}
```

---

### BMC Admin Dashboard

#### GET `/api/admin/dashboard`
Get admin dashboard statistics (BMC_ADMIN only).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSocieties": 4,
    "complianceBreakdown": {
      "GREEN": 1,
      "YELLOW": 1,
      "RED": 2
    },
    "proofStats": {
      "total": 10,
      "verified": 7,
      "flagged": 2,
      "rejected": 1
    },
    "wardBreakdown": [
      { "_id": "A-Ward", "count": 2 },
      { "_id": "B-Ward", "count": 1 }
    ]
  }
}
```

#### GET `/api/admin/societies`
Get all societies with compliance data (BMC_ADMIN only).

**Query Params:**
- `ward`: Filter by ward
- `complianceStatus`: Filter by GREEN/YELLOW/RED

#### GET `/api/admin/proofs/pending`
Get all flagged proofs pending review (BMC_ADMIN only).

#### POST `/api/admin/proof/:logId/approve`
Approve a flagged proof (BMC_ADMIN only).

#### POST `/api/admin/proof/:logId/reject`
Reject a proof (BMC_ADMIN only).

**Request:**
```json
{
  "reason": "Invalid image or location mismatch"
}
```

---

### Heatmap

#### GET `/api/heatmap/ward`
Get heatmap data for all societies (BMC_ADMIN only).

**Response:**
```json
{
  "success": true,
  "data": {
    "societies": [
      {
        "ward": "A-Ward",
        "societyName": "Green Valley Apartments",
        "lat": 19.0760,
        "lng": 72.8777,
        "complianceScore": 100,
        "complianceStatus": "GREEN",
        "rebatePercent": 10
      }
    ],
    "wardSummary": [
      {
        "ward": "A-Ward",
        "totalSocieties": 2,
        "avgComplianceScore": 60,
        "greenCount": 1,
        "yellowCount": 0,
        "redCount": 1
      }
    ]
  }
}
```

---

## 🔐 Authentication & Authorization

All endpoints except `/api/auth/login` and `/api/auth/register` require authentication.

**Header Format:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Roles:**
- `BMC_ADMIN`: Full access (approve/reject proofs, view all data)
- `SECRETARY`: Upload proofs, view society data
- `RESIDENT`: View own society data

---

## 🗄️ Data Models

### User
- `userId`: Unique identifier
- `name`, `email`, `password`: User details
- `role`: SECRETARY | BMC_ADMIN | RESIDENT
- `societyId`: Reference to Society (nullable for BMC)

### Society
- `societyId`: Unique identifier
- `name`, `ward`: Society details
- `geoLocation`: { lat, lng }
- `propertyTaxNumber`: Unique tax number

### ProofLog (Immutable)
- `logId`: Unique identifier
- `societyId`: Reference to Society
- `imageUrl`, `imageHash`: Image details
- `timestamp`, `geoLocation`: Submission details
- `status`: VERIFIED | FLAGGED | REJECTED
- **Note**: Updates only allowed for `status` (admin review)

### ComplianceRecord
- `societyId`: Reference to Society
- `week`, `month`, `year`: Time period
- `complianceStatus`: GREEN | YELLOW | RED
- `rebatePercent`: 0-100
- `proofCount`, `complianceScore`: Metrics

---

## 🎯 Key Features

### 1. Automated Proof Validation
- Geo-radius check (500m)
- Timestamp freshness (30 min)
- Duplicate detection (image hash)

### 2. Compliance Engine
Simple rule-based evaluation:
```
Today's proof → GREEN (10%)
1-2 days ago → YELLOW (5%)
3+ days ago → RED (0%)
```

### 3. Immutable Proof Logs
- Append-only design
- No editing of submitted proofs
- Admin can only change status (review)

### 4. Role-Based Access
- BMC admins: Full oversight
- Secretaries: Upload for their society
- Residents: View their society data

### 5. Heatmap Support
- Ward-level aggregation
- Compliance scoring
- Geographic visualization data

---

## 🧪 Testing with Postman

1. **Login** to get token:
```bash
POST http://localhost:5000/api/auth/login
Body: {"email": "admin@bmc.gov.in", "password": "admin123"}
```

2. **Copy token** from response

3. **Test endpoints** with token in header:
```
Authorization: Bearer <YOUR_TOKEN>
```

---

## 🚨 Important Notes

### ProofLog Immutability
The `ProofLog` model is designed to be **append-only**. The pre-save hook prevents updates except for admin status changes. This ensures audit trail integrity.

### Mock Image Storage
Currently uses mock URLs. In production, integrate with Cloudinary:
```javascript
// In services/validationService.js
const cloudinary = require('cloudinary').v2;
const result = await cloudinary.uploader.upload(imageBuffer);
return result.secure_url;
```

### Soft Deletes
No hard deletes are implemented. Use `isActive: false` for soft deletes.

---

## 📈 Future Enhancements

- [ ] Real Cloudinary integration
- [ ] Email notifications for compliance status
- [ ] Advanced analytics dashboard
- [ ] Bulk proof upload
- [ ] Mobile app integration
- [ ] Blockchain-based proof verification
- [ ] ML-based image validation

---

## 🤝 Contributing

This is a hackathon project. Feel free to extend and improve!

---

## 📄 License

MIT

---

## 📞 Support

For issues or questions, create an issue in the repository.

---

**Built with ❤️ for sustainable cities and good governance** 🌿