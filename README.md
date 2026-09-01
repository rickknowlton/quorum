# Quorum

Make a decision with a group.

Live site: [https://findquorum.net](https://findquorum.net)

Quorum is a lightweight group consensus app. Create one poll with scheduling plus a few simple questions, share a single link, and see where the group stands. Participants do not need accounts. Organizers sign in with Clerk so their polls live in one place.

It started as a way to schedule a fantasy football draft and vote on league dues without another week of group-chat chaos. The same shape of problem shows up for trips, dinners, clubs, and any small group that needs a time and a few decisions.

Scheduling is one question type, not the whole product.

This project is MIT licensed. See `LICENSE` and `SECURITY.md`.

The current site icon is by [Fach](https://www.flaticon.com/authors/fach) from [Flaticon](https://www.flaticon.com).

## Stack

- Next.js (App Router) and TypeScript
- React Server Components, with client components only where interaction requires them
- Tailwind CSS
- PostgreSQL and Drizzle ORM
- Clerk (organizer accounts)
- Zod, date-fns, Lucide, nanoid
- Vitest for business-logic tests

## Architecture

Polls are identified by a public ID in the URL (`/q/AbC123xyz`). Organizers sign in with Clerk; owned polls appear on `/dashboard`. Participant pages stay public. An unguessable admin token still authorizes the organizer dashboard as a fallback (`/q/.../admin?token=...`). Participants submit a name and answers; an edit token is stored in an httpOnly cookie and also offered as a bookmarkable URL.

Important relational data lives in tables, not one large JSON blob:

- `polls` - title, timezone, deadline, status, visibility settings, public ID, owner, admin token
- `questions` - generic questions (`availability`, `yes_no`, `multiple_choice`, `text`)
- `question_options` - multiple-choice labels and availability time ranges
- `participants` - display name plus edit token
- `responses` - one row per answer (and per availability option)
- `finalizations` - organizer-selected winning availability option

Availability ranking lives in `lib/availability/rank.ts`: most Yes, then fewest No, then Maybe, then score (`Yes = 2`, `Maybe = 1`).

All timestamps are stored in UTC. Each poll has an IANA timezone used for display.

## Local setup

### Requirements

- Node.js 20+
- npm
- PostgreSQL

### Database

Create a database, then copy the env file:

```bash
createdb quorum
cp .env.example .env
cp .env.example .env.local
```

Set `DATABASE_URL` in both `.env` (Drizzle) and `.env.local` (Next.js). Homebrew Postgres on macOS often looks like:

```text
DATABASE_URL=postgres://YOUR_USER@localhost:5432/quorum
```

### Install and migrate

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo poll

After seeding:

- Participant: [http://localhost:3000/q/demoBooze01](http://localhost:3000/q/demoBooze01)
- Organizer: [http://localhost:3000/q/demoBooze01/admin?token=devAdminBoozeLeagueDraftTokenLocalOnly0001](http://localhost:3000/q/demoBooze01/admin?token=devAdminBoozeLeagueDraftTokenLocalOnly0001)

The demo is a fantasy football draft poll with availability, yes/no, multiple choice, text, and eight responses.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run test` | Vitest watch |
| `npm run test:run` | Vitest once |
| `npm run db:generate` | Generate Drizzle migrations from `db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema without a migration file |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Load / replace the demo poll |

## Environment variables

| Name | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in path (`/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up path (`/sign-up`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | After sign-in (`/dashboard`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | After sign-up (`/dashboard`) |

## Deploying to Vercel

The Vercel Supabase integration sets `POSTGRES_URL` (and related keys). Quorum reads `DATABASE_URL` first, then falls back to `POSTGRES_URL`, so you do not need to copy those values into `.env.local` for local Homebrew Postgres.

Then apply migrations against the hosted database (use the non-pooling URL if you have it):

```bash
POSTGRES_URL_NON_POOLING="postgres://..." npm run db:migrate
```

Clerk’s Vercel connector should supply the Clerk keys. If it does not, disconnect the integration and add these yourself from [Clerk API keys](https://dashboard.clerk.com/last-active?path=api-keys), then **redeploy** (a rebuild is required for `NEXT_PUBLIC_` keys):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` = `/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` = `/dashboard`

In the Clerk Dashboard, add your Vercel domain to the allowed origins.

## Architectural decisions

- **Participants never need accounts.** Organizers sign in with Clerk. Creating a poll attaches it to their account and lists it on `/dashboard`.
- **Generic questions first.** Availability is a specialized question type with candidate time ranges, not a separate poll product.
- **Week calendar for candidate times.** Organizers click or drag on a week grid to add voting options, with duration presets and a selected-times list for fine-tuning. A month view is there to jump between weeks.
- **Duplicate names are allowed.** Names are labels, not identity. Each submission is still a distinct participant row.
- **Public writes are rate-limited.** Anonymous responses and poll creation have per-IP / per-poll / per-account ceilings.
- **Organizer and edit secrets are stored hashed.** The browser still holds the raw token in an httpOnly cookie scoped to that poll.
- **Deadline and closed are separate.** A passed deadline stops responses; closing is an explicit organizer action.
- **Finalizing a time does not close the poll.** Other questions can stay open until the organizer closes it.
- **Admin and edit authorization are checked on the server** with timing-safe token comparison. Cookies are convenience, not the only credential.
- **Postgres is not exposed through the Supabase Data API.** Tables have row-level security on, with no policies for `anon` / `authenticated`. The app uses the server-side Drizzle connection only.

## Future / Not MVP

- Poll deletion
- Saved groups
- Reusable participant lists
- Email invitations
- Reminders
- Calendar integrations
- ICS export
- Google Calendar integration
- Ranked-choice voting
- Numeric ratings
- Date-only voting
- Anonymous voting
- Hide results until deadline
- Comments / discussion
- Custom branding
- QR codes
- Poll duplication
- Smart scheduling suggestions
- Participant-local timezones
- Collecting email addresses
