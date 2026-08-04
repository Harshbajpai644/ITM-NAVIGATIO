# AGENTS.md

## Cursor Cloud specific instructions

### Project layout

Two independent Node.js apps under `ITM NAVIGATION/` (not an npm workspace):

| App | Path | Dev command | Default port |
|-----|------|-------------|--------------|
| Frontend (React + Vite) | `ITM NAVIGATION/itm-campus-navigator` | `npm run dev` | 5173 |
| Backend (Express + Supabase) | `ITM NAVIGATION/itm-navigator-backend` | `npm run dev` | 5000 |

### Starting services

Run each app in its own terminal (or tmux session) from its directory after `npm install`.

**Backend requires Supabase credentials** before it will start. Create `ITM NAVIGATION/itm-navigator-backend/.env` (gitignored) or export:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SECRET_KEY=<service_role_or_secret_key>
```

Without these, the backend crashes at startup with `supabaseUrl is required`. The health check is `GET http://localhost:5000/`.

The frontend hardcodes the visitor-pass API at `http://localhost:5000/api/visitor-pass` in `src/pages/Visitor.jsx`.

### Lint / test / build

- **Lint:** not configured in either package.
- **Tests:** no test scripts in `package.json`.
- **Frontend build:** `cd "ITM NAVIGATION/itm-campus-navigator" && npm run build` (verified working).
- **Frontend preview:** `npm run preview` (port 4173).

### E2E scope by feature

| Flow | Services needed |
|------|-----------------|
| Home, map search, building details, about | Frontend only |
| Live GPS map navigation | Frontend + browser geolocation permission + network (OpenFreeMap tiles) |
| Visitor pass submit + persist | Frontend + backend + valid Supabase project with `visitor_passes` table |

### Gotchas

- Vite dev server binds to `localhost` only by default; use `npm run dev -- --host` if you need LAN access.
- Map tiles load from `https://tiles.openfreemap.org` (external CDN).
- No Docker, devcontainer, or docker-compose in this repo.
