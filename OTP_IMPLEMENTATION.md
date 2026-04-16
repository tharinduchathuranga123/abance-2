# OTP Implementation Guide

## Overview
The backend now has complete OTP generation, validation, and integration with WorkHub24 SMS service. All phone numbers are normalized to use the "94" prefix format (Sri Lankan country code).

---

## Backend API Endpoints

### 1. **POST /api/generate-otp**
Generate and send OTP to customer's phone via WorkHub24

**Request Body:**
```json
{
  "name": "John Doe",
  "nicNo": "123456789V",
  "phone": "0701234567"  // or "94701234567" - both formats accepted
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP generated and sent to your phone number.",
  "phone": "94701234567",
  "expiresIn": 600
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid phone number format. Please use format like 0701234567 or 94701234567."
}
```

**Features:**
- Generates 6-digit OTP
- Auto-normalizes phone numbers (removes leading "0", adds "94" prefix)
- Sends OTP via WorkHub24 SMS service
- OTP expires after 10 minutes
- Falls back gracefully if SMS delivery fails (stores OTP locally)

---

### 2. **POST /api/verify-otp**
Verify OTP and retrieve customer details

**Request Body:**
```json
{
  "phone": "94701234567",  // or "0701234567"
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "verified": true,
  "customer": {
    "name": "John Doe",
    "nicNo": "123456789V",
    "phone": "94701234567",
    "verifiedAt": "2026-04-09T10:30:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid OTP. Attempts remaining: 2"
}
```

**Features:**
- Validates OTP against stored value
- Max 3 attempts per OTP
- Returns customer details on success
- Returns remaining attempts on failure
- Auto-expires after 10 minutes

---

### 3. **POST /api/pre-register** (Updated)
Pre-register customer before form submission

**Request Body:**
```json
{
  "name": "John Doe",
  "nicNo": "123456789V",
  "phone": "0701234567"  // or "94701234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Details saved. Proceeding to application.",
  "phone": "94701234567"
}
```

**Changes:**
- Now normalizes phone numbers (removes "0", adds "94" prefix)
- Returns normalized phone in response

---

### 4. **POST /api/submit-application** (Enhanced)
Submit full application with OTP

**Request Body:**
```json
{
  "formData": {
    "fullName": "John Doe",
    "nicNo": "123456789V",
    "mobile1": "0701234567",
    "otp": "123456",  // Optional - OTP sent with application
    ... // all other form fields
  }
}
```

**Changes:**
- OTP is included in WorkHub24 workflow card if provided
- Phone number is normalized before sending to WorkHub24
- Mobile number is sent as normalized format

---

## Phone Number Normalization

All phone numbers are automatically normalized using the following logic:

```
Input: "0701234567"  →  Output: "94701234567"
Input: "701234567"   →  Output: "94701234567"
Input: "94701234567" →  Output: "94701234567"
Input: "+94701234567" → Output: "94701234567"
```

**Normalization Process:**
1. Remove spaces, dashes, parentheses
2. Remove leading "0" if present
3. Add "94" prefix if not already present

---

## OTP Storage & Security

### In-Memory Storage
- OTPs stored in-memory with 10-minute expiration
- Automatic cleanup after expiration
- Max 3 verification attempts per OTP
- Attempts tracked per phone number

### Security Features
- 6-digit OTP for reasonable security
- Time-limited validity (10 minutes)
- Failed attempt tracking
- Automatic lockout after 3 failed attempts
- OTP sent via WorkHub24 SMS (if SMS service active)

---

## WorkHub24 Integration

### OTP Generation API Call
When `/api/generate-otp` is called:
1. Generate 6-digit OTP
2. Store in local in-memory cache
3. Create workflow card with OTP details
4. Send to WorkHub24 SMS endpoint
5. If SMS fails, OTP still stored locally

### Workflow Card Fields
```json
{
  "title": "OTP for John Doe",
  "name": "John Doe",
  "nicNo": "123456789V",
  "phone": "94701234567",
  "otp": "123456",
  "timestamp": "2026-04-09T10:30:00.000Z"
}
```

### Application Submission
When `/api/submit-application` is called:
- OTP is included in main workflow card if provided
- Mobile number is sent as normalized format
- All phone numbers normalized before sending

---

## React Frontend Integration

### Suggested Flow

```javascript
// Step 1: Generate OTP
const generateOtp = async () => {
  const response = await fetch('http://localhost:3001/api/generate-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.fullName,
      nicNo: formData.nicNo,
      phone: formData.mobile1
    })
  });
  const data = await response.json();
  // Show OTP input field
};

// Step 2: Verify OTP
const verifyOtp = async (otp) => {
  const response = await fetch('http://localhost:3001/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: formData.mobile1,
      otp: otp
    })
  });
  const data = await response.json();
  // If success, proceed to application submission
  // Store OTP in formData.otp for later submission
};

// Step 3: Submit Application (with OTP)
const submitApplication = async () => {
  const response = await fetch('http://localhost:3001/api/submit-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formData: {
        ...formData,
        otp: verifiedOtp // OTP from step 2
      }
    })
  });
  const data = await response.json();
};
```

---

## Error Handling

### Common Error Scenarios

| Scenario | Status | Message |
|----------|--------|---------|
| Missing required fields | 400 | "Name, NIC, and phone number are required." |
| Invalid phone format | 400 | "Invalid phone number format. Please use format like 0701234567 or 94701234567." |
| OTP not found | 401 | "OTP not found or expired" |
| OTP expired | 401 | "OTP has expired" |
| Invalid OTP | 401 | "Invalid OTP. Attempts remaining: 2" |
| Too many attempts | 401 | "Too many failed attempts. Please request a new OTP." |
| Server error | 500 | "Server error: [error message]" |

---

## Testing

### Test Case 1: Generate OTP
```bash
curl -X POST http://localhost:3001/api/generate-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "nicNo": "123456789V",
    "phone": "0701234567"
  }'
```

### Test Case 2: Verify OTP
```bash
curl -X POST http://localhost:3001/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0701234567",
    "otp": "123456"
  }'
```

### Test Case 3: Submit Application with OTP
```bash
curl -X POST http://localhost:3001/api/submit-application \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "fullName": "John Doe",
      "nicNo": "123456789V",
      "mobile1": "0701234567",
      "otp": "123456",
      ... // other fields
    }
  }'
```

---

## Current Requirements Preserved

✅ All existing application functionality remains unchanged:
- Pre-registration endpoint still works
- Application submission to all WorkHub24 datastores
- Bank details, credit facilities, vehicles, shares, etc.
- Workflow card creation
- Family members, guarantors, property details
- Income and expense tracking

---

## Notes

- OTP storage is in-memory: resets on server restart
- For production, consider using Redis or database for OTP storage
- WorkHub24 SMS service must be configured in WorkHub24 dashboard
- Auth token in server.js may need refresh (check expiry date in token)
- All phone numbers normalized to "94" format before sending to WorkHub24
