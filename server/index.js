require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// In-memory OTP store: { email: { otp, expiresAt, attempts } }
const otpStore = new Map();

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not account password)
  },
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /send-otp
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email address." });
  }

  // Rate limiting: block if OTP was sent in last 60 seconds
  const existing = otpStore.get(email);
  if (existing && Date.now() < existing.expiresAt - 4 * 60 * 1000) {
    return res.status(429).json({ success: false, message: "Please wait 60 seconds before requesting a new OTP." });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(email, { otp, expiresAt, attempts: 0 });

  try {
    await transporter.sendMail({
      from: `"OTP Service" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Verification Code</h2>
          <p style="color: #555; margin-bottom: 24px;">Use the code below to verify your email. It expires in <strong>5 minutes</strong>.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1a1a1a; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 6px; margin-bottom: 24px;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 13px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("Mail error:", err.message);
    otpStore.delete(email);
    res.status(500).json({ success: false, message: "Failed to send email. Check SMTP config." });
  }
});

// POST /verify-otp
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ success: false, message: "No OTP found for this email. Request a new one." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
  }

  // Max 5 attempts
  if (record.attempts >= 5) {
    otpStore.delete(email);
    return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
  }

  record.attempts++;

  if (record.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: `Invalid OTP. ${5 - record.attempts} attempts remaining.`,
    });
  }

  otpStore.delete(email);
  res.json({ success: true, message: "Email verified successfully!" });
});

// Health check
app.get("/", (req, res) => res.json({ status: "OTP server running" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
