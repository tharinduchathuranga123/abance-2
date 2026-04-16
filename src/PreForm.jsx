import React, { useState } from "react";
import "./PreForm.css";

function PreForm({ onVerified }) {
  const [step, setStep]       = useState("form"); // "form" | "otp"
  const [name, setName]       = useState("");
  const [nic, setNic]         = useState("");
  const [phone, setPhone]     = useState("");
  const [otp, setOtp]         = useState("");
  const [status, setStatus]   = useState("idle");
  const [message, setMessage] = useState("");

  // ── Step 1: Submit pre-registration → server generates OTP ─────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim() || !nic.trim() || !phone.trim()) {
      setStatus("error");
      setMessage("Please fill in all fields.");
      return;
    }

    setStatus("loading");
    setMessage("Saving your details...");

    try {
      const res = await fetch("http://localhost:3001/api/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nicNo: nic.trim(), phone: phone.trim() }),
      });

      // Check if response is JSON first
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Server error — please check your backend is running and token is valid.");
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data?.message || "Registration failed");
      }

      setStatus("success");
      setMessage("OTP generated! Check your phone for the code.");
      setStep("otp");

    } catch (err) {
      setStatus("error");
      setMessage("Error: " + err.message);
    }
  };

  // ── Step 2: Verify OTP against server ─────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setStatus("error");
      setMessage("Please enter the OTP.");
      return;
    }

    setStatus("loading");
    setMessage("Verifying...");

    try {
      const res = await fetch("http://localhost:3001/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Server error — please check your backend.");
      }

      const data = await res.json();

      if (!data.success) {
        setStatus("error");
        setMessage(data.message || "OTP verification failed.");
        return;
      }

      // Verified — pass data up to App.jsx → show ApplicationForm
      onVerified({ name, nicNo: nic, phone });

    } catch (err) {
      setStatus("error");
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div className="preform-bg">
      <div className="preform-card">

        {/* Header */}
        <div className="preform-header">
          <div className="preform-logo-wrap">
            <img
              src="data:image/webp;base64,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"
              alt="Abans Finance"
              className="preform-logo"
            />
          </div>
          <div className="preform-title-block">
            <div className="preform-company">Abans Finance PLC</div>
            <div className="preform-subtitle">Loan / Lease Application</div>
            <div className="preform-subtitle-si">ණය / ලීස් අයදුම්පත</div>
          </div>
        </div>

        {/* ── STEP 1: Pre-registration form ─────────────────────────────── */}
        {step === "form" && (
          <form className="preform-body" onSubmit={handleSendOtp}>
            <div className="preform-step-label">
              <span className="step-dot">1</span>
              <span>Enter your details to begin</span>
            </div>

            <div className="preform-field">
              <label className="pf-label">
                Full Name <span className="pf-label-si">/ සම්පූර්ණ නම</span>
              </label>
              <input
                className="pf-input"
                type="text"
                placeholder="As per NIC..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="preform-field">
              <label className="pf-label">
                NIC Number <span className="pf-label-si">/ ජා.හැ.අ. අංකය</span>
              </label>
              <input
                className="pf-input"
                type="text"
                placeholder="e.g. 199012345678"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
              />
            </div>

            <div className="preform-field">
              <label className="pf-label">
                Mobile Number <span className="pf-label-si">/ ජංගම දුරකථන අංකය</span>
              </label>
              <input
                className="pf-input"
                type="tel"
                placeholder="e.g. 0771234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {status === "error" && (
              <div className="pf-msg pf-msg-error">{message}</div>
            )}

            <button type="submit" className="pf-btn" disabled={status === "loading"}>
              {status === "loading" ? "Saving..." : "Get OTP →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP verification ──────────────────────────────────── */}
        {step === "otp" && (
          <form className="preform-body" onSubmit={handleVerifyOtp}>
            <div className="preform-step-label">
              <span className="step-dot">2</span>
              <span>Enter OTP to verify</span>
            </div>

            <div className="pf-otp-info">
              <div className="pf-otp-phone">📱 {phone}</div>
              <div className="pf-otp-note">
                Enter the OTP to continue.
                <span className="pf-otp-note-si"> / OTP ඇතුළත් කරන්න.</span>
              </div>
            </div>

            <div className="preform-field">
              <label className="pf-label">OTP Code</label>
              <input
                className="pf-input pf-input-otp"
                type="text"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>

            {status === "error" && (
              <div className="pf-msg pf-msg-error">{message}</div>
            )}
            {status === "success" && (
              <div className="pf-msg pf-msg-success">{message}</div>
            )}

            <button type="submit" className="pf-btn" disabled={status === "loading"}>
              {status === "loading" ? "Verifying..." : "Verify & Continue →"}
            </button>

            <button
              type="button"
              className="pf-btn-back"
              onClick={() => {
                setStep("form");
                setStatus("idle");
                setMessage("");
                setOtp("");
              }}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PreForm;