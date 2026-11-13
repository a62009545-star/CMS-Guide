# CMS Process Guide

An internal knowledge portal that explains how each module of the Change Management System (CMS) works end to end, with step-by-step walkthroughs for every sub-task.

- **Viewers** read published content, search everything, bookmark pages and mark walkthroughs as read.
- **Editors** create and edit content. Edits to live pages wait for an Admin to publish them.
- **Admins** have full control: publishing, ordering, media, users and roles, audit log and version restore.

Changes are pushed to every open browser over Socket.io, so readers see updates without refreshing.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18 + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query, TipTap, dnd-kit, Fuse.js |
| Backend | Node.js 20 + Express + TypeScript, Socket.io, Zod |
| Database | MongoDB (Mongoose) |
| Media | AWS S3 via pre-signed POST (optionally CloudFront); local disk fallback for development |
| Auth | JWT in an httpOnly, SameSite=Lax cookie; role checks on every API route |

## Repository layout

```
shared/   Zod schemas, enums and helpers used by both server and client
server/   Express API, Mongoose models, Socket.io, seed script
  src/models      User, Module, SubTask, Media, Version, AuditLog
  src/routes      auth, modules, subtasks, media, users, audit, versions, search, activity, stats
  src/services    sanitising, S3 storage, versioning, audit + realtime broadcast, content helpers
  src/seed        seed.ts and the placeholder content for the 7 modules
client/   React app
  src/pages       public pages and pages/admin/*
  src/components  layout (shell, sidebar, command palette), content (flow diagrams, media, callouts), editor (TipTap, media picker, drag-and-drop)
```

## Run locally

Requirements: Node.js 20+, and MongoDB 6+ (local or Atlas).

```bash
cp .env.example .env
```

Set `JWT_SECRET` in `.env` to a random string of at least 32 characters, and point `MONGODB_URI` at your database. Then:

```bash
npm install
```

```bash
npm run seed
```

```bash
npm run dev
```

The client runs on http://localhost:5173 and proxies `/api`, `/uploads` and `/socket.io` to the API on port 4000.

Sign in with **admin@example.com / ChangeMe@123**, then change the password from **Admin › Users & roles** (create a new admin, sign in as them, delete or re-password the seed account).

`npm run seed -- --reset` replaces all content (modules, sub-tasks, media records, versions and audit log) with the sample content. Users are kept.

### Tests and type checks

```bash
npm test
```

```bash
npm run typecheck
```

## Run with Docker

`docker compose` starts MongoDB and the app (API + built client on one port).

```bash
cp .env.example .env
```

Set `JWT_SECRET` in `.env`, then:

```bash
docker compose up -d --build
```

```bash
docker compose exec app node dist/seed.js
```

Open http://localhost:4000. Uploaded files are kept in the `uploads` volume unless S3 is configured.

## Deploy to Render (with MongoDB Atlas)

1. **Database.** In [MongoDB Atlas](https://www.mongodb.com/atlas), create a free cluster, a database user, and under *Network Access* allow `0.0.0.0/0` (Render's free plan has no fixed outbound IP). Copy the connection string and add the database name, e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/cms-guide?retryWrites=true&w=majority`.
2. **Blueprint.** In [Render](https://dashboard.render.com), choose **New › Blueprint**, connect this GitHub repository and the branch to deploy. Render reads `render.yaml`.
3. **Values.** Paste `MONGODB_URI` and choose `SEED_ADMIN_PASSWORD`. `JWT_SECRET` is generated for you.
4. **Deploy.** The first start seeds the admin account and sample content (only when the database has no users). Open the `onrender.com` URL and sign in.

The blueprint uses Render's **free** plan:

- It sleeps after 15 minutes without visitors. Keep it awake with a free uptime monitor (for example UptimeRobot) that requests `https://<your-app>.onrender.com/api/health` every 5 minutes.
- It has no persistent disk, so uploaded files are lost on every deploy or restart. Seed content uses images shipped with the app and is unaffected.

For production, switch to the **Starter** plan (always on) and either attach a disk at `/app/uploads` or add the `AWS_*` variables for S3 under *Environment*.

## Deploying to production

1. **Database.** Use MongoDB Atlas (or a replica set). Set `MONGODB_URI`.
2. **Secrets.** Set a long random `JWT_SECRET`. Serve over HTTPS; `COOKIE_SECURE` defaults to `true` when `NODE_ENV=production`.
3. **Origin.** Set `CLIENT_ORIGIN` to the public URL (comma-separate several).
4. **Build and run** the Docker image behind your load balancer or reverse proxy. Proxies must pass WebSocket upgrades on `/socket.io`. The container exposes `/api/health` for health checks.
5. **Scale-out note.** Socket.io broadcasts in-process. If you run more than one instance, add the Socket.io Redis adapter (`@socket.io/redis-adapter`) so every instance receives events.

### S3 and CloudFront

1. Create a bucket, e.g. `cms-guide-media`, and set `AWS_S3_BUCKET` and `AWS_REGION`.
2. Give the app's IAM role (preferred) or access key `s3:PutObject` and `s3:DeleteObject` on `arn:aws:s3:::cms-guide-media/media/*`.
3. Add a CORS rule so browsers can upload directly:

   ```json
   [{ "AllowedOrigins": ["https://guide.example.com"], "AllowedMethods": ["POST"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3000 }]
   ```

4. Serve files through CloudFront with Origin Access Control (keep the bucket private) and set `CLOUDFRONT_URL`. Without CloudFront the bucket objects must be publicly readable.

Uploads use a **pre-signed POST policy**, so S3 itself enforces the file type and the size limits (images 10 MB, MP4 500 MB). The browser uploads straight to S3 with a progress bar; the API never handles the file bytes. Videos play with `preload="metadata"` and HTTP range requests, so they stream rather than download in full.

For an internal-only deployment that must not expose media URLs, put CloudFront behind your SSO or switch `publicUrl()` in `server/src/services/storage.ts` to CloudFront signed URLs.

### Search

By default search uses a client-side Fuse.js index (typo-tolerant, instant) built from `GET /api/search/index`, plus a MongoDB text index for `GET /api/search`. To use **Atlas Search** for the server endpoint, create an index (e.g. named `default`) on both the `modules` and `subtasks` collections with dynamic mappings, and set `ATLAS_SEARCH_INDEX=default`.

## How it works

### Draft, review and publish

- New modules and sub-tasks start as **Draft**. Only Editors and Admins can see drafts.
- An **Admin** saving a page changes it immediately. **Publish** makes a draft visible to Viewers.
- An **Editor** saving a *published* page does not change what Viewers see. The changes are stored as a pending draft, shown on the dashboard under "Waiting to be published". Staff can open the page with **Preview pending changes**, and an Admin publishes them.
- The server enforces all of this. Hiding buttons in the UI is a convenience only.

### Versions and audit

Every save stores a full snapshot in `versions` with who, when, the change note and the list of changed fields. **Admin › Version history** shows a readable line diff between any two versions; Admins can restore a version (the restore itself becomes a new version). Every create, update, submit, publish, unpublish, reorder, restore, delete and role change is written to `auditlogs` and listed in **Admin › Audit log**.

### Real-time updates

After each content change the API emits `content:changed` over Socket.io (authenticated with the same cookie). Changes to drafts go only to Editors and Admins. Open pages invalidate their TanStack Query caches and refetch; if the page you are reading changed, you see "This page was updated by …". The bell icon lists recent changes.

### Security

- Rich text from TipTap is sanitised on the server with `sanitize-html` (allow-listed tags and attributes, safe link schemes, callout types) and again in the browser with DOMPurify.
- Zod validates every request body and query, and the same schemas validate admin forms in the browser.
- Mutating requests require an `X-Requested-With` header in addition to the SameSite cookie (CSRF defence). Login is rate limited and timing-safe.
- Helmet sets a strict Content Security Policy; video embeds are limited to YouTube, Vimeo and SharePoint.
- Changing a user's role or password signs them out everywhere (token version check).

## Pages

- **Home** (`/`): a central search with instant results, then Recently updated, Your bookmarks and Quick links.
- **CMS lifecycle** (`/lifecycle`): the seven stages as one route. Selecting a stage shows its full page below the route (how it works, flow, guidelines, walkthroughs and FAQs), kept in the address as `?stage=<slug>`. Each stage also has its own page at `/modules/<slug>`.
- **Configuration & management** (`/configuration`).
- Walkthrough pages have a single left column with the stage, progress and steps.

## Content areas

The guide has two separate areas, switched with the tabs in the header. Each has its own landing page, addresses, sidebar and admin tab.

| Area | Address | Admin |
| --- | --- | --- |
| **CMS lifecycle**: the seven numbered stages, drawn as the route on the home page | `/`, `/modules/<stage>/<walkthrough>` | Admin › Modules |
| **Configuration & management**: how to use CHM itself | `/configuration`, `/configuration/<topic>/<walkthrough>` | Admin › Configuration |

A module's area is its `section` field (`lifecycle` or `configuration`), chosen in the module editor. Links are built with `modulePath()` in `shared/src/index.ts`; an old `/modules/...` link to a configuration topic redirects to its `/configuration/...` address.

Content written from the team's SOPs (screenshots in `client/public/sop/`):

- **Plan & Inventory Validation** (lifecycle stage 1) comes from the Scheduler / CRQ Workflow SOP: find a CRQ, start the stage and fetch plan data, review plan & inventory and submit validation. Stages 2–7 are still placeholder content.
- **Configuration & management**: Getting started with CHM (sign in), Team Management, Activity Database Setup & View, and Roster.

Content added after the first deploy is applied by named, one-time migrations in `server/src/seed/run.ts` (recorded in the `migrations` collection), so an existing database is updated on its next start without re-seeding. Replacing stage 1 keeps the same module record, so bookmarks still work and the previous content stays in its version history. A module an admin deletes is not added back.

## Guide mascot

"Relay", a robot from [page-mascot](https://github.com/nilbuild/page-mascot) (MIT), sits in the bottom-left corner of every reader page. It greets readers the first time they reach each kind of page and offers a short tour that highlights the parts of that page. It also follows the cursor, looks at whatever it is pointing out, and reacts when you bookmark a page or mark a walkthrough as read.

- **Reader features only.** The tours live in `client/src/components/guide/tours.ts` and cover navigation, reading, search, bookmarks, "mark as read" and What's new. The guide is not shown under `/admin`, and any element marked `data-staff-only` (edit and publish controls) is never highlighted, so editing and admin features are not guided for any role. A step can be limited to roles with `roles: ['viewer']`.
- **Readers stay in control.** Click the robot to open or close it, use **End tour** or Esc at any time, or turn it off with **Hide Relay** (it comes back from the account menu). Which pages a reader has seen is remembered per user in the browser.
- **Another character.** Replace `client/public/mascot/robot-directions.webp` and `robot-reactions.webp` with another pair of sheets from page-mascot.

## Branding

- Colours are CSS variables in `client/src/styles/index.css`. The primary red is set to `#E40000`, the commonly published Airtel red. **Confirm it against the official brand guidelines** and change `--brand` (and `--brand-strong` for hover) in one place.
- The Airtel mark (from Simple Icons) is in `client/src/components/brand/AirtelMark.tsx` and `client/public/logo.svg`. To use the official logo lockup instead, add the file to `client/public/` and update `client/src/components/layout/Logo.tsx`.
- Typeface is Inter (Google Fonts). To use a brand font, add it in `client/index.html` and update `fontFamily.sans` in `client/tailwind.config.ts`.
- Seed images in `client/public/placeholders` are placeholder mock-ups. Replace them through the Media library.

## API overview

All routes are under `/api` and need a signed-in user unless noted.

| Method & path | Role | Purpose |
| --- | --- | --- |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | public / any | Session |
| `POST /auth/me/bookmarks`, `GET /auth/me/bookmarks`, `POST /auth/me/read/:id` | any | Bookmarks and "mark as read" |
| `GET /modules`, `GET /modules/:slug[?preview=1]` | any | Lifecycle and module pages |
| `POST /modules`, `PUT /modules/:id` | editor | Create / edit (editor edits on live pages become pending) |
| `PATCH /modules/:id/status`, `POST /modules/reorder`, `DELETE /modules/:id` | admin | Publish, order, delete |
| `GET /subtasks/by-slug/:module/:slug` | any | Walkthrough page |
| `GET /subtasks` (paginated), `POST /subtasks`, `PUT /subtasks/:id` | editor | Manage walkthroughs |
| `PATCH /subtasks/:id/status`, `POST /subtasks/reorder`, `DELETE /subtasks/:id` | admin | Publish, order, delete |
| `GET /media` (paginated), `POST /media/presign`, `POST /media`, `PUT /media/:id` | editor | Media library and uploads |
| `DELETE /media/:id` | admin | Delete media (removes it from pages) |
| `GET /versions/:type/:id`, `POST /versions/:id/restore` | editor / admin | History and restore |
| `GET /audit` (paginated) | admin | Audit log |
| `GET/POST/PATCH/DELETE /users` | admin | Users and roles |
| `GET /search/index`, `GET /search?q=` | any | Search |
| `GET /activity` | any | What's new |
| `GET /stats/dashboard` | editor | Admin dashboard |
