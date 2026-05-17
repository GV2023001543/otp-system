# OTP Verification System

Email OTP verification using **Express + Nodemailer (Gmail SMTP)** — no third-party email API.

## Tech Stack
- **Backend**: Node.js, Express, Nodemailer
- **Frontend**: React + Vite
- **Email**: Gmail SMTP (free, no API key needed)

---

## Setup

### 1. Gmail App Password
Gmail requires an App Password (not your account password):
1. Go to your Google Account → Security
2. Enable **2-Step Verification**
3. Search "App passwords" → Create one for "Mail"
4. Copy the 16-character password

### 2. Backend
```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
```
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
CLIENT_URL=http://localhost:5173
PORT=3001
```

Start server:
```bash
npm run dev       # development (nodemon)
npm start         # production
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
```

Visit: `http://localhost:5173`

---

## API Endpoints

### POST `/send-otp`
```json
{ "email": "user@example.com" }
```
Response:
```json
{ "success": true, "message": "OTP sent to your email." }
```

### POST `/verify-otp`
```json
{ "email": "user@example.com", "otp": "483920" }
```
Response:
```json
{ "success": true, "message": "Email verified successfully!" }
```

---

## Features
- 6-digit OTP generation
- 5-minute expiry
- Max 5 wrong attempts before lockout
- 60-second resend cooldown
- Auto-advance OTP input boxes
- Paste support for OTP
- Rate limiting (in-memory)

---

## Production Notes
- Replace in-memory `otpStore` with Redis for multi-instance deployments
- Add HTTPS in production
- Store `.env` securely, never commit it
