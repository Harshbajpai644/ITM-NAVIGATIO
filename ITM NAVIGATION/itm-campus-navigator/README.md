# ITM Smart Campus Navigator

Navigate ITM University with Live GPS, Smart Search & Real-Time Directions.

Multi-page React website — Home (search + popular buildings), live-GPS Map with real
road-based routing, Building Details, Visitor Pass form, aur About page. Dark mode
included. Deploy karne ke baad QR code bana kar poore campus me laga sakte ho.

## Kya-kya implement ho chuka hai (Phase 1)

- **Home page** — hero banner, Google-Maps-style search with autocomplete, category
  filter chips, popular buildings grid, campus stats
- **Live GPS Map** (`/map?dest=<buildingId>`) — `watchPosition` se continuous location
  tracking, real walking-route (OSRM, roads follow karta hai — seedhi line nahi),
  distance + ETA, recenter button, route-fail hone par bhi dashed seedhi line fallback
  (kabhi blank nahi hota)
- **Building Details** (`/building/<id>`) — photo, description, hours, facilities tags,
  nearby buildings, faculty/admission-cell list (tap = room number), Navigate + Share
  buttons
- **Visitor Pass** (`/visitor`) — form with validation (name, mobile, email, department,
  purpose, target building, visit time), success confirmation, direct "Navigate" button
- **About** (`/about`) — ITM University Gwalior ki public jaankari (schools, hostels,
  facilities) — isko official copy se replace kar dena
- **Dark mode toggle** — navbar me 🌙/☀️ button, choice browser me save rehti hai

## Jaanbujh kar abhi NAHI banaya (Phase 2/3 — future scope)

Ye sab cheezein tumhare document me khud "Future Scope" ke neeche likhi thi, isliye
abhi skip ki hain kyunki inko real backend, hardware ya extra services chahiye:
- Voice search
- Indoor (room-by-room) navigation
- Admin dashboard / visitor analytics
- QR visitor pass (print/scan)
- Emergency SOS
- Offline PWA mode

In sabko baad me alag se, ek-ek karke add karwaya ja sakta hai.

## Chalane ke liye

```bash
npm install
npm run dev
```
Jo `localhost` link mile wahi browser me kholo. **Location permission sirf `https://`
ya `localhost` pe milti hai** — file seedha double-click karke mat kholna.

## Real data daalna (SABSE ZAROORI STEP)

Sara data ek hi jagah hai: **`src/data/campusData.js`**

- Har building ka `lat`/`lng` — Google Maps pe us jagah right-click karke number copy
  karo (jaisa tumne is chat me ek live-location link diya, wahi tareeka)
- `image` — real photo ka URL ya `public/images/...` path
- `people` — faculty / admission cell / accounts jo bhi us building me baithte hain
- `hours`, `facilities`, `nearby` — info-only fields, apne hisab se badal do

`src/pages/About.jsx` me di gayi university info public sources se li gayi hai —
official/latest details ke liye university office se confirm karke replace karna.

## Deploy karna (live link + QR code)

**Netlify** (sabse aasaan):
```bash
npm run build
```
Phir [app.netlify.com/drop](https://app.netlify.com/drop) pe `dist` folder drag-drop
karo — turant live link milega. `public/_redirects` file already daali hui hai isliye
`/map`, `/about` jaise seedhe links bhi 404 nahi denge.

**Vercel**: repo import karo ya `vercel` CLI use karo — `vercel.json` already configured
hai isi routing fix ke liye.

Live link ka QR code kisi bhi free QR generator se bana lena.

## Crash na ho, iske liye kya rakha gaya hai

- Poora site **static** hai — koi apna server/database nahi, isliye server-crash ka
  sawaal hi nahi
- Routing service (OSRM) busy ho to app khud dashed seedhi line dikha deta hai — kabhi
  blank screen nahi aati
- GPS fail hone par saaf Hindi error message dikhta hai ki kya karna hai
- Form submissions client-side validate hoti hain, koi silent crash nahi
- `npm run build` bina kisi error ke pehle se test kiya ja chuka hai

## Note

OSRM ka free public routing server college-project scale ke liye theek hai. Agar
future me bahut zyada traffic ho (pura campus ek sath use kare), apna khud ka OSRM
instance chalane ka option hai — abhi ke liye zaroori nahi hai.
