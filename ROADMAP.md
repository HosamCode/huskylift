# HuskyLift — Development Roadmap (v1)

**How we build:** each milestone is a small, self-contained slice that ends with
the app **working and deployed** — never half-broken. Foundation first, the core
loop next, polish last. Within each milestone we go step by step, with a
checkpoint before moving on.

**Guiding principles**
- **Always shippable** — the app works at the end of every milestone.
- **Deploy on day one** — a live URL exists from the start, so launch is never a cliff.
- **Foundation first** — auth underpins everything, so it comes early.
- **Data before decoration** — make it work, then make it pretty.

---

## M0 · Skeleton & pipeline
Create the Next.js + TypeScript app, run it locally, push to GitHub, deploy the
blank app to Vercel.
- **Done when:** a live URL shows a placeholder HuskyLift page.
- **You'll learn:** Next.js project layout, the local dev loop, git basics, Vercel deploys.

## M1 · Database live
Create the Supabase project, run `schema.sql`, connect the app to Supabase.
- **Done when:** the tables exist in the cloud and the app can talk to Supabase.
- **You'll learn:** Supabase basics, running SQL, environment variables/secrets, the Supabase client.

## M2 · Auth
Sign up / log in / log out, restricted to `@northeastern.edu`. Protect the dashboard.
- **Done when:** you can create an account with your NEU email, log in, land on an
  (empty) dashboard, and log out; logged-out users get bounced to the auth screen.
- **You'll learn:** how sessions work, protected routes, forms, client vs. server.

## M3 · Check In — the core loop
On load, check "am I checked in today?"; if not, show the button; tapping inserts
a visit and flips the button to "✓ Checked in," blocking a second tap.
- **Done when:** you can check in and it persists across refresh and re-login.
- **You'll learn:** reading & writing data, the today-query, confirmation UI, handling the one-per-day rule.
- *After this, the app does its core job.*

## M4 · Calendar
Month grid with visited days highlighted from `visit_date`, plus prev/next navigation.
- **Done when:** your visits show as highlighted days and you can browse months.
- **You'll learn:** fetching a month of data, rendering a date grid, date math.

## M5 · Stats & streak
Total visits, this week's progress (x / goal), and the weekly-goal streak.
- **Done when:** the motivational numbers are real and update as you check in.
- **You'll learn:** aggregate queries, the streak logic (the trickiest bit), deriving-not-storing in practice.

## M6 · Polish, PWA & README
NEU styling with shadcn/ui, empty/first-time and error/loading states, make it
installable as a PWA, and write the README.
- **Done when:** it looks like a real product, installs on a phone, and the repo reads professionally.
- **You'll learn:** component styling, PWA basics, writing a README recruiters respect.

---

**Long-term (post-v1, not scheduled):** check-out & session durations,
location-verified check-in, custom weekly goals, friends, leaderboards,
workout logging.
