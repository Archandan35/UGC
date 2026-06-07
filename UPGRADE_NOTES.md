# OdiaExams — Iteration 1 Upgrade Notes (Firebase + Railway)

This bundle is your existing app **hardened** per the audit. Drop it into your
git repo (it already excludes `.git` and `node_modules`).

## What changed in this iteration
- **Security/config**
  - `src/firebase/config.js` now reads `VITE_FIREBASE_*` env vars (see `.env.example`).
  - `firestore.rules` — role-based rules; users **cannot** change their own `role`
    or `isPro` (fixes the critical client-side privilege-escalation hole).
  - `firestore.indexes.json` + `firebase.json` for one-command deploys.
  - `.gitignore` updated to keep `.env` and `package.json.save` out of git.
- **Landing page + routing**
  - `/` now renders the marketing `LandingPage`; login moved to `/login`,
    register at `/register`. Unknown routes redirect home.
  - Admin routes are **lazy-loaded** (`React.lazy`) so heavy libs (OCR, jsPDF,
    xlsx) no longer load on first visit.
- **SEO**
  - Real `index.html` meta + Open Graph + JSON-LD (Organization + Course).
  - `public/robots.txt`, `public/sitemap.xml`, and a dependency-free
    `src/lib/seo.js` `useSeo()` hook for per-route titles.
  - Fixed the broken Google Fonts `@import` in `globals.css`.
- **Analytics integrity (P0)**
  - Removed all `Math.random()` from `ResultPage.jsx`. It now shows **real**
    self-accuracy and real per-question time; comparative stats (topper time,
    percentile) render `—` until the aggregation layer feeds real data.

## Setup
1. `cp .env.example .env` and fill the values (Firebase + Razorpay + Gemini).
2. `npm install`
3. `npm run dev`

## Deploy Firestore rules & indexes
```
npm i -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

## Railway
Existing `nixpacks.toml` / `server.js` flow is unchanged. Add the env vars from
`.env.example` to your Railway service variables.

## Still pending (next iterations — agreed roadmap)
- Razorpay paywall (service + pricing page + verified webhook in `server.js`).
- Multi-exam schema migration (examId/paperId/language/pyqYear) + PYQ mode.
- Exam-engine real per-question timing + Firestore-persisted bookmarks.
- Service-layer extraction, dedupe admin trees, single responsive exam page.
- Streaks/badges, revision mode, topic accuracy trends, percentile (Cloud Function).
- Parallel **Lovable Cloud** rebuild for live preview.
