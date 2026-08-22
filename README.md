# Hirnao

Mobile-first PWA for coordinating real-life meetings with friends and professional contacts.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui components
- **Supabase** — auth, PostgreSQL, Realtime
- French UI, premium design (white / black / warm beige)

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — demo mode works without Supabase
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
3. Optionally run `supabase/seed.sql` for the Paris friend group.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

Without Supabase credentials the app runs in **demo mode** with seeded in-memory data.

## Screens

| Route | Description |
|---|---|
| `/onboarding` | Name, city, interests, areas, social prefs |
| `/` | Home — conversational input + quick actions |
| `/plans/new` | Create plan |
| `/plans/[id]` | Plan detail — invitees, availability, ranked slots |
| `/plans/[id]/respond` | Invitee availability response |
| `/plans/[id]/confirm/[proposalId]` | Confirm / decline / suggest alternative |
| `/plans/[id]/confirmed` | Confirmed plan + ICS download |
| `/contacts` | Contact list |
| `/profil` | User profile |

## Slot ranking

```
score = confirmed × 100 + tentative × 35 − avg_travel_min × 2 − late_hour_penalty
```

Late-hour penalties: 20h → 10, 21h → 30, 22h+ → 50.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run test     # unit tests (slot ranking)
npm run lint     # ESLint
```

## PWA

`public/manifest.json` is configured for installability. Add icons to `public/icons/` (192×192 and 512×512).
