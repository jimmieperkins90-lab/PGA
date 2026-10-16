# PGA Pool

Daily-lineup golf pool (built for the Masters). Next.js 14 App Router + TypeScript + Tailwind, Supabase (schema `pga`), deployed on Vercel from `main`.

- **Rules:** pick 4 / 4 / 3 / 3 golfers for rounds 1-4. Each person can use a golfer only once all tournament (database constraint). Picks lock at each round's first tee time. After the cut, only golfers who made it can be picked. Lowest combined score to par wins.
- **Pages:** `/` leaderboard, `/roster` picks, `/admin` tournament setup (admins only).
- **Scores:** pulled from ESPN's public scoreboard feed, throttled to once a minute, via `/api/sync`.
- **Env vars:** `INGEST_SECRET` (server only). Supabase URL and anon key have public defaults in `lib/supabase/env.ts`.
- **Database:** see `supabase/migrations/`.
