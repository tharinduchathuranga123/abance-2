const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

// ── WorkHub24 Configuration ───────────────────────────────────────────────────
const TENANT_ID   = "IJ7J6CWM2XUJKVLKL7HHOOCLPFMOWFWW";
const WORKFLOW_ID = "wb4c791a6a7";   // Application workflow card
const WH_BASE     = "https://app.workhub24.com";

const DATASTORES = {
  main:      { host: "https://app.workhub24.com",  id: "JUEOEKINULT7Y4W2UAY63RPRQNLFYVZ7AREKVQUD" }, // 1. Main application form
  bank:      { host: "https://app.workhub24.com",  id: "ONXWFXRLEFOMTFY3I2F4GRKO7L5UNWAHJ252ZGNC" }, // 2. Bank details
  credit:    { host: "https://beta.workhub24.com", id: "R7PKAQLBWVRWYOWMZ2AKKMYKKU62N4UDFL42DWWA"  }, // 3. Credit facilities
  vehicle:   { host: "https://beta.workhub24.com", id: "TZ4XQ44NNFFKH4B6L3GUXTIYCT4CQIXHCWP4ZNRU"  }, // 4. Vehicles
  shares:    { host: "https://app.workhub24.com",  id: "PGJBN5CZ2VC6D7XJEQYH4AL5ORXRPYOUE6IQJYFO"  }, // 5. Shares
  facility:  { host: "https://app.workhub24.com",  id: "GLZTLAMP263HYQ4GRXG5B2UYLVWYHZD7I35HEERJ"  }, // 6. Facility requirements
  land:      { host: "https://app.workhub24.com",  id: "ROPDY6LMJFSGEIUUHQOMEHKJ5OSSJQTZGYR32QC4"  }, // 7. Land & Buildings
  guarantor: { host: "https://app.workhub24.com",  id: "Y3W5Y54PPEN2G65UVTACXL5OARX37KHDHYU2KMPP"  }, // 8. Guarantors
  prereg:    { host: "https://app.workhub24.com",  id: "SYP7VJRRB5WUIHDVTN3UQZCKQMDINHWDRHBZGFD4"  }, // 9. Pre-registration
};

// ── Token — update this whenever it expires ───────────────────────────────────
const AUTH_TOKEN = process.env.AUTH_TOKEN  || "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ3b3JraHViLmNvbSIsImVudiI6InByb2QiLCJleHAiOjE3NzYzNDc3MTQsImlhdCI6MTc3NjMxMTcxNCwiaXNzIjoid29ya2h1Yi5jb20iLCJqdGkiOiJjNjhjMjAxYS1mZDI2LTQyMzgtYjk3Mi01MDViMDE4ZTk2MGYiLCJsbSI6IlBBU1NXT1JEIiwibG9naW5fdXNlcl9pZCI6IjdIVjRESU9SNEpSUFY0QVlFQ1VVTlNSNlI0MzdaSlhNIiwibmJmIjoxNzc2MzExNzEzLCJzY29wZSI6WyJ1OnYiLCJ3OnYiXSwic2lkIjoiSU1RVk1TS1ZCVkk2Q1dSSjNPT083VUZFUERYT1pHNVBBNFgyVElWNyIsInN1YiI6IjdIVjRESU9SNEpSUFY0QVlFQ1VVTlNSNlI0MzdaSlhNIiwidG50IjoiSUo3SjZDV00yWFVKS1ZMS0w3SEhPT0NMUEZNT1dGV1ciLCJ0eXAiOiJyZWZyZXNoIiwidW5hbWUiOiJ0aCB0c3QifQ.6Kybe1npl919fCRC7T7ffOdVoRzii7UYd2N9cP_FKxWvLQzdys3XjZnaVkcjmnbTPHqq90j8CHFOJIOOpSANoA";

// ── CORS Configuration for Vercel hosting ────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",              // Local development (Vite)
  "http://localhost:3000",              // Local alternative
  "https://abance-2-igez.vercel.app",  // Old production frontend
  "https://abance-testing.vercel.app", // New production frontend ← ADDED
];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    datastores: {
      main:     DATASTORES.main.id,
      bank:     DATASTORES.bank.id,
      credit:   DATASTORES.credit.id,
      vehicle:  DATASTORES.vehicle.id,
      shares:   DATASTORES.shares.id,
      facility: DATASTORES.facility.id,
      land:      DATASTORES.land.id,
      guarantor: DATASTORES.guarantor.id,
    },
  });
});

// ── Helper: POST one record to a WorkHub24 datastore ─────────────────────────
async function postRecord(store, record) {
  const url = `${store.host}/api/datatables/${TENANT_ID}/${store.id}/records`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "accept":         "application/json",
      "authorization": `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(record),
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* non-JSON */ }
  return { ok: res.ok, status: res.status, data, text };
}

// ── Helper: POST a workflow card (fullName, nicNo, passportNo only) ───────────
async function postWorkflowCard(fullName, nicNo, passportNo) {
  const url = `${WH_BASE}/api/workflows/${TENANT_ID}/${WORKFLOW_ID}/cards`;
  const card = {
    title:      fullName,   // title is required by the workflow API
    fullName:   fullName,
    nicNo:      nicNo,
    passportNo: passportNo,
  };
  console.log(`\n━━ [W] Workflow card → ${url}`);
  console.log(`   Payload: ${JSON.stringify(card)}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "accept":         "application/json",
      "authorization": `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(card),
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* non-JSON */ }
  console.log(`← Workflow HTTP ${res.status}  body: ${text}`);
  return { ok: res.ok, status: res.status, data, text };
}

// ── Helper: save an array of rows, skip empty ones ───────────────────────────
async function saveRows(store, rows, isEmpty, mapRow, label) {
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isEmpty(row)) {
      console.log(`   ${label} row ${i + 1}: skipped (empty)`);
      continue;
    }
    const record = mapRow(row);
    console.log(`   ${label} row ${i + 1}:`, JSON.stringify(record));
    const result = await postRecord(store, record);
    console.log(`   ${label} row ${i + 1}: HTTP ${result.status}`);
    results.push({
      rowIndex: i + 1,
      status:   result.status,
      ok:       result.ok,
      savedId:  result.ok ? (result.data.id || null) : null,
      error:    result.ok ? null : result.data,
      ...record,
    });
  }
  return results;
}

// ── Map React formData → Main Application record ──────────────────────────────
function mapMainRecord(f) {
  const s = (v) => (Array.isArray(v) ? v.join(", ") : (v ?? "").toString());
  const n = (v) => (v === "" || v == null ? 0 : Number(v) || 0);
  const d = (v) => v || null;
  const c = (v) => n(v);
  return {
    fullName:                       s(f.fullName),
    nicNo:                          s(f.nicNo),
    passportNo:                     s(f.passportNo),
    dateOfBirth:                    d(f.dateOfBirth),
    gender:                         s(f.gender),
    maritalStatus:                  s(f.maritalStatus),
    nationality:                    s(f.nationality),
    residentialStatus:              s(f.residentialStatus),
    permanentAddress:               s(f.permanentAddress),
    mailingAddress:                 s(f.mailingAddress),
    monthsAtAbove:                  n(f.monthsAtAbove),
    homeContact:                    s(f.homeContact),
    officeContact:                  s(f.officeContact),
    fax:                            s(f.fax),
    mobile1:                        n(f.mobile1),
    mobile2:                        n(f.mobile2),
    email:                          s(f.email),
    noOfChildren:                   n(f.noOfChildren),
    childAge1:                      n(f.childAge1),
    childAge2:                      n(f.childAge2),
    childAge3:                      n(f.childAge3),
    totalDependants:                n(f.totalDependants),
    qualifications:                 s(f.qualifications),
    employerBusinessName:           s(f.employerBusinessName),
    employerBusinessAddress:        s(f.employerBusinessAddress),
    natureOfBusiness:               s(f.natureOfBusiness),
    designationProfession:          s(f.designationProfession),
    telephone:                      s(f.telephone),
    designation:                    s(f.designation),
    employmentProfessionalBusiness: s(f.employmentProfessionalBusiness),
    specificIncomeSource:           s(f.specificIncomeSource),
    additionalIncomeSources:        s(f.additionalIncomeSources),
    liableForTax:                   s(f.liableForTax),
    taxFileNo:                      s(f.taxFileNo),
    incomeMainSalary:               c(f.incomeMainSalary),
    incomeOtherAllowances:          c(f.incomeOtherAllowances),
    incomeAdditional:               c(f.incomeAdditional),
    incomeOther:                    c(f.incomeOther),
    expenseHousehold:               c(f.expenseHousehold),
    expensePersonal:                c(f.expensePersonal),
    expenseLoanLease:               c(f.expenseLoanLease),
    expenseCreditCard:              c(f.expenseCreditCard),
    expenseFuel:                    c(f.expenseFuel),
    expenseOther:                   c(f.expenseOther),
    reference1Name:                 s(f.reference1Name),
    reference1Profession:           s(f.reference1Profession),
    reference1Contact:              s(f.reference1Contact),
    reference2Name:                 s(f.reference2Name),
    reference2Profession:           s(f.reference2Profession),
    reference2Contact:              s(f.reference2Contact),
    lifeInsurance:                  s(f.lifeInsurance),
    lifeInsuranceSpecify:           s(f.lifeInsuranceSpecify),
    deposits:                       s(f.deposits),
    depositsSpecify:                s(f.depositsSpecify),
    preferredLanguage:              s(f.preferredLanguage),
    locationOfLeasedAsset:          s(f.locationOfLeasedAsset),
    fundSources:                    s(f.fundSources),
    annualTurnoverIndividual:       s(f.annualTurnoverIndividual),
    annualTurnoverBusiness:         s(f.annualTurnoverBusiness),
    otherConnectedBusiness:         s(f.otherConnectedBusiness),
    reasonForLoan:                  s(f.reasonForLoan),
    withinBranchServiceArea:        s(f.withinBranchServiceArea),
    ifNoReason:                     s(f.ifNoReason),
    isPep:                          s(f.isPEP),
    pepRelationship:                s(f.pepRelationship),
    signatureName:                  s(f.signatureName),
    signatureDate:                  d(f.signatureDate),
  };
}

// ── POST /api/submit-application ─────────────────────────────────────────────
app.post("/api/submit-application", async (req, res) => {
  try {
    const { formData } = req.body;
    if (!formData) {
      return res.status(400).json({ success: false, message: "Missing formData" });
    }

    const applicantName = (formData.fullName || "").toString().trim();
    const applicantNic  = (formData.nicNo    || "").toString().trim();

    // ── STEP 1: Main application record ──────────────────────────────────────
    console.log(`\n━━ [1/8] Main application — "${applicantName}" (NIC: ${applicantNic}) ━━`);
    const mainResult = await postRecord(DATASTORES.main, mapMainRecord(formData));
    console.log(`← HTTP ${mainResult.status}  body: ${mainResult.text}`);
    if (!mainResult.ok) {
      return res.status(mainResult.status).json({
        success: false,
        message: `Main application rejected (HTTP ${mainResult.status})`,
        error:   mainResult.data,
      });
    }

    // ── STEP 2: Bank detail rows ──────────────────────────────────────────────
    console.log(`\n━━ [2/8] Bank details ━━`);
    const bankResults = await saveRows(
      DATASTORES.bank,
      Array.isArray(formData.bankDetails) ? formData.bankDetails : [],
      (r) => !r.bank && !r.branch && !r.accountNo && !r.officer && !r.telephone,
      (r) => ({
        fullName:  applicantName,
        bank:      (r.bank      || "").toString().trim(),
        branch:    (r.branch    || "").toString().trim(),
        accountNo: (r.accountNo || "").toString().trim(),
        officer:   (r.officer   || "").toString().trim(),
        telephone: (r.telephone || "").toString().trim(),
      }),
      "Bank"
    );

    // ── STEP 3: Credit facility rows ──────────────────────────────────────────
    console.log(`\n━━ [3/8] Credit facilities ━━`);
    const creditResults = await saveRows(
      DATASTORES.credit,
      Array.isArray(formData.creditFacilities) ? formData.creditFacilities : [],
      (r) => !r.institution && !r.type && !r.approvedAmount && !r.term && !r.monthlyRepayment,
      (r) => ({
        fullName:         applicantName,
        untitled:         applicantNic,
        institution:      (r.institution      || "").toString().trim(),
        type:             (r.type             || "").toString().trim(),
        approvedAmount:   (r.approvedAmount   || "").toString().trim(),
        term:             (r.term             || "").toString().trim(),
        monthlyRepayment: parseFloat(r.monthlyRepayment) || 0,
        security:         (r.security         || "").toString().trim(),
      }),
      "Credit"
    );

    // ── STEP 4: Vehicle rows ──────────────────────────────────────────────────
    console.log(`\n━━ [4/8] Vehicles ━━`);
    const vehicleResults = await saveRows(
      DATASTORES.vehicle,
      Array.isArray(formData.vehicles) ? formData.vehicles : [],
      (r) => !r.makeModel && !r.regNo && !r.value && !r.ownership,
      (r) => ({
        fullName:  applicantName,
        makeModel: (r.makeModel  || "").toString().trim(),
        regNo:     (r.regNo     || "").toString().trim(),
        value:     parseFloat(r.value) || 0,
        ownership: (r.ownership || "").toString().trim(),
      }),
      "Vehicle"
    );

    // ── STEP 5: Shares rows ───────────────────────────────────────────────────
    console.log(`\n━━ [5/8] Shares ━━`);
    const shareResults = await saveRows(
      DATASTORES.shares,
      Array.isArray(formData.shares) ? formData.shares : [],
      (r) => !r.institution && !r.currentValue && !r.noOfShares,
      (r) => ({
        fullName:      applicantName,
        applicationId: applicantNic,
        institution:   (r.institution  || "").toString().trim(),
        currentValue:  (r.currentValue || "").toString().trim(),
        noOfShares:    parseInt(r.noOfShares) || 0,
      }),
      "Share"
    );

    // ── STEP 6: Facility requirement rows ─────────────────────────────────────
    console.log(`\n━━ [6/8] Facility Requirements ━━`);
    const facilityResults = await saveRows(
      DATASTORES.facility,
      Array.isArray(formData.facilityRequirements) ? formData.facilityRequirements : [],
      (r) => !r.makeModel && !r.purpose && !r.supplier && !r.cost,
      (r) => ({
        fullName:  applicantName,
        makeModel: (r.makeModel || "").toString().trim(),
        status:    (r.status    || "").toString().trim(),
        purpose:   (r.purpose   || "").toString().trim(),
        supplier:  (r.supplier  || "").toString().trim(),
        period:    (r.period    || "").toString().trim(),
        cost:      parseFloat(r.cost) || 0,
      }),
      "Facility"
    );


    // ── STEP 7: Land & Building rows ─────────────────────────────────────────
    console.log(`\n━━ [7/8] Land & Buildings ━━`);
    const landResults = await saveRows(
      DATASTORES.land,
      Array.isArray(formData.landBuildings) ? formData.landBuildings : [],
      (r) => !r.location && !r.extent && !r.value && !r.deedNo,
      (r) => ({
        fullName: applicantName,                           // primary key (PI)
        location: (r.location || "").toString().trim(),
        extent:   (r.extent   || "").toString().trim(),
        value:    parseFloat(r.value) || 0,
        deedNo:   (r.deedNo   || "").toString().trim(),
        untitled: r.mortgaged === "Yes",                  // yesno field = mortgaged
      }),
      "Land"
    );


    // ── STEP 8: Guarantor rows ────────────────────────────────────────────────
    console.log(`\n━━ [8/8] Guarantors ━━`);
    const guarantorResults = await saveRows(
      DATASTORES.guarantor,
      Array.isArray(formData.guarantors) ? formData.guarantors : [],
      (r) => !r.fullName && !r.relationship && !r.nicBusinessRegNo,
      (r) => ({
        fullName:         (r.fullName         || "").toString().trim(), // guarantor name
        untitled:         applicantName,                                // applicant name (PI link)
        relationship:     (r.relationship     || "").toString().trim(),
        nicBusinessRegNo: (r.nicBusinessRegNo || "").toString().trim(),
        age:              parseInt(r.age)    || 0,
        months:           parseInt(r.months) || 0,
      }),
      "Guarantor"
    );

    // ── STEP W: Post workflow card (fullName, nicNo, passportNo) ─────────────
    console.log(`\n━━ [W] Workflow card ━━`);
    const workflowResult = await postWorkflowCard(
      applicantName,
      applicantNic,
      (formData.passportNo || "").toString().trim()
    );
    if (!workflowResult.ok) {
      console.warn(`⚠️  Workflow card failed (HTTP ${workflowResult.status}) — datastores already saved`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const count = (arr) => ({ saved: arr.filter(r=>r.ok).length, failed: arr.filter(r=>!r.ok).length });
    const bk = count(bankResults);
    const cr = count(creditResults);
    const vh = count(vehicleResults);
    const sh = count(shareResults);
    const fc = count(facilityResults);
    const ld = count(landResults);
    const gu = count(guarantorResults);

    const fmt = (label, c) => `${label}: ${c.saved} saved${c.failed > 0 ? `, ${c.failed} failed` : ""}`;

    const message = [
      "Main application saved.",
      fmt("Bank", bk),
      fmt("Credit", cr),
      fmt("Vehicles", vh),
      fmt("Shares", sh),
      fmt("Facility", fc),
      fmt("Land", ld),
      fmt("Guarantors", gu),
    ].join(" | ");

    console.log(`\n✅  ${message}\n`);

    return res.json({
      success:      true,
      message,
      mainRecordId: mainResult.data.id || mainResult.data.recordId || null,
      workflowCard: { ok: workflowResult.ok, status: workflowResult.status, cardId: workflowResult.data?.id || null },
      bank:     { saved: bk.saved, failed: bk.failed, results: bankResults,     errors: bankResults.filter(r=>!r.ok) },
      credit:   { saved: cr.saved, failed: cr.failed, results: creditResults,   errors: creditResults.filter(r=>!r.ok) },
      vehicle:  { saved: vh.saved, failed: vh.failed, results: vehicleResults,  errors: vehicleResults.filter(r=>!r.ok) },
      shares:   { saved: sh.saved, failed: sh.failed, results: shareResults,    errors: shareResults.filter(r=>!r.ok) },
      facility: { saved: fc.saved, failed: fc.failed, results: facilityResults, errors: facilityResults.filter(r=>!r.ok) },
      land:      { saved: ld.saved, failed: ld.failed, results: landResults,      errors: landResults.filter(r=>!r.ok) },
      guarantor: { saved: gu.saved, failed: gu.failed, results: guarantorResults, errors: guarantorResults.filter(r=>!r.ok) },
    });

  } catch (err) {
    console.error("Unhandled error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: { message: err.message } });
  }
});

// ── OTP Configuration ─────────────────────────────────────────────────────────
const OTP_EXPIRY_SECONDS = 3 * 60; // 3 minutes  
const otpStore = new Map(); // { phone -> { otp, name, nicNo, mobileNumber, expiresAt } }

// ── Helper: normalize mobile number to 94-format ──────────────────────────────
//    0771234567  → 94771234567
//    94771234567 → 94771234567
function normalizeMobileNumber(rawPhone) {
  const digits = rawPhone.toString().trim().replace(/\D/g, ""); // Remove all non-digits
  if (!digits) return "";
  if (digits.startsWith("94")) return digits; // Already in 94 format
  if (digits.startsWith("0")) return "94" + digits.slice(1); // Remove leading 0 and add 94
  return "94" + digits; // Add 94 if no leading 0 or 94
}

// ── Helper: secure 6-digit OTP generation ───────────────────────────────────
function generateOtp() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

// ── Helper: remove expired OTPs automatically ───────────────────────────────
function cleanupExpiredOtps() {
  const now = Math.floor(Date.now() / 1000);
  for (const [phone, entry] of otpStore.entries()) {
    if (entry.expiresAt <= now) {
      otpStore.delete(phone);
      console.log(`🧹 Expired OTP removed for ${phone}`);
    }
  }
}
setInterval(cleanupExpiredOtps, 60 * 1000);

// ── Helper: POST OTP card to WorkHub24 workflow ──────────────────────────────
async function postOtpWorkflowCard(fullName, mobileNumber, nICNumber, otp) {
  const url = `https://app.workhub24.com/api/workflows/${TENANT_ID}/w29f7c492bb/cards`;
  const payload = {
    title:        fullName,
    fullName:     fullName,
    mobileNumber: mobileNumber,
    nICNumber:    nICNumber,
    otp:          otp,
  };
  console.log(`\n━━ [OTP WORKFLOW] POST ${url}`);
  console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "accept":         "application/json",
      "authorization": `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* non-JSON */ }
  console.log(`← WorkHub24 OTP Workflow HTTP ${res.status}`);
  if (!res.ok) console.log(`   Error body: ${text}`);
  return { ok: res.ok, status: res.status, data, text };
}

// ── POST /api/pre-register  ───────────────────────────────────────────────────
app.post("/api/pre-register", async (req, res) => {
  try {
    const { name, nicNo, phone } = req.body;
    if (!name || !nicNo || !phone) {
      return res.status(400).json({ success: false, message: "Name, NIC, and phone are required" });
    }

    const fullName = name.toString().trim();
    const nICNumber = nicNo.toString().trim();
    const mobileNumber = normalizeMobileNumber(phone);

    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: "Invalid phone number format" });
    }

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_SECONDS;

    // Store OTP in memory using normalized mobile number as key
    otpStore.set(mobileNumber, {
      otp,
      name: fullName,
      nicNo: nICNumber,
      mobileNumber,
      expiresAt,
    });

    console.log(`\n📱 Pre-registration:`);
    console.log(`   Name           : ${fullName}`);
    console.log(`   NIC            : ${nICNumber}`);
    console.log(`   Mobile Number  : ${mobileNumber}`);
    console.log(`   OTP (terminal) : ${otp}  (3-min expiry)`);

    // POST to WorkHub24 OTP workflow card
    const workflowResult = await postOtpWorkflowCard(fullName, mobileNumber, nICNumber, otp);
    if (!workflowResult.ok) {
      console.warn(`⚠️  WorkHub24 workflow card failed, but OTP stored locally`);
    }

    // Return success WITHOUT OTP to frontend
    return res.json({
      success: true,
      message: "OTP sent successfully. Please enter the code to verify.",
    });

  } catch (err) {
    console.error("Pre-register error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// ── POST /api/verify-otp ──────────────────────────────────────────────────────
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone and OTP are required" });
    }

    const mobileNumber = normalizeMobileNumber(phone);
    const enteredOtp = otp.toString().trim();

    const entry = otpStore.get(mobileNumber);
    if (!entry) {
      return res.status(400).json({
        success: false,
        message: "Phone not registered. Please go back and submit your details first.",
      });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > entry.expiresAt) {
      otpStore.delete(mobileNumber);
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    if (enteredOtp !== entry.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // OTP verified: delete from store and return user data WITHOUT OTP
    otpStore.delete(mobileNumber);
    console.log(`\n✅ OTP verified for ${mobileNumber}`);

    return res.json({
      success: true,
      message: "OTP verified successfully",
      name:  entry.name,
      nicNo: entry.nicNo,
      phone: entry.mobileNumber, // Return normalized phone
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
// For Vercel: export as serverless function
module.exports = app;

// For local development: listen on PORT
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`\n✅  Abans Finance backend  →  http://localhost:${PORT}`);
    console.log(`\n    Datastores:`);
    console.log(`      [1] Main      app.workhub24.com   ${DATASTORES.main.id}`);
    console.log(`      [2] Bank      app.workhub24.com   ${DATASTORES.bank.id}`);
    console.log(`      [3] Credit    beta.workhub24.com  ${DATASTORES.credit.id}`);
    console.log(`      [4] Vehicle   beta.workhub24.com  ${DATASTORES.vehicle.id}`);
    console.log(`      [5] Shares    app.workhub24.com   ${DATASTORES.shares.id}`);
    console.log(`      [6] Facility  app.workhub24.com   ${DATASTORES.facility.id}`);
    console.log(`      [7] Land      app.workhub24.com   ${DATASTORES.land.id}`);
    console.log(`      [8] Guarantor app.workhub24.com   ${DATASTORES.guarantor.id}\n`);
  });
}