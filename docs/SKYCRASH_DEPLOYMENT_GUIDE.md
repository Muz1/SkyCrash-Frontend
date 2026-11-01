# SkyCrash Deployment Guide

**Audience:** students, markers and technical stakeholders deploying SkyCrash without help from the original developers.
**Scope:** the production deployment of the SkyCrash frontend, backend API and database.
**Verified against:** frontend `release/panel` @ `db0982f`, backend `Muzi` @ `02fb39d` (the same commit as the Render deploy repository's `main`). Verified on 30 October 2026.

---

## Contents

1. [System overview](#1-system-overview)
2. [Current deployment at a glance](#2-current-deployment-at-a-glance)
3. [Prerequisites](#3-prerequisites)
4. [Get the source code](#4-get-the-source-code)
5. [Database deployment](#5-database-deployment)
6. [Backend deployment (Render)](#6-backend-deployment-render)
7. [Frontend deployment (Vercel)](#7-frontend-deployment-vercel)
8. [Authentication and integrations](#8-authentication-and-integrations)
9. [Post-deployment verification checklist](#9-post-deployment-verification-checklist)
10. [Troubleshooting](#10-troubleshooting)
11. [Deployment maintenance](#11-deployment-maintenance)
12. [Items that need confirmation](#12-items-that-need-confirmation)
13. [Appendix A: Environment variable reference](#appendix-a-environment-variable-reference)
14. [Appendix B: Running locally before deploying](#appendix-b-running-locally-before-deploying)
15. [Appendix C: Official documentation](#appendix-c-official-documentation)

### Conventions

- `<ANGLE_BRACKETS>` are placeholders. Replace them with your own value. Never commit the real value.
- Every command block starts with a **Directory:** line. Run the command from that folder.
- Directory names assume the repositories are cloned side by side, as `SkyCrash-Frontend/` and `SkyCrash-Backend/`.
- Commands are written for a POSIX shell (Git Bash, macOS or Linux). Where PowerShell syntax differs, a PowerShell version is given too.

> ⚠️ **Warning** marks actions that can affect production data, live users or security.

---

## 1. System overview

### 1.1 What SkyCrash is

SkyCrash is a multiplayer "crash"-style betting game developed for Derivco. It uses virtual credits only. Each round, a plane takes off and a multiplier climbs until the plane crashes at a random point. Players bet before take-off and must cash out before the crash to win their stake times the multiplier. All players share the same rounds in real time. The crash point is provably fair: each round publishes a server-seed hash in advance, and players can verify the round afterwards.

The application also includes:
- player accounts with age gating, terms acceptance and responsible-play limits
- daily challenges, achievements, a spin wheel, lobbies and leaderboards
- sandbox credit purchases through PayFast
- an admin console with analytics, reports, player management, account rules and sanctions, system health, and optional AI feedback insights

### 1.2 Architecture

| Component | Technology (verified in code) | Hosting |
|---|---|---|
| Frontend | Vue 3.5 + TypeScript, Vite 8, Pinia, Vue Router, Tailwind CSS 4, Axios, `@microsoft/signalr` | **Vercel** (static single-page application) |
| Backend API | ASP.NET Core on **.NET 10** (`net10.0`), EF Core 10, SignalR, JWT bearer auth, Serilog, FluentValidation | **Render** web service (Docker) |
| Database | **PostgreSQL**, accessed through Npgsql and EF Core migrations | **Render** managed PostgreSQL |

The backend uses a layered solution, [`SkyCrash-Backend/skycrash-backend/SkyCrash.slnx`](../../SkyCrash-Backend/skycrash-backend/SkyCrash.slnx):

| Project | Role |
|---|---|
| `SkyCrash.Domain` | Entities and enums |
| `SkyCrash.Application` | DTOs, interfaces, validators, options classes |
| `SkyCrash.Infrastructure` | EF Core `SkyCrashDbContext`, **migrations**, game engine, services (email, PayFast, Gemini and others) |
| `SkyCrash.Api` | Controllers, the SignalR `GameHub`, `Program.cs` (start-up, CORS, auth, seeding) |
| `SkyCrash.Api.Tests` | xUnit tests (these need a real PostgreSQL database) |

### 1.3 How the components connect

```
                         ┌──────────────────────────────┐
   Player / Admin        │  Vercel (static hosting)     │
   web browser  ───────► │  skycrash-frontend.vercel.app│  index.html + JS bundle
        │                └──────────────────────────────┘  (API URLs baked in at build time)
        │
        │  1. REST   https://<api-host>/api/...          (Axios, "Authorization: Bearer <JWT>")
        │  2. Live   wss://<api-host>/hubs/game          (SignalR, JWT sent as ?access_token=)
        ▼
┌──────────────────────────────────────────────┐        ┌──────────────────────────────┐
│ Render web service "skycrash-api" (Docker)   │        │ Render PostgreSQL            │
│ ASP.NET Core: controllers + GameHub +        │──────► │ "skycrash-db" / db "skycrash"│
│ RoundEngineService (runs the rounds)         │ Npgsql │ (DATABASE_URL, internal)     │
└──────────────────────────────────────────────┘        └──────────────────────────────┘
        │ outbound HTTPS (all optional except Google tokeninfo when Google sign-in is on)
        ├─► oauth2.googleapis.com/tokeninfo   – checks Google Sign-In ID tokens
        ├─► Brevo HTTPS API (or SMTP)         – verification, password-reset and login-code emails
        ├─► sandbox.payfast.co.za             – sandbox credit purchases (+ PayFast ITN callback in)
        ├─► Google Gemini API                 – AI feedback insights / Admin Advisor
        └─► api.pwnedpasswords.com            – breached-password check on sign-up
```

Key points:

1. **The frontend is static.** Vite bakes the API addresses into the JavaScript at build time ([`src/lib/apiUrls.ts`](../src/lib/apiUrls.ts)). If you change the API address, you must **rebuild and redeploy** the frontend.
2. **REST calls** go to `${VITE_API_BASE_URL}`, for example `https://skycrash-api.onrender.com/api`. The JWT is stored in `localStorage` under `skycrash_token` and sent as a bearer token ([`src/services/api.ts`](../src/services/api.ts)).
3. **Real-time game traffic** (round ticks, placing bets, cashing out) runs over SignalR at `${VITE_SIGNALR_HUB_URL}`, for example `https://skycrash-api.onrender.com/hubs/game`. The JWT is passed as the `access_token` query string, which the API accepts only for `/hubs` paths ([`Program.cs`](../../SkyCrash-Backend/skycrash-backend/src/SkyCrash.Api/Program.cs)).
4. **The browser and the API are on different origins**, so the API's CORS policy must list the frontend's exact origin (`Cors__AllowedOrigins__*`).
5. **The database is reachable only from the API.** The API applies EF Core migrations when it starts (`Database__MigrateOnStartup=true`).

---

## 2. Current deployment at a glance

This table separates what **already exists** from what a **fresh deployment** must create.

| Item | Current (already deployed) | Fresh deployment |
|---|---|---|
| Frontend URL | `https://skycrash-frontend.vercel.app` | `https://<your-project>.vercel.app` |
| Vercel project | `skycrash-frontend`, team **IronWings** (`iron-wings`), Vite preset, Node 24.x | Create your own project (§7) |
| Frontend deploy method | Vercel CLI (`vercel --prod`) from branch `release/panel` | Same |
| Frontend env vars (Vercel, Production only) | `VITE_API_BASE_URL`, `VITE_SIGNALR_HUB_URL` | Set both (§7.3) |
| Backend URL | `https://skycrash-api.onrender.com` | `https://<service-name>.onrender.com` |
| Backend deploy method | Render Blueprint ([`render.yaml`](../../SkyCrash-Backend/render.yaml)). Builds from GitHub repo `anjalisebastianstw-dot/SkyCrash-Backend-deploy`, branch `main`, and auto-deploys on each commit | Create a Blueprint from your own copy of the backend repo (§6) |
| Backend source of truth | `Muz1/SkyCrash-Backend`, branch `Muzi` (pushed to the deploy repo's `main`) | Your own repo or branch |
| Database | Render PostgreSQL `skycrash-db` (free plan), database `skycrash`, user `skycrash_user` | Created automatically by the same Blueprint (§5) |
| Live health (30 Oct 2026) | `/health` → `healthy`; `/api/health` → `databaseConnected: true` | Verify in §9 |
| Google Sign-In | Enabled: the API publishes a client ID | Create your own OAuth client (§8.1) |

> **Note: unused leftovers.** The project's history shows that the API and database were hosted on **Railway** before the move to Render. The live site no longer calls Railway, but [`vercel.json`](../vercel.json) still allows `*.railway.app` in its Content-Security-Policy. You do **not** need Railway for a fresh deployment. See §12 for what remains to confirm.

> **Note: other repository.** The `Muz1/SkyCrash-Database` repository (`SkyCrash-Database/`) holds an early SQLite prototype and placeholder SQL files (`migrations/001_initial_schema.sql` contains only commented-out examples). **Production does not use it.** The live schema comes entirely from the EF Core migrations in `SkyCrash-Backend/skycrash-backend/src/SkyCrash.Infrastructure/Migrations/`.

---

## 3. Prerequisites

### 3.1 Software

| Tool | Version | Why | Verified from |
|---|---|---|---|
| Git | any recent | clone and push repositories | — |
| Node.js | **22.18+ or 24.12+** (Vercel uses 24.x) | build the frontend | `package.json` → `engines` |
| npm | bundled with Node | install frontend dependencies | `package-lock.json` |
| Vercel CLI | the current version (62.x was used) | deploy the frontend | `npm i -g vercel` |
| .NET SDK | **10.0.100 or later** (`rollForward: latestFeature`) | build and test the backend locally; run `dotnet ef` | `skycrash-backend/global.json` |
| `dotnet-ef` | **10.0.9** (local tool manifest) | apply or create migrations manually | `skycrash-backend/dotnet-tools.json` |
| Docker | any recent | *optional*: local PostgreSQL for tests, local container builds | `Dockerfile`s |
| `psql` / `pg_dump` | matching the Render PostgreSQL major version | *optional*: inspect the database and take backups | — |

You do **not** need .NET or Docker installed to deploy. Render builds the backend Docker image itself, and Vercel builds the frontend itself. You need them only to test locally or to run migrations by hand.

### 3.2 Accounts and access

| Account | Needed for | Required permission |
|---|---|---|
| **GitHub** | source code; Render pulls the backend from GitHub | Read access to the frontend and backend repos. Push access to the repo Render deploys from |
| **Render** ([render.com](https://render.com)) | API and PostgreSQL | Owner or admin of the workspace that holds the Blueprint |
| **Vercel** ([vercel.com](https://vercel.com)) | frontend hosting | Member of the team that owns the project (currently IronWings) |
| **Google Cloud Console** | Google Sign-In OAuth client ID | Permission to edit **APIs & Services → Credentials** on a project |
| **Brevo** *(optional)* | sending real email | Permission to create an API key and verify a sender |
| **PayFast Sandbox** *(optional)* | your own sandbox merchant (otherwise PayFast's shared public sandbox merchant is used) | sandbox account |
| **Google AI Studio** *(optional)* | Gemini API key for AI insights | — |

### 3.3 Secrets you will create or collect

Never commit these values or paste them into chat or screenshots.

| Secret | Where it comes from |
|---|---|
| `Jwt__Key` | Generated by Render (`generateValue: true`) |
| `SeedAdmin__Password` | Generated by Render. Read it under **Render → skycrash-api → Environment** |
| `DemoSeed__PlayerPassword`, `DemoSeed__AdminPassword` | Generated by Render |
| `DATABASE_URL` | Injected by Render from the database (`fromDatabase`) |
| `Security__GoogleClientId` | Google Cloud Console (§8.1). This is a public identifier, not a secret, but keep it under your control |
| `Email__BrevoApiKey` | Brevo → **SMTP & API → API keys** |
| `Gemini__ApiKey` / `Gemini__BackupApiKey` | Google AI Studio |
| `PayFast__MerchantId` / `MerchantKey` / `PassPhrase` | PayFast sandbox → **Settings → Developer Settings** (optional) |

---

## 4. Get the source code

The live code is **not** on `main` in either repository. Always deploy from these branches:

| Repo | Live branch |
|---|---|
| `https://github.com/Muz1/SkyCrash-Frontend` | `release/panel` |
| `https://github.com/Muz1/SkyCrash-Backend` | `Muzi` |

**Directory:** the parent folder where you keep projects
```bash
git clone --branch release/panel https://github.com/Muz1/SkyCrash-Frontend.git SkyCrash-Frontend
git clone --branch Muzi https://github.com/Muz1/SkyCrash-Backend.git SkyCrash-Backend
```

The backend repository's root holds `render.yaml` and `.github/`. The .NET solution lives in the `skycrash-backend/` sub-folder.

**For a fresh deployment,** Render needs a GitHub repository that **your** Render account can read, with `render.yaml` at its root. Fork `Muz1/SkyCrash-Backend`, or push the `Muzi` branch to a repository you own, the same way the current deploy repo `anjalisebastianstw-dot/SkyCrash-Backend-deploy` was created:

**Directory:** `SkyCrash-Backend/`
```bash
git push https://github.com/<YOUR_GITHUB_USER>/<YOUR_DEPLOY_REPO>.git origin/Muzi:main
```

---

## 5. Database deployment

SkyCrash uses **PostgreSQL**. Render creates the database, and the API creates the schema. **No manual SQL is required.**

### 5.1 Configure the database

The database is declared in [`render.yaml`](../../SkyCrash-Backend/render.yaml):

```yaml
databases:
  - name: skycrash-db
    databaseName: skycrash
    user: skycrash_user
    plan: free
```

1. You do **not** create the database separately. The Blueprint in §6.2 creates `skycrash-db` and the `skycrash-api` service together.
2. Render generates the database password. You never type it in.
3. `render.yaml` does not pin a PostgreSQL major version, so Render uses its default. Record the version shown on the database's page. You need it to choose a matching `pg_dump`.

> ⚠️ **Warning: free-tier limits.** The comment in `render.yaml` notes that **Render's free PostgreSQL expires after 30 days unless upgraded.** When it expires, all player accounts, balances and round history are lost. For anything longer than a short demo, upgrade the database plan in Render before the expiry date (Render shows it on the database page). Also check Render's documentation for backup availability on your plan.

### 5.2 Establish the production connection

1. The Blueprint sets the API's `DATABASE_URL` from the database's connection string:
   ```yaml
   - key: DATABASE_URL
     fromDatabase:
       name: skycrash-db
       property: connectionString
   ```
2. At start-up, `Program.cs` reads `DATABASE_URL`. [`DatabaseUrl.cs`](../../SkyCrash-Backend/skycrash-backend/src/SkyCrash.Api/DatabaseUrl.cs) converts the `postgres://user:pass@host:port/db` form into an Npgsql connection string with `SslMode=Prefer`.
3. If `DATABASE_URL` is not set, the API falls back to `ConnectionStrings__DefaultConnection`, using the format `Host=...;Port=5432;Database=skycrash;Username=...;Password=...`. You need this only when not using Render.
4. To connect from **your own computer**, for example with `psql`, use the **External Database URL** from **Render → skycrash-db → Connect**. The internal URL works only inside Render.

### 5.3 Apply database migrations

**Automatic (the method used in production):** the Blueprint sets `Database__MigrateOnStartup=true`. On every start, the API runs `Database.MigrateAsync()` before it accepts traffic, which applies any pending migrations. There are currently **30 migrations**, from `20260717111211_InitialCreate` to `20261025120120_AddReportingIndexes`.

**Manual (optional, for example to migrate before deploying new code):**

> ⚠️ **Warning:** this changes the **production** database. Take a backup first (§11.3).

**Directory:** `SkyCrash-Backend/skycrash-backend/`
```bash
dotnet tool restore                                   # installs dotnet-ef 10.0.9 from dotnet-tools.json
export DATABASE_URL='<EXTERNAL_DATABASE_URL_FROM_RENDER>'
dotnet ef migrations list  --project src/SkyCrash.Infrastructure --startup-project src/SkyCrash.Api
dotnet ef database update  --project src/SkyCrash.Infrastructure --startup-project src/SkyCrash.Api
unset DATABASE_URL
```
PowerShell: replace the `export` line with `$env:DATABASE_URL = '<EXTERNAL_DATABASE_URL_FROM_RENDER>'`, and `unset` with `Remove-Item Env:DATABASE_URL`.

The migrations live in the Infrastructure project, so `--project` points there. The API project is the start-up project because it holds the configuration.

### 5.4 Initialise required data

No seed scripts need to be run. On start-up the API:

1. Creates the default **game settings** row, with the house edge and max multiplier, if it is missing.
2. Creates the seeded **manager admin** when `SeedAdmin__Password` is set: username `NewBoi`, email `newboi@skycrash.local`, with manager rights so it can grant admin access to others. This step is idempotent and never changes other accounts.
3. Creates **demo data** when `DemoSeed__Enabled=true`: a demo player (`pilot@demo.skycrash.local`, username `demo_pilot`), a demo admin (`admin@demo.skycrash.local`, username `demo_admin`), a few verifiable rounds and an earned badge. Passwords come from `DemoSeed__PlayerPassword` and `DemoSeed__AdminPassword`.
4. Switches sandbox payments on when PayFast is usable and no admin has changed the payments switch before.

> ⚠️ **Warning:** `DemoSeed__Enabled` is `"true"` in `render.yaml` for the presentation. Demo accounts are marked as test accounts, but you should set the value to `"false"` if the deployment is used for anything other than a demonstration.

> **Do not** run `SkyCrash-Database/.../seeds/dev_sample_data.sql` or `001_initial_schema.sql` against production. They belong to the old prototype and do not match the real schema.

### 5.5 Verify the database

1. `GET https://<api-host>/api/health` must return `"databaseConnected": true` (§9).
2. Optionally, connect with `psql` and check the latest applied migration:

   **Directory:** any
   ```bash
   psql '<EXTERNAL_DATABASE_URL_FROM_RENDER>' -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 1;'
   ```
   Expected: `20261025120120_AddReportingIndexes`, or a newer migration if more have been added.

---

## 6. Backend deployment (Render)

### 6.1 How the backend is built

Render builds [`skycrash-backend/Dockerfile`](../../SkyCrash-Backend/skycrash-backend/Dockerfile) with `skycrash-backend/` as the Docker context:

1. **Build stage:** `mcr.microsoft.com/dotnet/sdk:10.0` restores and runs `dotnet publish -c Release`.
2. **Runtime stage:** `mcr.microsoft.com/dotnet/aspnet:10.0`, plus `curl` and `libgssapi-krb5-2`. The container listens on port **8080**.
3. Render checks `healthCheckPath: /health` before routing traffic to a new deploy.

### 6.2 Create the service from the Blueprint

1. Make sure your deploy repository (§4) contains `render.yaml` at its root.
2. **Before** creating the Blueprint, check the three hard-coded frontend URLs in `render.yaml`. For a fresh deployment whose Vercel address differs from `https://skycrash-frontend.vercel.app`, change these and commit the change:
   ```yaml
   - key: Cors__AllowedOrigins__0
     value: https://skycrash-frontend.vercel.app      # ← your frontend origin, no trailing slash
   - key: Email__FrontendBaseUrl
     value: https://skycrash-frontend.vercel.app      # ← where email links point
   - key: PayFast__FrontendBaseUrl
     value: https://skycrash-frontend.vercel.app      # ← where PayFast returns the player
   ```
   You can also change them later in the Render dashboard (§6.5). If you don't know your Vercel URL yet, do §7.1–7.2 first, or update these values afterwards.
3. In Render, choose **New → Blueprint**, connect GitHub, and select your deploy repository and branch.
4. Render reads `render.yaml` and shows the `skycrash-db` database and the `skycrash-api` web service.
5. Render asks for each `sync: false` value. All of them are optional. **You can leave every one empty** and the API still starts:

   | Prompted key | Leave empty, and then… |
   |---|---|
   | `Security__GoogleClientId` | Google Sign-In is hidden (§8.1) |
   | `Email__BrevoApiKey`, `Email__From`, `Email__Smtp*` | No emails are delivered (§8.2) |
   | `Gemini__ApiKey`, `Gemini__BackupApiKey` | A built-in keyword analyser replaces AI insights |
   | `PayFast__MerchantId/Key/PassPhrase` | PayFast's shared public sandbox merchant is used |
   | `PayFast__ApiBaseUrl` | Render's own `RENDER_EXTERNAL_URL` is used for the PayFast notify URL |

6. Click **Apply**. Render creates the database, builds the image and starts the API. The first build takes several minutes.
7. When the service is **Live**, note its URL: `https://<service-name>.onrender.com`. This is the **production API URL** used in §7.

### 6.3 Backend environment variables

All keys use ASP.NET Core's convention: `__` (double underscore) separates nested configuration sections. For example, `Jwt__Key` becomes `Jwt:Key`. The full table is in [Appendix A](#appendix-a-environment-variable-reference). These are required:

| Variable | Value in `render.yaml` | Notes |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` | Turns Swagger off, enables HTTPS redirection, and requires HTTPS for PayFast |
| `PORT` | `8080` | Matches the container port |
| `DATABASE_URL` | from `skycrash-db` | Connection string |
| `Database__MigrateOnStartup` | `true` | Applies migrations on start |
| `Jwt__Key` | generated | **Required.** `appsettings.json` has no JWT section, so without this every sign-in fails. Must be 32+ characters |
| `Jwt__Issuer` / `Jwt__Audience` | `SkyCrash.Api` / `SkyCrash.Client` | |
| `Jwt__ExpiryMinutes` | `60` | |
| `Cors__AllowedOrigins__0` | the frontend origin | Add `Cors__AllowedOrigins__1`, `__2`, … for extra origins |
| `SeedAdmin__Password` | generated | Password for `newboi@skycrash.local` |

> ⚠️ **Security:** if you rotate `Jwt__Key`, every user is signed out. If you rotate `SeedAdmin__Password` after the admin account exists, the stored password does **not** change. The seeder only creates the account; it never updates it. Change the password through the app instead.

### 6.4 Configure authentication and external services

See §8 for Google Sign-In, email, PayFast and Gemini. Enter each value under **Render → skycrash-api → Environment**. When you save, Render redeploys the service.

### 6.5 Change settings after creation

1. Open **Render → skycrash-api → Environment**.
2. Edit or add variables, then save. Render restarts the service with the new values.
3. Values entered in the dashboard take precedence for that service. If the Blueprint is synced again, keys with a `value:` in `render.yaml` may be reset to that value, so keep `render.yaml` in step with any dashboard changes.

### 6.6 Verify the backend

Free Render services sleep after 15 minutes without traffic. The first request can take **about a minute** while the service wakes up, so allow a long timeout.

**Directory:** any
```bash
curl -m 120 https://<api-host>/health
# {"status":"healthy"}                                  ← process is up (no database check)

curl https://<api-host>/api/health
# {"status":"healthy","databaseConnected":true,...}     ← database reachable

curl https://<api-host>/api/settings/public
# {"lobbyMaxPlayers":10,...,"rules":{"houseEdgePercentage":1.0000,...},"googleClientId":...}
```
In **Render → skycrash-api → Logs**, a healthy start shows the Serilog request log, with no exceptions from `MigrateAsync`. Swagger is **not** available in production, because it is enabled only in Development.

---

## 7. Frontend deployment (Vercel)

### 7.1 How the frontend is built

[`vercel.json`](../vercel.json) defines the build:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [ ... Content-Security-Policy, X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy ... ]
}
```

- `npm run build` runs a type check (`vue-tsc --build`) and `vite build` in parallel. A TypeScript error fails the deployment.
- The rewrite sends every path to `index.html`, so client-side routes like `/game` and `/admin/health` work on reload.
- Vercel runs `npm install` and the build **on its own servers**. `.vercelignore` stops local `node_modules`, `dist` and `.env*` files from being uploaded.

### 7.2 Configure the project

1. Install the CLI and sign in.

   **Directory:** any
   ```bash
   npm i -g vercel
   vercel login
   ```
2. Link the folder to a Vercel project.

   **Directory:** `SkyCrash-Frontend/`
   ```bash
   # Existing deployment (member of the IronWings team):
   vercel link --yes --project skycrash-frontend
   # Fresh deployment: answer the prompts to create a new project
   vercel link
   ```
   Linking writes a local `.vercel/` folder, which is git-ignored. If linking also creates a `.env.local` file or edits `.gitignore`, **do not commit** those changes. Delete `.env.local` and revert `.gitignore`.
3. For a fresh project, confirm in **Vercel → Project → Settings** that the preset is **Vite**, the build command is `npm run build`, the output directory is `dist`, and Node.js is **24.x**. `vercel.json` already sets the first three.

### 7.3 Set environment variables (connect to the backend)

The frontend reads only these variables ([`env.d.ts`](../env.d.ts), [`src/lib/apiUrls.ts`](../src/lib/apiUrls.ts)):

| Variable | Production value | Used for |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<api-host>/api` | REST calls |
| `VITE_SIGNALR_HUB_URL` | `https://<api-host>/hubs/game` | SignalR game hub |
| `VITE_API_HOST` *(alternative, not used now)* | `<api-host>` | If set, overrides both variables above with `https://<host>/api` and `https://<host>/hubs/game` |

These values are **not secrets**: they end up in the public JavaScript bundle. Don't put anything sensitive in a `VITE_` variable.

**Directory:** `SkyCrash-Frontend/`
```bash
vercel env add VITE_API_BASE_URL production       # paste: https://<api-host>/api
vercel env add VITE_SIGNALR_HUB_URL production    # paste: https://<api-host>/hubs/game
vercel env ls                                      # check both are listed for Production
```
For the current deployment, `<api-host>` is `skycrash-api.onrender.com`.

> **Note:** both variables currently exist **only for Production**. Preview deployments (`vercel` without `--prod`) are built without an API address and cannot reach the backend. To use previews, add the variables to the Preview environment as well, and add the preview origin to the API's CORS list (§10.3).

### 7.4 Build locally (recommended check)

**Directory:** `SkyCrash-Frontend/`
```bash
npm install          # not "npm ci": see the note below
npx vitest run       # unit tests
npm run build        # type check + production build into dist/
```

> **Known issue:** `npm ci` currently fails with `Missing: @emnapi/core@1.11.3 from lock file`, because `package-lock.json` is out of sync with `package.json`. This also breaks the GitHub Actions workflow in `.github/workflows/ci.yml`. Vercel uses `npm install`, so **deployment is not affected.** To fix it, run `npm install` and commit the updated `package-lock.json`.

### 7.5 Deploy to production

**Directory:** `SkyCrash-Frontend/` (on branch `release/panel`, with a clean working tree)
```bash
git status                 # make sure you are deploying committed code
vercel --prod
```
The CLI prints the deployment URL and assigns the production alias, such as `https://skycrash-frontend.vercel.app`. Each build takes about 30 seconds.

> **Note:** Vercel builds from your **local folder**, not from GitHub. Uncommitted local changes are deployed too. Push the same commit to GitHub so the repository matches what is live.

### 7.6 Domains and production settings

1. The current deployment uses the default `*.vercel.app` domain. No custom domain is defined in the project files.
2. To add a custom domain, open **Vercel → Project → Settings → Domains**. Then update everything that names the frontend's address:
   - Render: `Cors__AllowedOrigins__*`, `Email__FrontendBaseUrl`, `PayFast__FrontendBaseUrl`
   - Google Cloud: the **Authorised JavaScript origins** (§8.1)
3. If the **API** moves to a host outside `*.onrender.com` or `*.railway.app`, edit the `connect-src` directive of the Content-Security-Policy in `vercel.json`, or the browser will block every API call. The same applies to a custom API domain.

---

## 8. Authentication and integrations

### 8.1 Sign-in methods

| Method | How it works |
|---|---|
| Email + password | `POST /api/auth/login` with `{ email, password }`. Usernames are **not** accepted for login. |
| Login code (OTP) | When `Security__LoginOtp=true` **and** real email is configured, a 6-digit code is emailed after the password check (`POST /api/auth/login/otp`). Outside Development, the API **forces OTP off** if `Email__Mode` is `Log`, so nobody gets locked out. `render.yaml` sets it to `false`. |
| Google Sign-In | See below |
| Access link / QR | Admins can create `/play/<token>` links that sign one player in without a password |
| Lockout | 5 failed logins per email, or 20 per IP, within 15 minutes are refused |

All methods end with the API issuing a JWT that is valid for `Jwt__ExpiryMinutes`. Admin pages re-check the account type against the database on every request.

### 8.2 Google Sign-In

**How it works (verified in code):**
1. The browser calls `GET /api/settings/public`. If the API has `Security__GoogleClientId`, the response includes `googleClientId`, and the login page shows the Google button. **The frontend needs no Google configuration of its own.**
2. [`GoogleSignIn.vue`](../src/components/sky/GoogleSignIn.vue) loads `https://accounts.google.com/gsi/client` and renders the Google Identity Services button. It uses the default popup flow, which returns an **ID token** to a JavaScript callback.
3. The frontend posts the ID token to `POST /api/auth/google`.
4. The API checks the token with `https://oauth2.googleapis.com/tokeninfo`. It accepts the token only if the issuer is Google, the audience equals `Security__GoogleClientId`, and the email is verified.
5. A first-time Google user is asked once for a date of birth (18+ age gate) and must accept the terms and rules. The account is then created with the verified email and starter credits.

**Setup steps:**
1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project.
2. Open **APIs & Services → OAuth consent screen**. Configure it as an **External** app with an app name and support email. If the app stays in **Testing** status, only the listed test users can sign in. Publish it to allow anyone.
3. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**, and choose application type **Web application**.
4. Under **Authorised JavaScript origins**, add:
   - `https://skycrash-frontend.vercel.app`, or your own frontend origin
   - for local testing: `http://localhost:5173` **and** `http://localhost`
5. **Authorised redirect URIs:** none are needed. The popup flow does not redirect.
6. Copy the **Client ID**, which ends in `.apps.googleusercontent.com`. A **client secret is not used** by SkyCrash.
7. In Render, set `Security__GoogleClientId=<CLIENT_ID>` and save. The service redeploys.
8. Check that `GET /api/settings/public` now contains `googleClientId`, and that the Google button appears on `/login`.

The CSP in `vercel.json` already allows `accounts.google.com` (script, style, frame and connect) and `*.googleusercontent.com` (profile images).

### 8.3 Email (Brevo)

Email is used for verification links (`/verify-email`), password resets (`/reset-password`) and login codes.

| `Email__Mode` | Behaviour |
|---|---|
| `Log` (default in `appsettings.json`) | Emails are only written to the log and `email-outbox/`. New players are **auto-verified**, so sign-up still works |
| `Brevo` (set in `render.yaml`) | Sent through Brevo's HTTPS API. Render's free plan blocks outgoing SMTP ports, which is why the API is used |
| `Smtp` | Sent through `Email__SmtpHost:Email__SmtpPort` |

Setup:
1. In Brevo, create an API key under **SMTP & API → API keys**, and verify a sender address or domain.
2. In Render, set `Email__BrevoApiKey=<BREVO_API_KEY>` and `Email__From=SkyCrash <<VERIFIED_SENDER_ADDRESS>>`.
3. Confirm `Email__FrontendBaseUrl` is the frontend origin.
4. Sign in as an admin, open **System Health** (`/admin/health`), and use **Send test email**. It reports Brevo's exact error if sending fails.
5. Optional: once email works, set `Security__LoginOtp=true` to require login codes.

> ⚠️ With `Email__Mode=Brevo` but **no valid key**, new players are **not** auto-verified. They can still sign up and play with the starter credits, but buying credits, the spin wheel and rewards wait until they verify an email that never arrives. Either configure Brevo properly or set `Email__Mode=Log`.

### 8.4 PayFast (sandbox purchases)

- `PayFast__Sandbox=true` and `PayFast__AllowLivePayments=false` are set in `render.yaml`. **Live payments stay blocked.** Do not change these for a university deployment.
- If the merchant ID and key are empty, the API uses PayFast's shared public sandbox merchant, so the demo works without a PayFast account.
- The return and cancel URLs use `PayFast__FrontendBaseUrl`. The server-to-server notify (ITN) URL uses `PayFast__ApiBaseUrl`, or Render's `RENDER_EXTERNAL_URL` if that is empty. Outside Development, **both must be `https://`**, or purchases stay off.
- Admins switch purchases on and off under **Admin → Payments** (`/admin/payments`). System Health shows whether PayFast is `configured`, `httpsOk` and `usable`.
- The CSP `form-action` already allows `sandbox.payfast.co.za` and `www.payfast.co.za`.

### 8.5 Gemini (optional AI insights)

- Set `Gemini__ApiKey`, and optionally `Gemini__BackupApiKey`, which is used if the first key is rejected or out of quota.
- The model is set by `Gemini__Model` and `Gemini__FallbackModel`. **`appsettings.json` sets `Model` to `gemini-2.5-flash`**, which overrides the code default, and `render.yaml` sets neither. Set both variables explicitly in Render to the models you have access to. System Health shows the models in use.
- With no key, the admin Feedback report uses a built-in keyword analyser instead.

### 8.6 Other outbound services (no configuration)

- **Have I Been Pwned** (`api.pwnedpasswords.com`): during sign-up, only the first five characters of the password's SHA-1 hash are sent. If the service is unreachable, registration is allowed (fail-open). Controlled by `Security__CheckBreachedPasswords`, which defaults to `true`.

---

## 9. Post-deployment verification checklist

Work through this checklist in order after every fresh deployment. Use a private browser window to avoid stale tokens.

### 9.1 Accessibility and API communication
- [ ] `https://<api-host>/health` returns `{"status":"healthy"}`. Allow up to about a minute on the first request.
- [ ] `https://<api-host>/api/health` shows `"databaseConnected": true`.
- [ ] `https://<frontend-host>/` loads the landing page with no red errors in the browser console (F12).
- [ ] In DevTools → **Network**, requests go to `https://<api-host>/api/...`, **not** `localhost` and not `undefined`. If they go elsewhere, see §10.2.
- [ ] No CORS or Content-Security-Policy errors appear in the console.
- [ ] Reloading a deep link such as `https://<frontend-host>/rules` shows the page instead of a 404, which proves the SPA rewrite works.

### 9.2 Registration and login
- [ ] Register a new player at `/register` with an adult date of birth. The account is created.
- [ ] A very common password, such as `password123`, is rejected by the breached-password check.
- [ ] Log out, then log in again **with the email address** and password.
- [ ] Five wrong passwords in a row lock that email out temporarily.
- [ ] If Brevo is configured, the verification email arrives and its link opens `/verify-email` on the production frontend.
- [ ] `/forgot-password` sends a reset email (only when email is configured).

### 9.3 Google authentication
- [ ] The Google button appears on `/login`.
- [ ] Signing in with a new Google account asks for date of birth and terms once, then signs in.
- [ ] Signing in again goes straight in, or asks for a login code if OTP is on.
- [ ] No `origin_mismatch` error appears in the popup. If it does, see §10.4.

### 9.4 Game functionality
- [ ] `/game` shows a countdown, then a flight with a rising multiplier, then a crash. This proves the SignalR connection works.
- [ ] DevTools → Network → **WS** shows an open connection to `/hubs/game`.
- [ ] Place a bet during the countdown. The balance drops by the stake.
- [ ] Cash out mid-flight. The payout is the stake times the multiplier, and the balance increases.
- [ ] A bet that is not cashed out is lost when the plane crashes.
- [ ] Auto cash-out triggers at the target multiplier.
- [ ] A finished round can be checked with **Verify round**, which confirms the provably fair crash point.

### 9.5 Multiplayer
- [ ] Two browsers with different players see the **same** round number and multiplier at the same time.
- [ ] Each player's bet appears in the other's live bets panel.
- [ ] Creating or joining a lobby from `/lobby` works, and lobby mates are listed.

### 9.6 Betting and balance
- [ ] A new player starts with the starter credits (500 by default).
- [ ] `/wallet` shows the credit transaction history, which matches the bets and payouts.
- [ ] A bet larger than the balance is refused with a clear message.
- [ ] If payments are switched on, buying a pack redirects to the PayFast **sandbox** and credits are added after returning.

### 9.7 Database persistence
- [ ] Note a player's balance. Then restart the API (**Render → skycrash-api → Manual Deploy → Restart service**, or wait for it to sleep) and sign in again. The balance and history are unchanged.
- [ ] `/history` still lists rounds from before the restart.

### 9.8 Admin dashboard
- [ ] Sign in as `newboi@skycrash.local` with the `SeedAdmin__Password` value from Render. The admin console at `/admin` opens.
- [ ] **System Health** (`/admin/health`) shows database `ok`, game `ok`, and the expected email, Google, payments and AI status.
- [ ] **Players** (`/admin/players`) lists the players you created. Adjusting a balance is reflected for that player.
- [ ] **Rounds** (`/admin/rounds`) shows the live round.
- [ ] **Reports** (`/admin/reports`) loads and exports.
- [ ] A normal player who opens `/admin` is refused.

### 9.9 Error handling
- [ ] Wrong login details show a friendly error, not a stack trace.
- [ ] An expired session (sign in, then wait longer than `Jwt__ExpiryMinutes`, or delete `skycrash_token` from Local Storage) sends you to `/login?expired=1`.
- [ ] When the API is asleep or down, the frontend shows a loading or error state instead of crashing, and SignalR reconnects once the API is back.

---

## 10. Troubleshooting

### 10.1 Database connection failures

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/health` → `databaseConnected: false`, or the service crashes on start with an Npgsql error | `DATABASE_URL` missing or wrong; database suspended or **expired** (free plan, 30 days) | Check **Render → skycrash-db** status. Check that `DATABASE_URL` on the service is linked to the database. Upgrade an expired or expiring database |
| `password authentication failed` from your own computer | Using the internal URL from outside Render | Use the **External** Database URL |
| SSL errors when connecting from outside | Client requires or refuses TLS | `DatabaseUrl.cs` uses `SslMode=Prefer`. For `psql`, use the external URL as given |
| Tests fail with `connection refused` on `localhost:5433` | No local test database | Start one (Appendix B) |

### 10.2 Incorrect environment variables

| Symptom | Cause | Fix |
|---|---|---|
| Browser calls `http://localhost:5001/api/...` or `undefined/...` | `VITE_*` not set for the environment that was built | `vercel env ls`. Add the variables, then **rebuild** with `vercel --prod` (Vite reads them only at build time) |
| Every login fails with HTTP 500; the log shows `ArgumentNullException` for the key, or `IDX10720`/`IDX10653` about key size | `Jwt__Key` missing or shorter than 32 bytes | Set a long random `Jwt__Key` |
| The admin `NewBoi` cannot sign in | `SeedAdmin__Password` was empty on first start, so no account was created; or the password was changed in Render after creation | Set the password and restart. If the account exists already, reset its password in the app (§6.3) |
| Values seem ignored | Single underscore used, or wrong case for the section name | Use `Section__Key`, for example `Security__GoogleClientId` |

### 10.3 CORS errors

Message: *"Access to XMLHttpRequest … has been blocked by CORS policy"*, or the SignalR negotiation fails.

1. `Cors__AllowedOrigins__0` must exactly match the browser's origin: scheme plus host, **no path, no trailing slash**. Examples: `https://skycrash-frontend.vercel.app` works; `https://skycrash-frontend.vercel.app/` or `http://…` does not.
2. Preview URLs such as `https://skycrash-frontend-<hash>-iron-wings.vercel.app` are different origins. Add them as `Cors__AllowedOrigins__1`, `__2`, …
3. The policy uses `AllowCredentials()`, so a wildcard `*` origin is **not** allowed.
4. Save the variable in Render and wait for the redeploy to finish before testing again.

A **CSP** error (*"Refused to connect to … because it violates the Content Security Policy"*) is different: the frontend's `vercel.json` must allow the API host (§7.6).

### 10.4 Authentication failures

| Symptom | Fix |
|---|---|
| No Google button | `Security__GoogleClientId` is empty on the API. Check `/api/settings/public` |
| Google popup: `Error 400: origin_mismatch` | Add the exact frontend origin to **Authorised JavaScript origins**. Changes can take a few minutes to apply |
| Google popup: *access blocked / app not verified*, or only some users can sign in | The OAuth consent screen is in Testing mode. Add test users or publish the app |
| `POST /api/auth/google` → 401 "Google sign-in failed" | The token's audience doesn't match `Security__GoogleClientId` (the client ID was copied from a different OAuth client), or the Google email is not verified |
| `POST /api/auth/google` → 503 | Google sign-in isn't configured on the API |
| Login asks for a code that never arrives | `Security__LoginOtp=true` but email isn't delivered. Fix Brevo (§8.3) or set `Security__LoginOtp=false` |
| "Too many attempts" | Lockout is active. Wait 15 minutes (`Security__LockoutMinutes`) |
| Logged out right after signing in, or 401s on every call | `Jwt__Key` changed between token issue and use (redeploy with a new key), or the system clock is skewed. Sign in again |

### 10.5 Frontend/backend communication

| Symptom | Fix |
|---|---|
| First page load hangs for 30–60 s | The free Render service was asleep. This is expected; later requests are fast |
| REST works but the game never starts (no WebSocket) | Check `VITE_SIGNALR_HUB_URL` ends in `/hubs/game`. Check the CSP allows `wss://<api-host>`. Check CORS |
| Mixed-content errors | All API URLs must be `https://` when the frontend is served over HTTPS |
| Requests hit the old Railway API | Rebuild the frontend after changing `VITE_*`. Check the bundle with DevTools → Sources |

### 10.6 Failed builds

| Where | Symptom | Fix |
|---|---|---|
| Vercel | `vue-tsc` type errors | Run `npm run build` locally, fix the errors, then redeploy |
| Vercel / CI | `npm ci` → *Missing: @emnapi/… from lock file* | See §7.4. Run `npm install` and commit `package-lock.json` |
| Vercel | "Not authorized" or the wrong project | Run `vercel link --yes --project skycrash-frontend` again and check you are in the right team (`vercel teams ls`) |
| Render | Docker build fails at `dotnet restore` or `publish` | Build locally from `skycrash-backend/` with `dotnet build SkyCrash.slnx -c Release` and fix the errors. Check that `render.yaml` points to `./skycrash-backend/Dockerfile` |
| Render | Deploy fails its health check | The app crashed on start. Read **Logs** (usually a migration or configuration error) |

### 10.7 Migration errors

| Symptom | Fix |
|---|---|
| Start-up fails in `MigrateAsync` with "relation … already exists" | The database has tables that EF did not create (for example, someone ran the old SQL files). Use a fresh database, or reconcile `__EFMigrationsHistory` carefully after a backup |
| `dotnet ef` cannot find the DbContext | Run from `skycrash-backend/` with `--project src/SkyCrash.Infrastructure --startup-project src/SkyCrash.Api` |
| `dotnet ef` version mismatch | Run `dotnet tool restore` so the pinned 10.0.9 is used |
| A migration fails halfway | Read the error in the Render logs. Fix it in a **new** migration; never edit one that has already been applied in production |

### 10.8 Hosting configuration issues

| Symptom | Fix |
|---|---|
| Deep links return Vercel 404 | `vercel.json` must be at the frontend root, with its rewrite to `/index.html` |
| Render deploys old code | Render builds the **deploy repo's** `main`, not `Muz1/SkyCrash-Backend`. Push to it (§11.1) |
| Database data vanished | Free database expired, or it was recreated by deleting and re-applying the Blueprint. Restore from your last `pg_dump` |
| Emails not delivered on Render with `Smtp` | Render's free plan blocks SMTP ports. Use `Email__Mode=Brevo` |

---

## 11. Deployment maintenance

### 11.1 Deploy future updates

**Backend (Render)**
1. Commit and push to the backend's live branch.

   **Directory:** `SkyCrash-Backend/`
   ```bash
   git push origin Muzi
   ```
2. Push the same commit to the deploy repository that Render watches. Render **auto-deploys on commit**.

   **Directory:** `SkyCrash-Backend/`
   ```bash
   git push https://github.com/anjalisebastianstw-dot/SkyCrash-Backend-deploy.git origin/Muzi:main
   ```
3. Watch **Render → skycrash-api → Events/Logs** until the deploy is **Live**, then run the checks in §6.6.

**Frontend (Vercel)**

**Directory:** `SkyCrash-Frontend/` (branch `release/panel`)
```bash
git pull
npm install && npm run build      # optional local check
vercel --prod
git push origin release/panel
```

**Order matters** when a change spans both parts. Deploy the **backend first** when the frontend depends on new API endpoints. Deploy the frontend first only when removing something the backend still serves.

### 11.2 Manage environment variables securely

- **Backend secrets** live only in **Render → skycrash-api → Environment**. **Frontend variables** live in **Vercel → Settings → Environment Variables** and are public once built.
- Never put real values in `appsettings.json`, `render.yaml` or `.env.example`. These files are committed. `appsettings.Development.json`, `.env` and `.env.local` are git-ignored for local secrets.
- Use `generateValue: true` in `render.yaml` for new secrets that Render can create.
- Limit Render and Vercel team membership to people who need it. Remove access when team members leave.
- If a secret leaks, rotate it at the provider (Brevo, Google, Gemini, PayFast), update Render, and let it redeploy.

### 11.3 Apply future database migrations

1. Create the migration locally against a development database.

   **Directory:** `SkyCrash-Backend/skycrash-backend/`
   ```bash
   dotnet tool restore
   dotnet ef migrations add <DescriptiveName> --project src/SkyCrash.Infrastructure --startup-project src/SkyCrash.Api
   ```
2. Review the generated files in `src/SkyCrash.Infrastructure/Migrations/`. Commit them together with the model change.
3. Run the test suite (Appendix B). It applies every migration to a test database.
4. ⚠️ **Back up production first.**

   **Directory:** any (the `pg_dump` major version must be at least the server's)
   ```bash
   pg_dump '<EXTERNAL_DATABASE_URL_FROM_RENDER>' -Fc -f skycrash-$(date +%Y%m%d).dump
   ```
5. Deploy the backend (§11.1). `Database__MigrateOnStartup=true` applies the migration on start.
6. Verify the latest migration ID (§5.5).

Prefer **additive** changes, such as new nullable columns or new tables. Then the previous code version keeps working if you have to roll back.

### 11.4 Monitor application health

| Check | Where |
|---|---|
| Process alive | `GET /health`, which Render also uses as its health check |
| Database reachable | `GET /api/health` |
| Full status: database, round engine, players online, payments, AI, email, OTP, Google, build version | Admin console → **System Health** (`/admin/health`) |
| Live logs (Serilog to console) | **Render → skycrash-api → Logs** |
| Deploy history | **Render → Events**, `vercel ls` |
| Database size and status | **Render → skycrash-db** |

Note that free Render services sleep, so the round engine stops between visits. That is expected for this tier.

### 11.5 Investigate production errors

1. Reproduce the error in the browser with DevTools open. Note the failing request's URL, status code and response body.
2. Match the time to **Render → Logs**. Each request is logged by `UseSerilogRequestLogging`, with exceptions and stack traces.
3. Check **System Health** for a component reporting `down` or `off`.
4. For configuration problems, compare the Render and Vercel variables against Appendix A.
5. For data problems, query the database read-only with `psql` and the external URL. Avoid writes in production.

### 11.6 Roll back a problematic deployment

**Frontend (Vercel):** each deployment is immutable, so rolling back is instant.

**Directory:** `SkyCrash-Frontend/`
```bash
vercel ls                          # find the last good production deployment URL
vercel rollback <DEPLOYMENT_URL>   # or Vercel dashboard → Deployments → ⋯ → Instant Rollback
```

**Backend (Render):** open **Render → skycrash-api → Events**, find the last good deploy, and choose **Rollback**. Alternatively, revert the commit and push it to the deploy repo.

> ⚠️ **Database caution:** rolling back code does **not** roll back migrations. Additive migrations are usually safe with older code. To undo a migration, run `dotnet ef database update <PreviousMigrationName> --project src/SkyCrash.Infrastructure --startup-project src/SkyCrash.Api` with `DATABASE_URL` pointing at production. This **can delete data**, so back up first and only do it if you understand the migration's `Down()` method. To restore a full backup: `pg_restore --clean --no-owner -d '<EXTERNAL_DATABASE_URL_FROM_RENDER>' <backup.dump>`. This overwrites production data.

---

## 12. Items that need confirmation

These points could not be verified from the code or the command-line tools available. Confirm each one in the relevant dashboard.

| # | Item | Why it matters | Where to check |
|---|---|---|---|
| 1 | **Creation and expiry date of the Render free database** `skycrash-db` | Data is lost when it expires (30 days on the free plan) | Render → skycrash-db |
| 2 | Whether `Email__BrevoApiKey` and `Email__From` are set on the live service | Without them, email verification can't complete (§8.3) | Render → Environment, or `/admin/health` → email + **Send test email** |
| 3 | The Gemini model values in use (`Gemini__Model`, `Gemini__FallbackModel`) | `appsettings.json` defaults to `gemini-2.5-flash` | `/admin/health` → AI |
| 4 | Google OAuth consent screen status (Testing or In production) and the authorised origins listed | Decides who can use Google Sign-In | Google Cloud Console |
| 5 | Who owns the Google Cloud project, the Brevo account and the Render workspace | Needed to hand over the deployment | Each provider |
| 6 | Whether the old Railway project (`skycrash`, services `skycrash-api` and `skycrash-web`) is still running | It costs money or credits and holds an old copy of the data; the live site no longer uses it | Railway dashboard |
| 7 | Whether the Vercel project has Git integration connected | This guide assumes CLI deploys only. If Git is connected, pushes may also trigger builds | Vercel → Settings → Git |
| 8 | PostgreSQL major version on Render | Needed to choose a matching `pg_dump` | Render → skycrash-db |
| 9 | Whether `DemoSeed__Enabled` should stay `true` after the presentation | Demo accounts with generated passwords exist in production | Render → Environment |

**Known issues found during verification:**
- `npm ci` fails because `package-lock.json` is out of sync, so the frontend GitHub Actions workflow fails (§7.4).
- `skycrash-backend/README.md` and the `SkyCrash-Database` READMEs are template text. They mention npm commands that do not apply. Use this guide instead.
- `SkyCrash-Frontend/.env.example` points at `http://localhost:5001`, which is the Docker Compose port, but `dotnet run` serves the API on `http://localhost:5149`. Adjust it for local runs (Appendix B).

---

## Appendix A: Environment variable reference

### A.1 Backend (Render service `skycrash-api`)

| Variable | Required | `render.yaml` value | Default when unset | Purpose |
|---|---|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Yes | `Production` | `Production` | Environment name |
| `PORT` | Yes (Render) | `8080` | — | Container port |
| `DATABASE_URL` | Yes* | from database | — | PostgreSQL URL (*or `ConnectionStrings__DefaultConnection`) |
| `ConnectionStrings__DefaultConnection` | Alt. | — | — | Npgsql connection string, used when `DATABASE_URL` is empty |
| `Database__MigrateOnStartup` | Yes | `true` | `false` | Apply EF migrations on start |
| `Jwt__Key` | **Yes** | generated | none, so auth fails | JWT signing key, 32+ chars |
| `Jwt__Issuer` | Yes | `SkyCrash.Api` | — | |
| `Jwt__Audience` | Yes | `SkyCrash.Client` | — | |
| `Jwt__ExpiryMinutes` | Yes | `60` | — | Token lifetime |
| `Cors__AllowedOrigins__0` (`__1`, …) | Yes | frontend URL | `http://localhost:5173` | Allowed browser origins |
| `SeedAdmin__Password` | Recommended | generated | no admin created | Password for `newboi@skycrash.local` |
| `Security__LoginOtp` | No | `false` | `true` (forced off without real email) | Emailed login code |
| `Security__GoogleClientId` | No | prompt | empty = off | Google Sign-In |
| `Security__CheckBreachedPasswords` | No | — | `true` | HIBP check |
| `Email__Mode` | No | `Brevo` | `Log` | `Log`, `Smtp` or `Brevo` |
| `Email__BrevoApiKey` | With Brevo | prompt | — | Brevo API key |
| `Email__From` | With Brevo/Smtp | prompt | `SkyCrash <no-reply@skycrash.local>` | Verified sender |
| `Email__SmtpHost` / `__SmtpPort` / `__SmtpUseSsl` / `__SmtpUser` / `__SmtpPassword` | With Smtp | prompt / `587` / `true` | `localhost` / `1025` | SMTP |
| `Email__FrontendBaseUrl` | Yes | frontend URL | `http://localhost:5173` | Base for email links |
| `Gemini__ApiKey` / `Gemini__BackupApiKey` | No | prompt | off | AI insights |
| `Gemini__Model` / `Gemini__FallbackModel` | No | — | `gemini-2.5-flash` (appsettings) / `gemini-3.5-flash-lite` | Model names |
| `DemoSeed__Enabled` | No | `true` | `false` | Create demo accounts |
| `DemoSeed__PlayerPassword` / `DemoSeed__AdminPassword` | With demo | generated | — | Demo account passwords |
| `PayFast__Sandbox` | Yes | `true` | `true` | Sandbox gateway |
| `PayFast__AllowLivePayments` | Yes | `false` | `false` | Keep `false` |
| `PayFast__MerchantId` / `__MerchantKey` / `__PassPhrase` | No | prompt | public sandbox merchant | Merchant credentials |
| `PayFast__FrontendBaseUrl` | Yes for payments | frontend URL | — | Return and cancel URLs (https) |
| `PayFast__ApiBaseUrl` | No | prompt | `RENDER_EXTERNAL_URL` | Notify URL (https) |
| `GameLimits__*` | No | — | `appsettings.json` | Risk limits. Read `skycrash-backend/docs/ECONOMY_CAPS.md` before changing |

### A.2 Frontend (Vercel project, Production environment)

| Variable | Required | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | `https://skycrash-api.onrender.com/api` |
| `VITE_SIGNALR_HUB_URL` | Yes | `https://skycrash-api.onrender.com/hubs/game` |
| `VITE_API_HOST` | No (alternative to both above) | `skycrash-api.onrender.com` |

---

## Appendix B: Running locally before deploying

Use this to test changes before they reach production. It is not needed for deployment itself.

1. **Start PostgreSQL.** The backend tests expect `localhost:5433`, database `skycrash_test`, and the user and password written in `src/SkyCrash.Api.Tests/TestDbContextFactory.cs` (also used in `.github/workflows/backend-ci.yml`).

   **Directory:** any
   ```bash
   docker run -d --name skycrash-postgres -p 5433:5432 \
     -e POSTGRES_USER=skycrash_user \
     -e POSTGRES_PASSWORD='<PASSWORD_FROM_TestDbContextFactory.cs>' \
     -e POSTGRES_DB=skycrash_test \
     postgres:17
   ```
2. **Build and test the backend.** These are the same commands CI runs.

   **Directory:** `SkyCrash-Backend/skycrash-backend/`
   ```bash
   dotnet restore SkyCrash.slnx
   dotnet build SkyCrash.slnx --no-restore --configuration Release
   dotnet test SkyCrash.slnx --no-build --configuration Release
   ```
3. **Run the API.** Create a git-ignored `src/SkyCrash.Api/appsettings.Development.json`, or set environment variables, with at least:
   ```json
   {
     "ConnectionStrings": { "DefaultConnection": "Host=localhost;Port=5433;Database=skycrash;Username=skycrash_user;Password=<LOCAL_PASSWORD>" },
     "Jwt": { "Key": "<LOCAL_RANDOM_32+_CHARS>", "Issuer": "SkyCrash.Api", "Audience": "SkyCrash.Client", "ExpiryMinutes": 60 },
     "SeedAdmin": { "Password": "<LOCAL_ADMIN_PASSWORD>" },
     "Database": { "MigrateOnStartup": true }
   }
   ```
   **Directory:** `SkyCrash-Backend/skycrash-backend/`
   ```bash
   dotnet run --project src/SkyCrash.Api --launch-profile http     # http://localhost:5149, Swagger at /swagger
   ```
   In Development, email mode `Log` writes emails and login codes to `email-outbox/`.
4. **Run the frontend** against it. Create a git-ignored `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:5149/api
   VITE_SIGNALR_HUB_URL=http://localhost:5149/hubs/game
   ```
   **Directory:** `SkyCrash-Frontend/`
   ```bash
   npm install
   npm run dev          # http://localhost:5173 (the default allowed CORS origin)
   ```

The frontend also ships a `Dockerfile` and an nginx template that proxy `/api` and `/hubs` to an API container. These files support a self-hosted Docker setup and are **not** used by the Vercel deployment.

---

## Appendix C: Official documentation

- Render Blueprints (`render.yaml`): https://render.com/docs/blueprint-spec
- Render environment variables: https://render.com/docs/configure-environment-variables
- Render PostgreSQL: https://render.com/docs/postgresql
- Render free tier limits: https://render.com/docs/free
- Render rollbacks: https://render.com/docs/rollbacks
- Vercel CLI: https://vercel.com/docs/cli
- Vercel environment variables: https://vercel.com/docs/projects/environment-variables
- Vercel `vercel.json`: https://vercel.com/docs/project-configuration
- Vercel Instant Rollback: https://vercel.com/docs/instant-rollback
- Vite environment variables: https://vite.dev/guide/env-and-mode
- ASP.NET Core configuration (`__` separator): https://learn.microsoft.com/aspnet/core/fundamentals/configuration/
- EF Core migrations: https://learn.microsoft.com/ef/core/managing-schemas/migrations/
- ASP.NET Core SignalR: https://learn.microsoft.com/aspnet/core/signalr/introduction
- Google Identity Services (Sign in with Google): https://developers.google.com/identity/gsi/web/guides/overview
- Google OAuth client setup: https://support.google.com/cloud/answer/6158849
- Brevo API keys: https://help.brevo.com/hc/en-us/articles/209467485
- PayFast developer docs: https://developers.payfast.co.za/docs
- Gemini API: https://ai.google.dev/gemini-api/docs
