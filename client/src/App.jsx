import { useState, useRef, useEffect } from "react";

const API = "";

const styles = {
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    fontSize: 22,
  },
  title: { fontSize: 22, fontWeight: 600, marginBottom: 6, color: "#1a1a1a" },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 28, lineHeight: 1.5 },
  label: { fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 6, display: "block" },
  input: {
    width: "100%",
    padding: "10px 14px",
    fontSize: 15,
    border: "1.5px solid #e0e0e0",
    borderRadius: 8,
    outline: "none",
    transition: "border 0.2s",
    background: "#fafafa",
  },
  btn: {
    width: "100%",
    padding: "11px",
    fontSize: 15,
    fontWeight: 600,
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 16,
    transition: "background 0.2s, opacity 0.2s",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  error: {
    marginTop: 12,
    padding: "10px 14px",
    background: "#fff0f0",
    border: "1px solid #ffd0d0",
    borderRadius: 8,
    fontSize: 13,
    color: "#c0392b",
  },
  success: {
    marginTop: 12,
    padding: "10px 14px",
    background: "#f0fff5",
    border: "1px solid #c3f0d0",
    borderRadius: 8,
    fontSize: 13,
    color: "#1e7e4a",
  },
  otpRow: { display: "flex", gap: 10, marginBottom: 4 },
  otpInput: {
    flex: 1,
    padding: "14px 0",
    fontSize: 22,
    fontWeight: 600,
    textAlign: "center",
    border: "1.5px solid #e0e0e0",
    borderRadius: 8,
    background: "#fafafa",
    outline: "none",
    transition: "border 0.2s",
  },
  resendRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  resendBtn: {
    background: "none",
    border: "none",
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
  },
  timer: { fontSize: 13, color: "#888" },
  successScreen: { textAlign: "center", padding: "12px 0" },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#f0fff5",
    border: "2px solid #c3f0d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: 28,
  },
};

function EmailStep({ onSent }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) onSent(email);
      else setError(data.message);
    } catch {
      setError("Server unreachable. Make sure the backend is running.");
    }
    setLoading(false);
  }

  return (
    <>
      <div style={styles.logo}>✉️</div>
      <p style={styles.title}>Verify your email</p>
      <p style={styles.subtitle}>Enter your email address and we'll send a 6-digit code.</p>
      <label style={styles.label}>Email address</label>
      <input
        style={styles.input}
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !loading && email && handleSend()}
        onFocus={(e) => (e.target.style.border = "1.5px solid #1a1a1a")}
        onBlur={(e) => (e.target.style.border = "1.5px solid #e0e0e0")}
      />
      <button
        style={{ ...styles.btn, ...(loading || !email ? styles.btnDisabled : {}) }}
        onClick={handleSend}
        disabled={loading || !email}
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>
      {error && <div style={styles.error}>{error}</div>}
    </>
  );
}

function OTPStep({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    refs[0].current?.focus();
    const interval = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  function handleDigit(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs[i + 1].current?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
    if (e.key === "Enter") handleVerify();
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      refs[5].current?.focus();
    }
  }

  async function handleVerify() {
    const otp = digits.join("");
    if (otp.length < 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) onVerified();
      else setError(data.message);
    } catch {
      setError("Server unreachable.");
    }
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      const res = await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setDigits(["", "", "", "", "", ""]);
        setTimer(60);
        refs[0].current?.focus();
      } else setError(data.message);
    } catch {
      setError("Server unreachable.");
    }
    setResending(false);
  }

  const otp = digits.join("");

  return (
    <>
      <div style={styles.logo}>🔐</div>
      <p style={styles.title}>Enter the code</p>
      <p style={styles.subtitle}>
        We sent a 6-digit code to <strong>{email}</strong>.{" "}
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0 }}
        >
          Change
        </button>
      </p>
      <label style={styles.label}>Verification code</label>
      <div style={styles.otpRow} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            style={{
              ...styles.otpInput,
              border: d ? "1.5px solid #1a1a1a" : "1.5px solid #e0e0e0",
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
          />
        ))}
      </div>
      <div style={styles.resendRow}>
        <span style={styles.timer}>
          {timer > 0 ? `Resend in ${timer}s` : ""}
        </span>
        {timer === 0 && (
          <button
            style={styles.resendBtn}
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        )}
      </div>
      <button
        style={{ ...styles.btn, ...(loading || otp.length < 6 ? styles.btnDisabled : {}) }}
        onClick={handleVerify}
        disabled={loading || otp.length < 6}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
      {error && <div style={styles.error}>{error}</div>}
    </>
  );
}

function SuccessScreen({ email }) {
  return (
    <div style={styles.successScreen}>
      <div style={styles.checkCircle}>✅</div>
      <p style={{ ...styles.title, textAlign: "center" }}>Verified!</p>
      <p style={{ ...styles.subtitle, textAlign: "center", marginBottom: 0 }}>
        <strong>{email}</strong> has been successfully verified.
      </p>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("email"); // email | otp | success
  const [email, setEmail] = useState("");

  return (
    <div style={styles.card}>
      {step === "email" && (
        <EmailStep onSent={(e) => { setEmail(e); setStep("otp"); }} />
      )}
      {step === "otp" && (
        <OTPStep
          email={email}
          onVerified={() => setStep("success")}
          onBack={() => setStep("email")}
        />
      )}
      {step === "success" && <SuccessScreen email={email} />}
    </div>
  );
}
