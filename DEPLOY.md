# 🚀 OdiaExams — Full Setup & Deployment Guide (Firebase + Railway)

This guide takes you from a fresh download to a **live, payment-enabled** app on
Railway, using Firebase for Auth + Firestore and Razorpay for the Pro paywall.

> Everything in this repo is plain **React 18 + Vite + Express**. No Lovable Cloud,
> no vendor lock-in. The Lovable live preview is a *separate* project — this ZIP is
> the one you push to GitHub and deploy on Railway.

---

## 0. What's inside (feature checklist)

| Feature | Status | Where |
|---|---|---|
| Razorpay paywall (Free 5 mocks/mo, Pro unlimited) | ✅ | `server.js`, `services/paymentService.js`, `hooks/usePro.js`, `routes/ProRoute.jsx` |
| Multi-exam schema `examId / paperId / language / pyqYear` | ✅ | `data/examCatalog.js`, `services/examService.js` |
| PYQ (Previous-Year-Question) mode | ✅ | engine query params `?mode=pyq&pyqYear=2023`, `fetchQuestions()` |
| Per-question timing | ✅ | `hooks/useExamEngine.js` → `timePerQuestion`, shown in `ResultPage` |
| Persisted bookmarks (revision mode) | ✅ | `services/bookmarksService.js` → `/users/{uid}/bookmarks` |
| Service-layer extraction | ✅ | `services/{result,exam,payment,gamification,bookmarks}.js` |
| Single responsive exam page | ✅ | `pages/ExamPage.jsx` (one page, CSS responsive — no UA sniffing) |
| Streaks + badges (gamification) | ✅ | `services/gamificationService.js`, `components/StreakBadges.jsx` |
| Hardened Firestore rules (no self-grant of role/Pro) | ✅ | `firestore.rules` |
| SEO (OG tags, JSON-LD, sitemap, robots) | ✅ | `lib/seo.js`, `public/` |
| Code splitting for heavy admin libs | ✅ | `App.jsx` (React.lazy) |

---

## 1. Prerequisites

- **Node.js 20+** and **Git** installed locally
- A **GitHub** account
- A **Firebase** project (free Spark plan is fine)
- A **Railway** account (https://railway.app)
- A **Razorpay** account (test mode is fine to start)

---

## 2. Firebase setup (one time)

1. Go to **https://console.firebase.google.com** → *Add project*.
2. **Authentication** → *Get started* → enable **Email/Password** (and **Google** if you want).
3. **Firestore Database** → *Create database* → Production mode → pick a region.
4. **Project Settings → General → Your apps** → *Web app* (`</>`) → register → copy the
   `firebaseConfig` values. You'll paste them as `VITE_FIREBASE_*` env vars.
5. **Project Settings → Service accounts** → *Generate new private key*. This downloads a
   JSON file — you'll paste its contents into `FIREBASE_SERVICE_ACCOUNT` (one line) so the
   server can grant Pro securely after a verified Razorpay payment.

### Deploy the security rules & indexes
Install the Firebase CLI once: `npm i -g firebase-tools`, then:
```bash
firebase login
firebase use --add        # pick your project
firebase deploy --only firestore:rules,firestore:indexes
```

### Make yourself an admin
After you sign up once in the app, open Firestore → `users/{your-uid}` and set
`role: "admin"`. (Rules forbid changing your own role from the client — this is by design.)

---

## 3. Razorpay setup

1. Razorpay Dashboard → **Settings → API Keys** → *Generate Test Key*.
   Copy **Key ID** and **Key Secret**.
2. **Settings → Webhooks** → *Add webhook*:
   - URL: `https://<your-railway-domain>/api/razorpay/verify` (set this after first deploy, step 6)
   - Secret: any strong string → this becomes `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`

---

## 4. Run locally (optional but recommended)

```bash
cp .env.example .env          # fill in all the values
npm install
npm run build                 # build the SPA into dist/
npm start                     # starts Express (server.js) on PORT 5000
# open http://localhost:5000
```
For fast UI iteration use `npm run dev` (Vite, port 5173) — but payments need `npm start`.

---

## 5. Push to GitHub

```bash
git init
git add .
git commit -m "OdiaExams: paywall, multi-exam, PYQ, timing, bookmarks, streaks"
git branch -M main
git remote add origin https://github.com/<you>/odia-exams.git
git push -u origin main
```
`.gitignore` already excludes `node_modules`, `dist`, and `.env`.

---

## 6. Deploy on Railway (start to finish)

1. Railway → **New Project → Deploy from GitHub repo** → pick `odia-exams`.
2. Railway auto-detects **Nixpacks** and uses `nixpacks.toml`:
   - install → `npm install`
   - build → `npm run build`
   - start → `node server.js`  ← serves the SPA **and** the Razorpay/Gemini APIs.
3. Open the service → **Variables** → add every key below (Raw Editor makes this fast):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_SITE_URL=https://<your-railway-domain>
   VITE_RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_ID=rzp_test_xxx
   RAZORPAY_KEY_SECRET=xxx
   RAZORPAY_WEBHOOK_SECRET=xxx
   GEMINI_API_KEY=...                 # optional, only for admin OCR
   FIREBASE_SERVICE_ACCOUNT={...}     # full service-account JSON on ONE line
   ```
   > `VITE_*` vars are baked in at build time, so a redeploy is needed if you change them.
4. **Networking → Generate Domain** to get your public URL.
5. Put that domain into:
   - `VITE_SITE_URL` and the Razorpay **webhook URL** (`/api/razorpay/verify`).
   - Firebase **Authentication → Settings → Authorized domains** (add the Railway domain).
6. **Redeploy** (Railway → Deployments → Redeploy) so the new `VITE_*` values are built in.

You're live. Visit the domain, sign up, and test a mock + a Pro purchase (Razorpay test card
`4111 1111 1111 1111`, any future expiry/CVV).

---

## 7. Going to production (Razorpay live mode)

1. Complete Razorpay KYC, switch to **Live** keys, update the 3 Razorpay vars + webhook.
2. Switch Firebase to a Blaze plan only if you exceed the free quota.
3. (Optional) Add a custom domain in Railway → Networking, and update `VITE_SITE_URL`
   + Firebase authorized domains + Razorpay webhook accordingly.

---

## 8. How PYQ mode is launched

Start any exam normally with `/exam/:examId`. For a Previous-Year set, pass query params:
```
/exam/<examId>?mode=pyq&pyqYear=2023&paperId=paper-2&language=odia
```
The engine filters questions by those keys and tags the saved result with them, so the
Result/Analysis screen and leaderboard can segment by exam, paper, language, and year.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| Payment succeeds but Pro not granted | `FIREBASE_SERVICE_ACCOUNT` missing/invalid, or webhook URL/secret wrong. Check Railway logs. |
| `Missing or insufficient permissions` | Deploy `firestore.rules`; ensure you're signed in. |
| Results list empty / index error | Build the composite index Firestore links in the error, or `firebase deploy --only firestore:indexes`. |
| Blank page after deploy | `npm run build` must run before start; confirm `dist/` exists (Nixpacks build phase). |
| Google login fails on Railway | Add the Railway domain to Firebase → Auth → Authorized domains. |

---

Questions or want CI/CD? Add a GitHub Action that runs `npm run build` on push — Railway
already redeploys automatically on every push to `main`.
