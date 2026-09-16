# Sky Crash — Frontend

Vue 3 SPA for Sky Crash, a retro-arcade crash-betting game. Talks to the
`SkyCrash.Api` backend over REST and a SignalR WebSocket hub for live round
state.

## Development

Requires Node.js.

```sh
npm install
cp .env.example .env   # set VITE_API_BASE_URL if the backend isn't on localhost:5149
npm run dev
```

The backend must be running (see `SkyCrash-Backend/skycrash-backend`) and its
`Cors:AllowedOrigins` config must include this app's dev origin
(`http://localhost:5173` by default) for API calls and the SignalR
connection to succeed.

## Build

```sh
npm run build   # type-checks with vue-tsc, then builds with Vite
npm run preview
```

## Built with

- Vue 3 (`<script setup>`, Composition API)
- Vue Router
- Pinia
- `@microsoft/signalr` (live round state from the game hub)
- Tailwind CSS v4
