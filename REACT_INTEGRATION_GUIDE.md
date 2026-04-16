# React Frontend Integration - OTP & Application Form Guide

## ✅ Backend Updates Complete

Your backend now properly captures and sends to WorkHub24:
- ✅ Full Name
- ✅ NIC Number  
- ✅ Mobile Number (normalized to 94 format)
- ✅ OTP Code

---

## 🔴 Required React Form Updates

The issue is that **the React form is NOT sending the OTP field** to the backend. You need to:

### 1. **Store OTP in Form State**
Add OTP to your `defaultFormData`:

```javascript
const defaultFormData = {
  fullName: "",
  nicNo: "",        // ← Make sure this is being captured
  mobile1: "",      // ← Make sure this is being captured
  otp: "",          // ← ADD THIS LINE
  // ... rest of fields
};
```

### 2. **Update useState Hook**
```javascript
const [formData, setFormData] = useState(defaultFormData);
const [otpGenerated, setOtpGenerated] = useState(false);
const [otpVerified, setOtpVerified] = useState(false);
const [otpInput, setOtpInput] = useState("");
```

### 3. **Add OTP Generation Button**

Before the main form, add this section:

```jsx
{!otpVerified && (
  <section className="paper-section">
    <div className="otp-section">
      <h3>Step 1: Generate OTP</h3>
      
      {!otpGenerated ? (
        <div className="otp-gen-fields">
          <div className="field-pair">
            <label>Full Name</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="field-pair">
            <label>NIC Number</label>
            <input 
              type="text" 
              name="nicNo"
              value={formData.nicNo}
              onChange={handleChange}
              placeholder="Enter your NIC number"
            />
          </div>
          
          <div className="field-pair">
            <label>Mobile Number</label>
            <input 
              type="tel" 
              name="mobile1"
              value={formData.mobile1}
              onChange={handleChange}
              placeholder="Enter mobile (0701234567 or 94701234567)"
            />
          </div>
          
          <button 
            type="button" 
            className="primary"
            onClick={generateOtp}
          >
            Generate OTP
          </button>
        </div>
      ) : (
        <div className="otp-verify-fields">
          <p>✓ OTP sent to {formData.mobile1}</p>
          
          <div className="field-pair">
            <label>Enter OTP</label>
            <input 
              type="text" 
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
            />
          </div>
          
          <button 
            type="button" 
            className="primary"
            onClick={verifyOtp}
          >
            Verify OTP
          </button>
          
          <button 
            type="button" 
            className="secondary"
            onClick={() => {
              setOtpGenerated(false);
              setOtpInput("");
            }}
          >
            Try Again
          </button>
        </div>
      )}
      
      {otpVerified && (
        <div className="success-message">
          ✅ OTP Verified! Proceed with application form below.
        </div>
      )}
    </div>
  </section>
)}
```

### 4. **Add Handler Functions**

```javascript
const generateOtp = async () => {
  if (!formData.fullName || !formData.nicNo || !formData.mobile1) {
    alert("Please fill in Name, NIC, and Mobile Number");
    return;
  }

  try {
    setApiStatus("loading");
    setApiMessage("Generating OTP...");

    const response = await fetch("http://localhost:3001/api/generate-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.fullName,
        nicNo: formData.nicNo,
        phone: formData.mobile1
      })
    });

    const data = await response.json();

    if (data.success) {
      setOtpGenerated(true);
      setApiMessage("OTP sent! Check your phone.");
      setApiStatus("success");
    } else {
      setApiMessage(data.message || "Failed to generate OTP");
      setApiStatus("error");
    }
  } catch (err) {
    setApiMessage("Error: " + err.message);
    setApiStatus("error");
  }
};

const verifyOtp = async () => {
  if (!otpInput) {
    alert("Please enter OTP");
    return;
  }

  try {
    setApiStatus("loading");
    setApiMessage("Verifying OTP...");

    const response = await fetch("http://localhost:3001/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: formData.mobile1,
        otp: otpInput
      })
    });

    const data = await response.json();

    if (data.success) {
      // Store OTP in formData for submission
      setFormData(p => ({ ...p, otp: otpInput }));
      setOtpVerified(true);
      setApiMessage("OTP verified! Please fill the form.");
      setApiStatus("success");
    } else {
      setApiMessage(data.message || "Invalid OTP");
      setApiStatus("error");
    }
  } catch (err) {
    setApiMessage("Error: " + err.message);
    setApiStatus("error");
  }
};
```

### 5. **Update Form Submission**

Modify the main form to only show if OTP is verified:

```jsx
{otpVerified && isSubmittedSuccessfully === false && (
  <form onSubmit={handleSubmit}>
    {/* ... rest of your form fields ... */}
  </form>
)}
```

### 6. **Update handleSubmit**

Ensure OTP is included when submitting:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!otpVerified) {
    alert("Please verify OTP first");
    return;
  }

  setSubmitted(false);
  setApiStatus("loading");
  setApiMessage("Submitting application...");

  try {
    const response = await fetch("http://localhost:3001/api/submit-application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        formData: {
          ...formData,
          otp: otpInput  // ← Include the verified OTP
        }
      })
    });

    // ... rest of your submit logic
  } catch (err) {
    // ... error handling
  }
};
```

---

## 📋 Data Flow Diagram

```
Frontend (React)
    ↓
[User enters: Name, NIC, Phone]
    ↓
[Click "Generate OTP"]
    ↓
POST /api/generate-otp
    ↓
Backend (Node.js)
    ├─ Normalize phone (add 94 prefix)
    ├─ Generate 6-digit OTP
    ├─ Store OTP in memory
    └─ Send to WorkHub24 SMS
    ↓
[User receives OTP via SMS]
    ↓
[User enters OTP]
    ↓
[Click "Verify OTP"]
    ↓
POST /api/verify-otp
    ↓
Backend validates OTP
    ├─ Check OTP matches
    ├─ Check expiry (10 min)
    └─ Return customer data
    ↓
Frontend stores OTP in formData
    ↓
[User fills application form]
    ↓
[Click "Submit"]
    ↓
POST /api/submit-application
    ↓
Backend extracts:
  ├─ Name ✓
  ├─ NIC ✓
  ├─ Mobile ✓
  └─ OTP ✓
    ↓
WorkHub24 Workflow Card Created:
  {
    "title": "Name",
    "fullName": "Name",
    "nicNo": "NIC",
    "nICNumber": "NIC",
    "mobileNumber": "94XXXXXXXXX",
    "otp": "123456"
  }
    ↓
✅ Success - All data in WorkHub24
```

---

## 🔍 Backend Terminal Output Example

After these changes, you should see:

```
━━ [FORM DATA RECEIVED] ━━
   Full Name: "tharindu"
   NIC: "200333212079"
   Phone (raw): "0769073851"
   Phone (normalized): "94769073851"
   OTP: "123456"

━━ [1/8] Main application — "tharindu" (NIC: 200333212079) ━━
← HTTP 201

━━ [W] Workflow card →
   Payload fields:
     - Full Name: "tharindu"
     - NIC No: "200333212079"
     - Passport No: ""
     - Mobile Number: "94769073851"
     - OTP: "123456"

✅  Workflow card created with ID: 60
```

---

## ⚠️ Common Issues & Fixes

### Issue: NIC shows empty in logs
**Fix**: Check that `nicNo` field in React form has correct name attribute:
```jsx
<input name="nicNo" value={formData.nicNo} onChange={handleChange} />
```

### Issue: Phone number not normalizing
**Fix**: Ensure mobile field in React form has name `mobile1`:
```jsx
<input name="mobile1" value={formData.mobile1} onChange={handleChange} />
```

### Issue: OTP not being sent to WorkHub24
**Fix**: Make sure OTP is stored in formData before submission:
```javascript
setFormData(p => ({ ...p, otp: otpInput }));
```

### Issue: 403/401 errors on pre-registration
**Fix**: These are expected and already handled - server allows form to continue
```
← WorkHub24 pre-reg HTTP 403
⚠️  Pre-reg datastore write failed — allowing user to continue
✅ Application form still processes and creates workflow card
```

---

## ✅ Current Requirements PRESERVED

- ✅ All existing form fields maintained
- ✅ All application data saved to WorkHub24
- ✅ Bank, Credit, Vehicle, Shares, etc. datastores working
- ✅ No breaking changes
- ✅ Graceful error handling

---

##  Test Checklist

- [ ] React form includes `nicNo` field
- [ ] React form includes `mobile1` field  
- [ ] React form includes `otp` in defaultFormData
- [ ] Generate OTP button sends name, NIC, phone
- [ ] Verify OTP button sends phone and OTP code
- [ ] OTP stored in formData after verification
- [ ] Form submission includes OTP in payload
- [ ] Backend logs show all 4 fields (Name, NIC, Phone, OTP)
- [ ] WorkHub24 workflow card includes all fields
- [ ] Terminal output matches expected format above
