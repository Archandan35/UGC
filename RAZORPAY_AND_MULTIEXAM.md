# Razorpay Paywall + Multi-Exam — Setup Guide

## What was added

### Razorpay paywall (Free vs Pro)
- **`server.js`** — three new endpoints:
  - `POST /api/razorpay/order` — server creates the order (amount is decided server-side, never trusted from the client).
  - `POST /api/razorpay/verify` — verifies the checkout signature, then grants Pro via the Firebase **Admin SDK**.
  - `POST /api/razorpay/webhook` — verifies the `x-razorpay-signature` HMAC against the **raw body** and grants Pro idempotently (mounted before `express.json`).
- **`src/services/paymentService.js`** — loads the Razorpay script, creates the order, opens checkout, verifies.
- **`src/hooks/usePro.js`** — live Pro status from `/subscriptions/{uid}` (server-written only).
- **`src/pages/PricingPage.jsx`** — Free / Pro Monthly (₹99) / Pro Yearly (₹799), gradient blue/white theme. Route: `/pricing`.
- **`src/routes/ProRoute.jsx`** — gate Pro-only pages → redirects free users to `/pricing`.

### Free-tier limit
- Free users get **5 mocks / month** (`FREE_MONTHLY_LIMIT` in `examService.js`). Usage is tracked at `/usage/{uid}_{YYYY-MM}`. Pro = unlimited.

### Multi-exam schema
- **`src/data/examCatalog.js`** — catalog with `examId`, `paperId`, `language`, `pyqYear`. Ships UGC NET Odia (free), OPSC OAS, B.Ed CET, OTET (Pro).
- **`src/services/examService.js`** — `fetchQuestions({examId,paperId,language,pyqYear})`, plus `canStartMock` / `recordMockStart` gating.
- **`src/pages/ExamsPage.jsx`** — exam picker; Pro exams show a lock → `/pricing`. Route: `/exams`.
- Questions in Firestore should carry `{ examId, paperId, language, pyqYear }`.

### Security (Firestore rules)
- `/payments` and `/subscriptions` are **server-write only** (Admin SDK) — clients can never self-grant Pro.
- `/usage` is per-user increment only.

## Configure (Railway env vars)
```
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx          # Razorpay Dashboard → Webhooks
VITE_RAZORPAY_KEY_ID=rzp_live_xxx    # public key id (browser)
FIREBASE_SERVICE_ACCOUNT={...}       # full service-account JSON on ONE line
```
1. `npm install` (adds `razorpay`, `firebase-admin`).
2. In Razorpay Dashboard → Webhooks, add `https://<your-app>/api/razorpay/webhook` with events `payment.captured` and `order.paid`; set the secret = `RAZORPAY_WEBHOOK_SECRET`.
3. Deploy `firestore.rules`: `firebase deploy --only firestore:rules`.

## Test
- `/pricing` → "Go Pro" opens checkout (use Razorpay test cards in test mode).
- After success, `usePro()` flips to Pro and Pro exams unlock on `/exams`.
