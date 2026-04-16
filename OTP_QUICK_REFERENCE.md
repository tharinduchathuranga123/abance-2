# OTP Implementation - Quick Reference

## ✅ What Was Implemented

### 1. **OTP Generation Utilities**
- `generateOTP(length)` - Generates 6-digit random OTP
- `normalizePhoneNumber(phone)` - Normalizes phone to 94 format
- `storeOTP(phone, name, nicNo, otp)` - Stores OTP with 10-min expiry
- `verifyOTP(phone, otp)` - Validates OTP with attempt tracking

### 2. **New API Endpoints**

#### **POST /api/generate-otp**
Generate and send OTP via WorkHub24 SMS
- Normalizes phone: `0701234567` → `94701234567`
- Generates 6-digit OTP
- Sends to WorkHub24 workflow card
- Falls back gracefully if SMS fails
- 10-minute expiration

#### **POST /api/verify-otp**
Verify OTP code from customer
- Max 3 attempts per OTP
- Returns customer details on success
- Shows remaining attempts on failure
- Auto-expires after 10 minutes

### 3. **Enhanced Existing Endpoints**

#### **POST /api/pre-register** (Updated)
- Phone number auto-normalization
- Returns normalized phone in response

#### **POST /api/submit-application** (Enhanced)
- OTP included in WorkHub24 workflow card
- Phone numbers normalized before sending
- All existing functionality preserved

### 4. **Phone Number Normalization**
Automatically converts:
- `0701234567` → `94701234567`
- `701234567` → `94701234567`
- `94701234567` → `94701234567` (unchanged)
- `+94701234567` → `94701234567`

---

## 📝 Usage Examples

### Example 1: Generate OTP
```bash
curl -X POST http://localhost:3001/api/generate-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "nicNo": "123456789V",
    "phone": "0701234567"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP generated and sent to your phone number.",
  "phone": "94701234567",
  "expiresIn": 600
}
```

### Example 2: Verify OTP
```bash
curl -X POST http://localhost:3001/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0701234567",
    "otp": "123456"
  }'
```

**Response:**
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

### Example 3: Submit Application with OTP
```json
{
  "formData": {
    "fullName": "John Doe",
    "nicNo": "123456789V",
    "mobile1": "0701234567",
    "otp": "123456",
    ... // other fields
  }
}
```

---

## 🔒 Security Features

✅ **6-digit OTP** - Sufficient entropy for reasonable security  
✅ **10-minute expiration** - Time-limited validity  
✅ **3 attempt limit** - Prevents brute force attacks  
✅ **Attempt tracking** - Per OTP/phone number  
✅ **WorkHub24 SMS** - Official SMS delivery (if configured)  
✅ **Graceful fallback** - Works even if SMS fails  

---

## 📊 OTP Flow Diagram

```
┌─────────────────────┐
│  Customer Portal    │
└──────────┬──────────┘
           │
           ├─ Enter: Name, NIC, Phone
           │
           ▼
    ┌─────────────────────────────┐
    │  POST /api/generate-otp     │
    │  - Normalize phone          │
    │  - Generate 6-digit OTP     │
    │  - Store in memory (10min)  │
    │  - Send to WorkHub24        │
    └──────────┬──────────────────┘
               │
               ├─ WorkHub24 SMS Service
               │  (if configured)
               │
               ▼
        ┌────────────────────────┐
        │ SMS Sent to 94XXXXXXX  │
        └────────────────────────┘
               │
               ├─ Customer receives OTP
               │
               ▼
        ┌────────────────────────┐
        │ Enter OTP in Portal    │
        └────────┬───────────────┘
                 │
                 ▼
       ┌─────────────────────────┐
       │ POST /api/verify-otp    │
       │ - Check OTP in storage  │
       │ - Validate expiry       │
       │ - Check attempts        │
       │ - Return customer data  │
       └──────────┬──────────────┘
                  │
          ┌───────┴────────┐
          │                │
       Success         Failure
          │                │
          ▼                ▼
      Continue        Retry OTP
      Form Fill         (Max 3)
          │
          ▼
    ┌─────────────────────┐
    │ Fill Application    │
    │ Form & Submit       │
    └────────┬────────────┘
             │
             ▼
  ┌──────────────────────────────┐
  │ POST /api/submit-application │
  │ - Include OTP in card        │
  │ - Save to all datastores     │
  │ - Create workflow card       │
  └──────────────────────────────┘
```

---

## 🚀 Next Steps for React Integration

1. **Create OTP Input Component**
   - Phone input field
   - OTP generation button
   - OTP input field (after generation)
   - Verify button

2. **Update Application Form**
   - Add OTP field to formData
   - Add `otp` state in useState
   - Call `/api/generate-otp` on button click
   - Call `/api/verify-otp` on verify button click
   - Store verified OTP in formData

3. **Update Submission**
   - Include `otp` in submit payload
   - OTP will be sent to WorkHub24 workflow card

---

## ⚠️ Important Notes

- **In-Memory Storage**: OTP stored in memory, resets on server restart
- **For Production**: Use Redis or database for persistent OTP storage
- **WorkHub24 SMS**: Must be configured in WorkHub24 dashboard
- **Auth Token**: Check expiry date - token in server.js expires on 2025-12-27
- **Phone Normalization**: All phones converted to 94 prefix before WorkHub24 send
- **No Changes to Existing**: All current functionality preserved!

---

## 📋 Checklist for React Frontend

- [ ] Create OTP generation button
- [ ] Create OTP input field (shown after generation)
- [ ] Create OTP verification button
- [ ] Store OTP in formData state
- [ ] Add error messages for OTP failures
- [ ] Show OTP expiry time (600 seconds)
- [ ] Show remaining attempts (3 max)
- [ ] Disable submit until OTP verified (optional)
- [ ] Test with various phone formats
- [ ] Test OTP expiry (wait 10 minutes)

---

**File Location**: `/backend/server.js` - All changes implemented ✅
**Documentation**: `/OTP_IMPLEMENTATION.md` - Full details
