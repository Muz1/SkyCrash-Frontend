# SCRIPT_INFO_PT3: presentation fact-check (Iron Wings · SkyCrash · INF3003W)

Checked on 2026-10-02. Everything here was read from **committed code at HEAD** using `git show HEAD:<path>` and `git grep … HEAD`. Uncommitted changes in the working trees were ignored. Line numbers are from the HEAD versions.

---

## 1. Branches and commits checked

| Repo | Branch | HEAD | Notes |
|---|---|---|---|
| Frontend (`SkyCrash-Frontend`) | `muzi-integration` (= `origin/Muzi`) | `54f6a58` 2026-10-02 "prompt feedback + sound" | `main` is 12 commits behind, at `3b9d932` |
| Backend (`SkyCrash-Backend-1`, code under `skycrash-backend/`) | `muzi-integration` | `dcfc122` 2026-10-02 "added changes to admin analytics controller + reporting class" | |
| Database (`SkyCrash-Database`) | `anji` (= `main` = `origin/main`) | `685bdcd` 2026-09-23 "Merge branch 'main' of …/SkyCrash-Database" | `origin/Muzi` ("Logging" line) is **not** in HEAD |

The backend paths below are relative to `skycrash-backend/src/`. The frontend paths are relative to the repo root.

---

## 2. Claim verification

Verdicts: **[C]** Confirmed · **[W]** Wrong → correct value · **[NF]** Not found · **[~]** Approximately right · **[A]** factual answer to a question.

| # | Claim | Verdict | Correct value / detail | File:lines |
|---|---|---|---|---|
| 1 | Crash point = (1 − edge)/(1 − rng) | **[C]** | `var raw = (1 - houseEdge) / (1 - r);`. The maths runs in **double**, not decimal. | `SkyCrash.Infrastructure/GameEngine/CrashPointCalculator.cs:36` (`r` at 29, edge cast at 19) |
| 2 | rng < edge → instant 1.00× | **[C]** | `if (r < houseEdge) { return 1.00m; }` is a strict `<`. **Note:** values of r from 0.01 up to about 0.0198 also floor to 1.00, so P(crash = 1.00×) ≈ **1.98%**, not 1%. | `CrashPointCalculator.cs:31-34` |
| 3 | Floored to 2 dp, capped at max (1,000,000) | **[C]** | `Math.Floor(raw * 100) / 100.0` then `Math.Min((decimal)crashPoint, maxMultiplier)`. The default cap is 1,000,000. | `CrashPointCalculator.cs:37-39`; `SkyCrash.Domain/Entities/GameSetting.cs:11`; `GameEngine/GameSettingsCache.cs:13` |
| 4 | rng = HMAC-SHA256(serverSeed, roundId), first 52 bits / 2^52 | **[C]** | The key is the UTF-8 bytes of `serverSeed` (a 32-hex `Guid.NewGuid().ToString("N")`). The message is the UTF-8 bytes of `round.Id.ToString()`. The hash goes to hex and the first **13 hex characters** (52 bits, big-endian) are parsed with `Convert.ToUInt64(…,16)`, then divided by `Math.Pow(2,52)`. | `CrashPointCalculator.cs:22-29`; `RoundEngineService.cs:77,106` |
| 5 | Default edge 1% → RTP 99% | **[C]** | `HouseEdge = 0.01m`. It is not set in appsettings. Admins can set 0–50%. | `Domain/Entities/GameSetting.cs:10`; `GameSettingsCache.cs:12`; `Api/Controllers/RtpController.cs:30-31`; `GameSettingsService.cs:27` |
| 6 | P(crash ≥ m) = (1−edge)/m → 99% at every cash-out | **[~]** | Approximately right. See the working below the table. | `RoundEngineService.cs:132,143,207,213`; `BetSettlementService.cs:47`; `Api/Hubs/GameHub.cs:33` |
| 7 | Growth e^(0.06·t), tick 100 ms | **[C]** | `MultiplierGrowthRate = 0.06`; `TickIntervalMs = 100`. Each tick is **rounded** to 2 dp, not floored. The frontend mirrors it (`GROWTH = 0.06`). | `Domain/Common/GameEngineConstants.cs:8`; `RoundEngineService.cs:21,131`; FE `src/composables/useFlightClock.ts:9,14` |
| 8 | 0.50→1.98, 0.75→3.96, 0.90→9.90, 0.99→99.00 | **[W]** | The first three are correct. **rng 0.99 gives 98.99×**: in double, raw = 98.99999999999991, which floors to 98.99. Recomputed in Python with IEEE doubles. | `CrashPointCalculator.cs:36-37` |
| 9 | SHA-256 hash published before the round, seed revealed at crash | **[C]** | The hash goes out with `RoundWaiting` (before betting). The seed goes out with `RoundCrashed`. | `RoundEngineService.cs:77-78, 95-101, 183-189, 256-260` |
| 10 | Partial cash-out | **[NF]** | **Absent on every branch** of both repos. `CashOut()` takes no parameters, and the FE calls `invoke('CashOut')` with no arguments. | `Api/Hubs/GameHub.cs:263`; FE `src/services/gameService.ts:9` |
| 11 | Squadron pooling (shared bonus) | **[NF]** | **Absent on every branch.** "Squadron" is only the UI title of a private lobby. | FE `src/views/LobbyView.vue:128,220` |
| 12 | Aircraft skins; "Millennium Falcon" still there? | **[C]** | 5 aircraft: Neon Jet, Ascender, Night Hawk, **Millennium Falcon** (still the name), Portal Traveler | `Domain/Common/LoadoutCatalog.cs:7`; FE `src/lib/craft.ts:38-79` |
| 13 | Sky themes; Cape Town/Jo'burg/Durban? | **[C]** | 8 skies: Sunset Runway, Cloud City, **Cape Town, Johannesburg, Durban**, Midnight, Deep Space, Taking Off. "Taking Off" reuses the Sunset Runway image, so there are 7 distinct images. | `LoadoutCatalog.cs:10`; FE `src/lib/skins.ts:33-97` (reuse at 93) |
| 14 | Achievements; "Maybe Take a Break"? | **[C]** | **6** achievements: Cleared for Takeoff (play 10), **Maybe Take a Break (lose 100 rounds)**, Frequent Flyer (play 1,000), Veteran Pilot (cash out 1,000), Sky Legend (cash out ≥ 100×), Close Call (cash out within 1 s of the crash). The code comment wrongly says "5". | `Application/Models/AchievementCatalog.cs:16-21` (comment at 5); `PlayerProgressService.cs:154,158` |
| 15 | Daily missions per day / templates | **[C]** | **3 per day** (tracks Endurance, Skill, Wallet & Wingmen; rotate daily on the UTC date). **32 templates.** | `Domain/Common/ChallengeCatalog.cs:13,15`; `Infrastructure/Persistence/ChallengeDefinitionSeed.cs:17-49` |
| 16 | "How to Play" guide beyond 3 "How the flight works" steps | **[W]** | The Home heading is **"How to play"**; "How the flight works" does not appear at HEAD. Its 3 steps: *1 Bet*, "Place your bet before the plane takes off." *2 Watch it climb*, "The multiplier rises the higher the plane flies." *3 Cash out*, "Bank your winnings before the plane crashes." The only other guide is a dismissible one-liner on the game screen: "Bet → watch the multiplier climb → cash out before the plane crashes". **No longer guide exists.** | FE `src/components/sky/HowToPlay.vue:18-20,56-59,76`; `src/views/GameView.vue:243` |
| 17 | Players can see seed hash / revealed seed | **[W]** | **No.** The store keeps both (`lastRevealedSeed`) but no player page shows them. Only the admin page `/admin/rounds` shows the **hash**. Player round history doesn't return the seed. | FE `src/stores/gameStore.ts:10,14,113`; `src/views/AdminCurrentRoundView.vue:70-77`; BE `Application/DTOs/RoundHistoryResponse.cs:5-8` |
| 18 | Invite codes: 6 chars, no 0/O/1/I | **[C]** | `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` (32 characters), length 6. Codes come from `Random.Shared`, which is not cryptographic. | `Infrastructure/Services/LobbyService.cs:12-13,226` |
| 19 | Auto cash-out min 1.01×; bets can be queued | **[C]** | `MinAutoCashoutTarget = 1.01m`. Queuing is **client-side only**: the browser fires the bet when the phase becomes Waiting. The server rejects bets outside Waiting, so a queued bet is lost if the tab is closed. | `Api/Hubs/GameHub.cs:33,184-206`; FE `src/views/GameView.vue:70,119-120,148-155` |
| 20 | Start at 0 credits; demo top-up +1,000 / 5 min | **[W]** | Starting at 0 is correct. The **demo top-up has been removed** from backend HEAD and replaced by the **credit spin wheel** (5-minute cooldown, 8 segments 50/100/250/75/500/100/1000/150, expected value ≈ 278). **The FE at HEAD still shows "+1,000 Add Demo Credits"**, and that button calls a removed endpoint (it will fail live). The FE also says "up to 2,000"; the real maximum is 1,000. | `Api/Controllers/AuthController.cs:76`; `Api/Controllers/WalletController.cs:76,80-81`; FE `src/views/WalletView.vue:73-81,90`; `src/services/walletService.ts:15` |
| 21 | Leaderboards: wins, multipliers, active; top 10 | **[C]** | `TopN = 10`. "Most active" counts bets placed. Results are cached for 30 s. | `Api/Controllers/LeaderboardController.cs:16,18,37-77` |
| 22 | Password rules | **[C]** | At least 8 characters, 1 uppercase, 1 digit. There is no lowercase or symbol rule, and the rules are enforced only on the server. | `Application/Validators/RegisterRequestValidator.cs:20-24` |
| 23 | ASP.NET Identity PasswordHasher; algorithm and iterations | **[C]** (inferred) | `PasswordHasher<User>` comes from the `Microsoft.AspNetCore.App` shared framework on **net10.0**, and `PasswordHasherOptions` is never set. So the defaults apply: Identity V3, **PBKDF2-HMAC-SHA512, 100,000 iterations**. That is the framework default since .NET 7; no line of code states it. | `Api/Controllers/AuthController.cs:22,79,116`; `Api/SkyCrash.Api.csproj:1,4` |
| 24 | Generic login error | **[C]** | `"Invalid email or password."` for both an unknown email and a wrong password. A blocked account gets a different 403, but only after the correct password. | `AuthController.cs:113,121,124-128` |
| 25 | JWT 60 min; issuer/audience/lifetime/key validated | **[C]** | All four `Validate* = true`; `ExpiryMinutes: 60`. **The JWT settings exist only in `appsettings.Development.json`** (and the `.example` file), and the dev key is committed. ClockSkew is the default 5 minutes. | `Api/Program.cs:91,100-109`; `Api/appsettings.Development.json:5-10`; `Infrastructure/Auth/JwtTokenGenerator.cs:26,44` |
| 26 | Login rate limiting / lockout | **[C]** none | No RateLimit, Lockout or AccessFailed anywhere. Failed logins are only logged. | `AuthController.cs:119` |
| 27 | Breached/common-password check | **[C]** none | Nothing found. | — |
| 28 | AdjustBalanceRequestValidator wired into AdminController | **[C]** yes | It is injected and called manually. There is no auto-validation. | `Api/Controllers/AdminController.cs:26,35,43,193-198`; `Program.cs:163` |
| 29 | Blocked → rejected next request + live kick over SignalR | **[C]** | `NotBlockedRequirement` is on every policy and checked against the DB on every request (the handler is **`AccountAuthorizationHandler`**; there is no `NotBlockedAuthorizationHandler` class). Admins send `AccountBlocked` over SignalR and the client logs out. The server does not drop the socket itself, but every hub action re-checks `IsBlocked`. | `Program.cs:137-158`; `Api/Authorization/AccountAuthorizationHandler.cs:37-49,82-89`; `AdminController.cs:134-141`; FE `src/composables/useSignalRConnection.ts:137-145`; `GameHub.cs:178-181` |
| 30 | House-edge change needs the admin password | **[C]** | `VerifyHashedPassword(...)`, which returns 401 "Incorrect password." on failure. **Bug:** the FE treats that 401 as an expired session and logs the admin out. | `Api/Controllers/AdminSettingsController.cs:46-63`; FE `src/services/api.ts:23-35` |
| 31 | Player Management search/filter/sort | **[A]** | See §5 | `src/views/AdminView.vue:63-107`; `AdminController.cs:46-113` |
| 32 | Add/edit/delete actions | **[A]** | See §5 | — |
| 33 | No delete endpoints; block not delete | **[C]** | No `HttpDelete`/`MapDelete` in BE and no `api.delete` in FE. Block and unblock flip `IsBlocked`. | `AdminController.cs:127,152` |
| 34 | Which admin pages have Export PDF | **[A]** | 5 pages: Player Management, Reports, Operations, RTP, Volatility | see §5 |
| 35 | Exact validation messages | **[A]** | See §5 | — |
| 36 | Test counts | **[A]** | **Backend:** 70 `[Fact]` + 2 `[Theory]` (7 cases) = **72 methods / 77 executed cases**. **Frontend:** **13 tests in 4 files**. Per file in §8. | `SkyCrash.Api.Tests/*`; FE `src/**/*.spec.ts` |
| 37 | Do the tests pass? | **[W] backend at HEAD** | **Frontend:** 13/13 pass (`npx vitest run` on a clean export of HEAD). **Backend:** at HEAD, **35 pass / 42 fail** (`dotnet test` on a clean export of HEAD, Postgres on 5433). The cause is that the committed model has changes whose EF migration (`20261002105258_AddLoadoutInvitesAndReportSettings`) is **not committed**, so EF raises `PendingModelChangesWarning` and every DB-backed test fails. With the uncommitted migration present, all 77 pass. **Commit the migration before the demo.** | `SkyCrash.Infrastructure/Migrations/` (missing file) |
| 38 | CI per repo | **[A]** | **Only the frontend has CI that runs.** The backend and DB workflow files are nested one folder down (`skycrash-backend/.github/…`, `skycrash-database/.github/…`), so GitHub never runs them. The backend one is also a Node template that never builds .NET. | FE `.github/workflows/ci.yml` |
| 39 | Anji retro branch merged with Muzi? | **[A]** **not merged** | `origin/Anji` is not an ancestor of HEAD (8 ahead / 33 behind). The retro look reached HEAD as a **re-port**, `3b9d932` "Port Lovable neon-arcade redesign onto the working Vue app" (2026-09-16). **The current UI is on `muzi-integration` (= `origin/Muzi`).** | `git merge-base --is-ancestor origin/Anji HEAD` → false |
| 40 | First/last commit dates | **[A]** | **FE:** 2026-06-18 → 2026-10-02. **BE:** 2026-06-18 → 2026-10-02. **DB:** 2026-06-18 → 2026-09-23. Full commit lists in §8. | `git log` |

### Working for #6 (is it "99% at every cash-out point"?)

- **Win probability.** rng is uniform on [0,1). For a target m with 2 decimals and m ≥ 1.01, `floor2(X) ≥ m` exactly when `X ≥ m`. That means `0.99/(1−r) ≥ m`, so `r ≥ 1 − 0.99/m`. The bound is always above 0.01, so the instant-crash rule never decides a win. That gives **P(win) = 0.99/m** and **expected return = m × 0.99/m = 0.99**. The 2-dp floor doesn't change this, because the target already has 2 dp.
- **Why it's only *approximately* 99%:**
  1. **Auto cash-outs pay the tick value, not the target.** The check is `b.AutoCashoutTarget <= currentMultiplier` (`RoundEngineService.cs:207`), and the payout is `Amount × currentMultiplier` (`BetSettlementService.cs:47`). With 100 ms ticks, the multiplier can be past the target when it's checked, so auto RTP comes out at about 99% or **slightly above**.
  2. **A target equal to the crash point wins**, because the last tick is clamped to the crash point (`:132`) before auto cash-outs run (`:143`).
  3. **Floating-point edge cases** (like 98.99 for rng 0.99) shave a hair off.
  4. **There is no 1.00× auto target** (the minimum is 1.01). A *manual* cash-out in the first 100 ms of a non-instant round returns 1.00×, which is 100%.
- **What to say:** "Theoretical RTP is 99% at any fixed cash-out target; in practice it's very close to that."

---

## 3. Corrections the slides need

| # | Replace with (presenter wording) |
|---|---|
| 2 | "If the random number is below the house edge, the plane crashes instantly at 1.00×. Counting the rounds that floor down to 1.00, about **2% of rounds end at 1.00×**." (Keep "instant crash when rng < edge" as the rule.) |
| 6 | "At a 1% edge, the **theoretical** return is 99% at any fixed cash-out target. Real payouts land very close to that: auto cash-outs pay at the tick they trigger on, which can be a little above the target." |
| 8 | "rng 0.50 → **1.98×**, 0.75 → **3.96×**, 0.90 → **9.90×**, 0.99 → **98.99×**: the floor plus floating-point error takes it just under 99." (Or swap in rng 0.98 → 49.50×.) |
| 10 | Remove partial cash-out, or say: "Partial cash-out is **future work**. Today a cash-out always settles the whole bet." |
| 11 | Remove squadron pooling, or say: "Squadrons are **private lobbies** with a 6-character invite code. Pooled squadron bonuses are **future work**." |
| 14 | "There are **six** achievements", and name all six (see #14). |
| 16 | "The home page has a three-step **'How to play'**: Bet, Watch it climb, Cash out. The game screen repeats it as a one-line hint." Don't promise a full guide. |
| 17 | "Each round's seed hash is published before betting and the seed is revealed at the crash, over SignalR. **Players can't see these in the UI yet; only admins can see the hash, on the Current Round page.**" |
| 19 | "Bets can be queued for the next round **in the browser**: it places the bet automatically when the next round opens." |
| 20 | "New pilots start with 0 credits. Free credits come from the **spin wheel**: one spin every 5 minutes, 50 to 1,000 credits." Drop "+1,000 demo top-up". |
| 29 | Call it the **NotBlocked requirement, enforced by `AccountAuthorizationHandler`**, which re-checks the database on every request. |
| 37 | "The frontend's 13 Vitest tests pass. The backend's 77 xUnit tests pass **once the latest migration is committed**." *(Commit `AddLoadoutInvitesAndReportSettings` before the presentation, then this line is simply "all 77 pass".)* |
| 38 | "**The frontend** runs CI on every push: lint, tests, type-check, build and a Docker build. **The backend and database workflows are not active yet.**" |
| 39 | "The retro UI was **ported onto** the Muzi branch (commit 3b9d932) rather than git-merged. `muzi-integration` holds the current UI." |
| Snippet C13 | Say the test **checks** that RTP sits in a sanity band (0.90–1.05), not that it **proves** RTP = 99%. |

---

## 4. File structure

### Frontend `src/` (HEAD)
```
src/
├── __tests__/        app-level Vitest tests
├── assets/           images, logos, badges, sounds
│   ├── achievements/ achievement badge art
│   └── audio/        music and sound effects
├── components/       reusable UI
│   ├── admin/        admin-console UI kit
│   └── sky/          game / arcade UI components (HUD, plane, wheel, how-to-play…)
├── composables/      reusable logic (SignalR wiring, countdowns, audio, feedback prompts)
├── lib/              pure helpers (pdfReport, skins, craft, achievements, soundEngine…)
├── router/           routes + navigation guards
├── services/         axios (api.ts) and SignalR (signalr.ts) wrappers per feature
├── stores/           Pinia state (player, game, wallet, admin, payment…)
├── types/            shared TypeScript types
└── views/            routed pages
```

### Backend projects (HEAD, `skycrash-backend/src/`)
```
SkyCrash.Api/                 HTTP + SignalR entry point
├── Authorization/            policies, requirements, DB-backed AccountAuthorizationHandler
├── Controllers/              REST endpoints
├── Hubs/                     GameHub + GameHubNotifier (IGameNotifier adapter)
├── Properties/               launchSettings
└── Reporting/                ReportRange (shared date-range parsing)
   (+ committed bin/ obj/ build output, see §8)

SkyCrash.Application/         use-case contracts, no infrastructure
├── DTOs/                     request/response contracts
├── Exceptions/               app/domain exceptions (e.g. InsufficientCreditsException)
├── Interfaces/               ports (IGameNotifier, IWalletService, …)
├── Models/                   catalogs, snapshots, credit packs
└── Validators/               FluentValidation rules

SkyCrash.Domain/              core model, no dependencies
├── Common/                   constants, catalogs, roles
├── Entities/                 User/Player/Admin, Bet, Round, Lobby, …
└── Enums/                    statuses and types

SkyCrash.Infrastructure/      adapters
├── Auth/                     JwtTokenGenerator
├── Configuration/            PayFast + Gemini options
├── GameEngine/               round engine, crash calculator, bet settlement, settings cache
├── Migrations/               EF Core migrations (PostgreSQL)
├── Persistence/              SkyCrashDbContext + seed data
├── Realtime/                 presence tracker, concurrency sampler
└── Services/                 wallet, lobby, payments, feedback, accounts…

SkyCrash.Api.Tests/           flat: xUnit test classes, fakes, TestDbContextFactory
```

### Database repo root (HEAD `685bdcd`)
```
SkyCrash-Database/
├── SkyCrash.Data/            .NET 8 SQLite data library
│   ├── Exceptions/
│   ├── Models/
│   ├── Repositories/
│   └── UnitOfWork/
├── SkyCrash.Data.Tests/      console demo tests
├── skycrash-database/        SQL schema + seed
│   ├── .github/              (nested CI file, inactive)
│   ├── docs/
│   ├── migrations/           001_… schema
│   └── seeds/                dev seed data
└── SkyCrash Code/            old snapshot of frontend/backend/database code
```
⚠ **The running app does not use this repo.** The backend uses **PostgreSQL via EF Core** with its own migrations in `SkyCrash.Infrastructure/Migrations`. The Database repo is a separate SQLite library plus an old SQL schema.

### B2. Pages and routes (`src/router/index.ts:28-92`, guards 96-133)

| Route | View | Access |
|---|---|---|
| `/` | HomeView | public (admins → `/admin`) |
| `/login` | LoginView | public |
| `/register` | RegisterView | public |
| `/profile` | ProfileView | player |
| `/lobby` | LobbyView | player |
| `/wallet` | WalletView | player |
| `/game` | GameView | player |
| `/hangar` | HangarView | player |
| `/missions` | MissionsView | player |
| `/history` | HistoryView | player |
| `/leaderboard` | LeaderboardView | player |
| `/volatility` | VolatilityView | admin |
| `/ops` | OperationsView | admin |
| `/rtp` | RtpView | admin |
| `/admin` | AdminView (Player Management) | admin |
| `/admin/rounds` | AdminCurrentRoundView | admin |
| `/admin/reports` | AdminReportsView | admin |
| `/admin/analytics` | AdminAnalyticsView | admin |
| `/admin/roles` | AdminRolesView | admin **+ manager** |

"Player" means logged-in and not an admin. Admins are redirected to `/admin` from every non-admin route, including the public ones.

### B3. Frontend data flow: view → Pinia store → service → server
1. **View**: `src/views/AdminView.vue:16,40-41` calls `adminStore.fetchPlayers()`.
2. **Store**: `src/stores/adminStore.ts:15-24` calls `adminService.getPlayers({ search, isBlocked, isAdmin, sortBy, sortDir })`.
3. **Service**: `src/services/adminService.ts:4-6` calls `api.get('/admin/players', { params })`.
4. **api.ts**: `src/services/api.ts:3-16` is an axios instance with `VITE_API_BASE_URL` that adds `Authorization: Bearer <skycrash_token>`.
5. **Server**: `Api/Controllers/AdminController.cs:46` handles `GET /api/admin/players`.

Real-time path: `src/services/signalr.ts:5-14` (HubConnection with `accessTokenFactory`) → `src/services/gameService.ts:3-5` `invoke('PlaceBet', …)` → `Api/Hubs/GameHub.cs:164`. Server events come back through `src/composables/useSignalRConnection.ts:181-186` into `gameStore`. *Caveat: GameView calls `gameService` directly for bets and cash-outs (`GameView.vue:129-133`), not through a store.*

### B4. Dependency direction: **[Confirmed]**
- `SkyCrash.Api.csproj:23-24` references Infrastructure and Application.
- `SkyCrash.Infrastructure.csproj:4` references Application.
- `SkyCrash.Application.csproj:4` references Domain.
- `SkyCrash.Domain.csproj` has no references.

No project reference points the wrong way. The Api → Application reference is redundant (it already comes through Infrastructure) but legal.

**Q&A risk:** some controllers use `SkyCrashDbContext` (Infrastructure) directly instead of going through an Application interface (e.g. `AuthController`, `AdminController`).

### B5. Ports and adapters: **[Confirmed]**
- Port: `SkyCrash.Application/Interfaces/IGameNotifier.cs:3-23`.
- Adapter: `SkyCrash.Api/Hubs/GameHubNotifier.cs:6` `public class GameHubNotifier : IGameNotifier`, wrapping `IHubContext<GameHub>` (10-17).
- Wiring: `Program.cs:177` `AddSingleton<IGameNotifier, GameHubNotifier>()`.

*Inconsistency:* the block action in `AdminController.cs:24,137` uses `IHubContext<GameHub>` directly.

---

## 5. Admin and entity actions (#31–#35)

### 31. Player Management (`/admin`)

| Control | Options | Backend param (`GET /api/admin/players`) |
|---|---|---|
| Search box ("Search by username or email…", Enter or **Search**) | free text | `search` → case-insensitive `ILIKE %term%` on Username **or** Email |
| Status | All Accounts / Active Only / Blocked Only | `isBlocked` |
| Role | All Roles / Admins Only / Players Only | `isAdmin` |
| Sort by | Username / Email / Balance / Member Since / Last Seen | `sortBy` (`email`, `balance`, `membersince`, `lastseen`; anything else sorts by username) |
| Direction | Asc / Desc toggle | `sortDir` (`desc`, otherwise ascending) |

Results are capped at **200** rows (`.Take(200)`, `AdminController.cs:97`), with no pagination.

Sources: FE `src/views/AdminView.vue:63-107`; `src/stores/adminStore.ts:15-27`; BE `AdminController.cs:46-113`.

### 32. Add / edit / delete actions

**Players**

| Action | Endpoint |
|---|---|
| Register (add own account) | `POST /api/auth/register` |
| Edit username / email | `PATCH /api/players/me` |
| Change equipped aircraft / sky | `PUT /api/players/me/loadout` |
| Create / join / leave a private lobby | `POST /api/lobby`, `/lobby/join`, `/lobby/leave` |
| Place bet / cash out | SignalR `PlaceBet`, `CashOut` |
| Spin the credit wheel | `POST /api/wallet/spin` |
| Buy credits | `POST /api/payments/checkout` (PayFast) |
| Submit feedback | `POST /api/feedback` |
| Mark achievements as seen | `PATCH /api/achievements/displayed` |

Players have **no** change-password and **no** delete-account action.

**Admins**

| Action | Endpoint |
|---|---|
| Block / unblock a player | `POST /api/admin/players/{id}/block`, `/unblock` |
| Adjust a balance (with reason) | `POST /api/admin/players/{id}/adjust-balance` |
| Change house edge (password required) | `PUT /api/admin/settings/house-edge` |
| Edit game settings | `PUT /api/admin/game/settings` |
| Edit feedback settings | `PUT /api/admin/feedback/settings` |

**Managers only**

| Action | Endpoint |
|---|---|
| Promote / demote | `POST /api/admin/players/{id}/promote`, `/demote` |
| Grant / revoke admin and manager | `POST /api/admin/roles/grant-admin`, `revoke-admin`, `grant-manager`, `revoke-manager` |

Everything else admins have is read-only reports and analytics (`/api/admin/analytics/*`, `/api/admin/reports/*`, `/api/admin/feedback/*`, `/api/rtp/summary`, `/api/volatility/summary`, `/api/operations/metrics`).

### 33. Deletes: **[Confirmed] none**
There is no `[HttpDelete]`/`MapDelete` in the backend and no `api.delete` in the frontend. Players are **blocked**: `IsBlocked = true/false` at `AdminController.cs:127,152`. History, bets and transactions are never removed.

### 34. Export PDF
5 admin pages have Export PDF:
- Player Management (`AdminView.vue:51`)
- Reports (`AdminReportsView.vue:63`)
- Operations (`OperationsView.vue:36`)
- RTP (`RtpView.vue:80`)
- Volatility (`VolatilityView.vue:43`)

**Not** on Current Round, Analytics/Insights or Roles. PDFs are built in the browser with `jspdf` + `jspdf-autotable` (`src/lib/pdfReport.ts:30`).

### 35. Exact validation messages

| Case | Server (400/401 body) | Client (shown before sending) |
|---|---|---|
| Adjust balance, amount 0 | "Adjustment amount cannot be zero." (`AdjustBalanceRequestValidator.cs:11`) | "Amount cannot be zero." (`AdjustBalanceModal.vue:20`); the request is never sent |
| Adjust balance, no reason | "A reason is required for every balance adjustment." (`:14`, max 200 characters) | "A reason is required." (`AdjustBalanceModal.vue:24`) |
| House edge, wrong password | "Incorrect password." (401, `AdminSettingsController.cs:62`) | same text, **but the 401 also triggers auto-logout** (see §8) |
| House edge > 50% | "House edge must be between 0% and 50%." (400, `AdminSettingsController.cs:67`) | the input has `min=0 max=50` (`RtpView.vue:123-124`), which doesn't block typed values |

The password is checked **before** the range. So a value above 50% with a wrong password shows "Incorrect password."

Other adjust-balance messages:
- "Adjustment would take the player's balance below zero."
- "Balance adjustments only apply to player accounts. Admin accounts hold no credits."

(`AdminController.cs:219,223`)

---

## 6. Code snippets (HEAD)

**C1. One button: bet, cash out or queue.** `src/views/GameView.vue:159-179`
```ts
const primaryAction = computed<PrimaryAction>(() => {
  if (canCashOut.value) return 'cashout'
  if (canPlaceBet.value) return 'bet'
  if (lockedIn.value) return 'locked'
  return 'queue'
})
function runPrimaryAction() {
  switch (primaryAction.value) {
    case 'cashout': if (!isCashingOut.value) void handleCashOut(); break
    case 'bet': if (!isPlacingBet.value && !betInvalid.value) void handlePlaceBet(); break
    case 'queue':
      if (queuedForNextRound.value || !betInvalid.value) queuedForNextRound.value = !queuedForNextRound.value
      break
  }
}
```
*(The switch cases are compacted onto single lines here. Space bar maps to `runPrimaryAction()` at :182-188. The queued bet fires when the phase becomes Waiting, at :148-157.)*

**C2. `PlaceBet()` validation chain.** `skycrash-backend/src/SkyCrash.Api/Hubs/GameHub.cs:164-228` (condensed: each `{…}` is a `SendAsync("BetRejected", …); return;` block)
```csharp
public async Task PlaceBet(decimal amount, decimal? autoCashoutTarget = null)
{
    var account = await _dbContext.Users.FindAsync(playerId);           // fresh read every bet
    if (account is Admin) { /* AdminCannotBetMessage */ }
    if (account is not Player player || player.IsBlocked) { /* "Your account cannot place bets." */ }
    if (state is null || state.Status != "Waiting") { /* bets only while waiting */ }
    if (amount <= 0) { /* "Bet amount must be greater than zero." */ }
    if (autoCashoutTarget is not null &&
        (autoCashoutTarget < MinAutoCashoutTarget || autoCashoutTarget > _gameConfiguration.MaxMultiplier)) { /* … */ }
    if (_activeBetsTracker.TryGetBet(state.RoundId, playerId, out _)) { /* "You already have a bet on this round." */ }
    // …
    try { newBalance = await _walletService.AdjustBalanceAsync(playerId, -amount, CreditTransactionType.BetPlaced, …); }
    catch (InsufficientCreditsException) { /* "Insufficient credits." */ }
```

**C3. Transaction, row lock and negative-balance check.** `skycrash-backend/src/SkyCrash.Infrastructure/Services/WalletService.cs:37-80`
```csharp
return await strategy.ExecuteAsync(async () =>
{
    await using var transaction = await _dbContext.Database.BeginTransactionAsync();
    // Row-level lock: no other concurrent request for this same player
    // can read/modify this row until this transaction commits or rolls back.
    var player = await _dbContext.Players
        .FromSqlInterpolated($"SELECT * FROM \"Users\" WHERE \"Id\" = {playerId} AND \"UserType\" = {UserRoles.Player} FOR UPDATE")
        .SingleOrDefaultAsync();
    // …
    var newBalance = player.CreditBalance + amount;
    if (newBalance < 0)
        throw new InsufficientCreditsException(playerId, amount, player.CreditBalance);
    // … CreditBalance = newBalance; CreditTransactions.Add(…)
    await _dbContext.SaveChangesAsync();
    await transaction.CommitAsync();
```

**C4. `CalculateCrashPoint()`.** `skycrash-backend/src/SkyCrash.Infrastructure/GameEngine/CrashPointCalculator.cs:17-40` (the whole method)
```csharp
public decimal CalculateCrashPoint(string serverSeed, string roundId)
{
    var houseEdge = (double)_gameConfiguration.HouseEdge;
    var maxMultiplier = _gameConfiguration.MaxMultiplier;
    using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(serverSeed));
    var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(roundId));
    var hex = Convert.ToHexString(hashBytes);
    var intValue = Convert.ToUInt64(hex[..13], 16);
    var r = intValue / Math.Pow(2, 52); // uniformly distributed in [0, 1)
    if (r < houseEdge) { return 1.00m; }
    var raw = (1 - houseEdge) / (1 - r);
    var crashPoint = Math.Floor(raw * 100) / 100.0;
    return Math.Min((decimal)crashPoint, maxMultiplier);
}
```
*(Blank lines removed. In the real file the code goes through `first13Chars` and `maxValue` variables.)*

**C5. Seed generation and hash publication.** `skycrash-backend/src/SkyCrash.Infrastructure/GameEngine/RoundEngineService.cs:77-101, 256-260`
```csharp
var serverSeed = Guid.NewGuid().ToString("N");
var serverSeedHash = ComputeSha256Hex(serverSeed);
// … round saved with ServerSeed + ServerSeedHash, Status = Waiting
await _gameNotifier.NotifyLobbyAsync("RoundWaiting", new
{
    roundId = round.Id, roundNumber = round.RoundNumber,
    serverSeedHash, countdownSeconds = WaitingDurationSeconds
}, stoppingToken);
// …
private static string ComputeSha256Hex(string input)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
    return Convert.ToHexString(bytes).ToLowerInvariant();
}
```

**C6. The 100 ms tick loop.** `RoundEngineService.cs:21, 122-144`
```csharp
private const int TickIntervalMs = 100;
// …
var stopwatch = Stopwatch.StartNew();
var currentMultiplier = 1.00m;
while (currentMultiplier < crashPoint)
{
    await Task.Delay(TickIntervalMs, stoppingToken);
    var elapsedSeconds = stopwatch.Elapsed.TotalSeconds;
    var computed = (decimal)Math.Round(Math.Exp(GrowthRate * elapsedSeconds), 2);
    currentMultiplier = Math.Min(computed, crashPoint);
    await _gameNotifier.NotifyLobbyAsync("MultiplierTick",
        new { roundId = round.Id, multiplier = currentMultiplier }, stoppingToken);
    await ProcessAutoCashoutsAsync(dbContext, betSettlementService, round.Id, round.RoundNumber, currentMultiplier, stoppingToken);
}
```

**C7. Atomic `RemoveBet` claim (no double payout).** `skycrash-backend/src/SkyCrash.Infrastructure/GameEngine/BetSettlementService.cs:34-56`
```csharp
if (!_activeBetsTracker.TryGetBet(roundId, playerId, out var activeBet) || activeBet is null)
    return null;

// Atomic claim: whichever caller (a manual CashOut invocation or this round's
// auto-cashout sweep) removes the bet first wins; the other sees `false` here
// and backs off instead of double-paying the same bet.
if (!_activeBetsTracker.RemoveBet(roundId, playerId))
    return null;

var payout = activeBet.Amount * cashOutMultiplier;
// …
var newBalance = await _walletService.AdjustBalanceAsync(playerId, payout, CreditTransactionType.BetWon, reason);
```

**C8. Crash and seed reveal.** `RoundEngineService.cs:146-189`
```csharp
// --- CRASHED PHASE ---
round.Status = RoundStatus.Crashed;
round.CrashedAtUtc = DateTime.UtcNow;
await dbContext.SaveChangesAsync(stoppingToken);
// … remaining "Placed" bets marked Lost; _activeBetsTracker.ClearRound(round.Id);
await _gameNotifier.NotifyLobbyAsync("RoundCrashed", new
{
    roundId = round.Id,
    crashMultiplier = crashPoint,
    serverSeed,
    serverSeedHash
}, stoppingToken);
```

**C9. Live blocked check.** `skycrash-backend/src/SkyCrash.Api/Authorization/AccountAuthorizationHandler.cs:37-49, 82-89`. *There is no `NotBlockedAuthorizationHandler.cs`. `NotBlockedRequirement.cs:9-11` is a marker class handled here.*
```csharp
var account = await GetAccountStateAsync(context.User);
if (account is null) { context.Fail(); return; }   // no valid user id, or account gone
if (account.IsBlocked)
{
    context.Fail(new AuthorizationFailureReason(this, BlockedMessage));
    return;
}
// … GetAccountStateAsync: a fresh DB query on every request
return await _dbContext.Users.AsNoTracking().Where(u => u.Id == userId)
    .Select(u => new AccountState(u.IsBlocked, EF.Property<string>(u, SkyCrashDbContext.UserTypeColumn),
        u is Admin && ((Admin)u).IsManager))
    .FirstOrDefaultAsync();
```

**C10. AdminOnly policy.** `skycrash-backend/src/SkyCrash.Api/Controllers/AdminControllerBase.cs:8-12`
```csharp
[ApiController]
// AdminOnly is checked against the database on every request (current account type is
// Admin and not blocked) — see AccountAuthorizationHandler.
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public abstract class AdminControllerBase : ControllerBase
```

**C11. Password rules.** `skycrash-backend/src/SkyCrash.Application/Validators/RegisterRequestValidator.cs:20-24`
```csharp
RuleFor(x => x.Password)
    .NotEmpty()
    .MinimumLength(8)
    .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
    .Matches("[0-9]").WithMessage("Password must contain at least one number.");
```

**C12. Unique (PlayerId, RoundId) index and decimal(18,2) money.** `skycrash-backend/src/SkyCrash.Infrastructure/Persistence/SkyCrashDbContext.cs:74, 108-117`. *Money types are set column by column, not globally.*
```csharp
entity.Property(p => p.CreditBalance).HasColumnType("decimal(18,2)");   // Player (line 74)
// …
modelBuilder.Entity<Bet>(entity =>
{
    entity.HasKey(b => b.Id);
    entity.Property(b => b.Amount).HasColumnType("decimal(18,2)");
    entity.Property(b => b.CashOutMultiplier).HasColumnType("decimal(10,2)");
    entity.Property(b => b.Payout).HasColumnType("decimal(18,2)");
    // …
    entity.HasIndex(b => new { b.PlayerId, b.RoundId }).IsUnique();
```

**C13. RTP sanity test.** `skycrash-backend/src/SkyCrash.Api.Tests/CrashPointCalculatorTests.cs:48-79`
```csharp
[Fact]
public void FixedCashOutTarget_ExpectedPayoutApproximatesHouseEdgeComplement()
{
    // This formula's crash point satisfies P(crashPoint >= C) = (1 - houseEdge) / C
    const decimal target = 2.00m;
    const int sampleSize = 50_000;
    var wins = 0;
    for (var i = 0; i < sampleSize; i++)
    {
        var crashPoint = _calculator.CalculateCrashPoint("rtp-sanity-seed", $"round-{i}");
        if (crashPoint >= target) { wins++; }
    }
    var expectedPayoutPerRound = wins * target / sampleSize;
    Assert.InRange(expectedPayoutPerRound, 0.90m, 1.05m);
}
```
*The test's own comment calls 0.90–1.05 "a generous sanity band", so say "checks", not "proves".*

**C14. Concurrent-debit test.** `skycrash-backend/src/SkyCrash.Api.Tests/WalletServiceTests.cs:53-116`
```csharp
public async Task AdjustBalanceAsync_ConcurrentDebits_NeverOverdraftsBalance()
{
    var player = CreateTestPlayer(setupContext, startingBalance: 500m);
    const int concurrentRequests = 20;
    const decimal debitAmount = 50m; // 20 x 50 = 1000, double the available balance
    var gate = new TaskCompletionSource();
    var tasks = contexts.Select(async context =>
    {
        var service = new WalletService(context, NullLogger<WalletService>.Instance);
        await gate.Task;
        try { await service.AdjustBalanceAsync(player.Id, -debitAmount, CreditTransactionType.AdminAdjustment, "concurrency test"); return true; }
        catch (InsufficientCreditsException) { return false; }
    }).ToList();
    gate.SetResult();
    var results = await Task.WhenAll(tasks);
    Assert.Equal((int)(500m / debitAmount), results.Count(succeeded => succeeded)); // exactly 10 should succeed
```

**C15. Pinia store → service → api.ts.** `src/stores/adminStore.ts:15-28` → `src/services/adminService.ts:4-7` → `src/services/api.ts:3-16`. *A wallet example (`walletStore.requestDemoTopUp`) also exists at HEAD, but it calls the removed demo-topup endpoint, so it is not used here.*
```ts
// src/stores/adminStore.ts:15-24
async function fetchPlayers() {
  isLoading.value = true
  try {
    players.value = await adminService.getPlayers({
      search: searchTerm.value || undefined,
      isBlocked: blockedFilter.value === 'all' ? undefined : blockedFilter.value === 'blocked',
      isAdmin: adminFilter.value === 'all' ? undefined : adminFilter.value === 'admin',
      sortBy: sortBy.value,
      sortDir: sortDir.value,
    })
  // … finally { isLoading.value = false }
```
```ts
// src/services/adminService.ts:4-7
export async function getPlayers(filters: AdminPlayerFilters): Promise<AdminPlayerSummary[]> {
  const response = await api.get<AdminPlayerSummary[]>('/admin/players', { params: filters })
  return response.data
}
```
```ts
// src/services/api.ts:3-16
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skycrash_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

---

## 7. Screens to capture

⭐ = one of the best 6 for the slides and demo. Use **two browser profiles**, because admins are always redirected away from player pages.

| Route | Login | What's on screen |
|---|---|---|
| `/` | none | Landing page, Play button, 3-step "How to play" |
| `/login` | none | "Cleared for boarding" login form |
| `/register` | none | "Register your call sign" form (username, email, password, confirm) |
| `/profile` | player | Edit username and email |
| `/lobby` | player | Pilots Online, "Private Squadron" create/join with invite code, members and their aircraft |
| `/wallet` | player | Balance, buy-credits packs, transaction history *(HEAD also shows the broken "+1,000 Add Demo Credits" button, so avoid clicking it live)* |
| ⭐ `/game` | player | **Live game:** plane and climbing multiplier, bet input, the single main button, auto cash-out target, Bets This Round, recent crash points. Capture **mid-flight** (after RoundStarted). |
| ⭐ `/hangar` | player | **Hangar:** equipped aircraft and sky, preview, details |
| ⭐ `/missions` | player | **Missions:** today's 3 daily challenges, challenge badges, achievements |
| `/history` | player | Your flight log and recent rounds |
| ⭐ `/leaderboard` | player | **Leaderboard:** Biggest Wins, Best Multipliers, Most Active (top 10 each) |
| ⭐ `/admin` | admin | **Player Management:** search, status/role filter, sort, block/unblock, adjust balance, Export PDF |
| ⭐ `/rtp` | admin | **RTP & House Edge:** theoretical vs actual RTP (all-time and 24 h), change house edge (password modal), Export PDF |
| `/admin/rounds` | admin | Current round: status, live multiplier, active bets, locked crash point, seed hash |
| `/admin/reports` | admin | Rounds report, player activity, Export PDF |
| `/admin/analytics` | admin | Insights: actual RTP vs edge, average bet, DAU and peak concurrency, bets vs payouts, session length, feedback |
| `/ops` | admin | Live monitoring: current round, active bets, online players, last-hour volume, Export PDF |
| `/volatility` | admin | Crash-point distribution, mean/median/SD, P10/P90, P25/P75, Export PDF |
| `/admin/roles` | admin + manager | Grant/revoke admin and manager, "How roles work" |

Demo logins (seeded or dev): manager admin `newboi@skycrash.local` / `NewBoi123!`, test player `player@skycrash.local` / `Player123!`. The second account is registered manually and is not seeded.

---

## 8. Anything surprising (Q&A traps)

1. **The backend at HEAD fails 42 of 77 tests.** An EF migration (`20261002105258_AddLoadoutInvitesAndReportSettings` plus the updated `SkyCrashDbContextModelSnapshot.cs`) exists in the working tree but **is not committed**, while the model changes it covers are. Commit it before anyone clones the repo or demos the tests.
2. **The demo top-up button is broken at HEAD.** The FE `WalletView.vue:73-81` calls `/wallet/demo-topup`, but the backend removed that endpoint. The working tree removes the button but isn't committed.
3. **A wrong house-edge password logs the admin out.** The 401 "Incorrect password." is caught by the global 401 interceptor (`src/services/api.ts:23-35`), which treats it as an expired session. Don't type a wrong password in the live demo.
4. **Only the frontend CI runs.** The backend and DB workflows are nested one folder too deep, and the backend one is a Node template that never builds .NET.
5. **The Database repo isn't the live database.** The app uses PostgreSQL through EF Core migrations in the backend. The DB repo is a SQLite .NET 8 library plus an old SQL schema and a copy of old code.
6. **Secrets and build output are committed:**
   - Dev JWT key and DB password in `appsettings.Development.json`.
   - A seeded manager with the hard-coded password `NewBoi123!` (`Program.cs:211-238`).
   - The frontend `.env` (localhost URLs only).
   - Backend `bin/` and `obj/`, even though `.gitignore` lists them.
   - Sample PDFs at the FE root.
7. **JWT settings exist only in the Development config.** A Production run would start with a null key (`Program.cs:91`).
8. **The house edge is read when the round starts running, after the seed hash is published.** An admin edit during the 10-second waiting phase changes that round's crash point. The seed commitment doesn't cover the edge.
9. **Invite codes use `Random.Shared`**, which is not cryptographic. That's fine for lobby codes, but don't call them "secure".
10. **Fairness can't be verified by players yet.** The seed is broadcast but never shown, and the round history doesn't return it (see #17).
11. **The FE says "Free credits wheel · up to 2,000"** (`WalletView.vue:90`), but the largest segment is 1,000.
12. **There is no password change, no lockout and no rate limiting.** Password rules are enforced only on the server.
13. **Player search is capped at 200 rows** with no pagination.
14. **The 1.00× crash rate is about 1.98%**, not 1%, because values just above the edge also floor to 1.00.

### Test counts by file (HEAD)

| Backend file | [Fact] | [Theory] (cases) |
|---|---|---|
| AccountAuthorizationHandlerTests | 6 | – |
| AdjustBalanceRequestValidatorTests | 4 | – |
| AdminControllerTests | 6 | – |
| ChallengeRotationTests | 5 | – |
| CrashPointCalculatorTests | 5 | – |
| GameHubAccountTypeTests | 5 | – |
| ManagerAndFeedbackTests | 7 | – |
| PayFastPaymentServiceTests | 13 | 2 (3 + 4) |
| UserAccountServiceTests | 9 | – |
| UserHierarchyTests | 3 | – |
| WalletServiceTests | 7 | – |
| **Total** | **70** | **2 (7 cases)**: 72 methods, **77 executed** |

| Frontend file | Tests |
|---|---|
| `src/__tests__/App.spec.ts` | 2 |
| `src/components/AdjustBalanceModal.spec.ts` | 3 |
| `src/stores/paymentStore.spec.ts` | 6 |
| `src/stores/playerStore.spec.ts` | 2 |
| **Total** | **13** |

### Commit history (first-parent of the checked branch, oldest → newest)

**Frontend.** 34 commits, 2026-06-18 → 2026-10-02:
initial repo setup · Update · Frontend Foundation · Authentication · Player Profiles · Lobby Creation · Credits and Wallet · SignalR Connection · Test Fixes · Game Engine · Betting · Cash Out · Round History · Leaderboard · Operations Dashboard · Tes Fixes · Frontend Changes · RTP Dashboard · Volatility Dashboard · Admin Features · Final Admin Features · Port Lovable neon-arcade redesign onto the working Vue app · Admin Changes · Logout button · Achievements and Private Lobby · Achivements update and Admin changes · Reports · UI improvements, Reports, Payment gateway · Hangar fix · Additional Docker Integration · minor flight path and analytis board changes · changes made to player lobby and landing page and credit generatoion · dailly challenges + daily challenge badges + fixing settings… · prompt feedback + sound

**Backend.** 32 commits, 2026-06-18 → 2026-10-02:
initial repo setup · Update · Backend Foundation · Add DB connection · Database testing and foundation fix · Docker Integration · Authentication · Player Profiles · Docker fix · Lobby Creation · Credits and Wallet · SignalR Connection · Test Fixes · Game Engine · Betting · Cash Out · Round History · Leaderboard · Operations Dashboard · Test Fixes · Backend Changes · Backend Changes · Last Change · Commit fixes · Fix RTP/Volatility route collision · Admin features and UI redesign · Admin Changes · UI improvements, Reports, Payment gateway · split the user player admin classes… · updates to back end for credit generation and player lobby… · dealing with admin reporting and plane skin/sky details · added changes to admin analytics controller + reporting class

**Database.** 12 commits across all branches, 2026-06-18 → 2026-09-23. HEAD's first parent is a root commit "first commit" (2026-09-23), merged with the older line: initial repo setup (06-18) → Edit (06-30) → Database (07-19) → merge. The `origin/Muzi` "Logging" work is not in HEAD.
