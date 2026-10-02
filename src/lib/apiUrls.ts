// Where the API lives. Locally (and in the Docker/nginx setup) VITE_API_BASE_URL and
// VITE_SIGNALR_HUB_URL are set directly. A hosted build can instead set VITE_API_HOST to the
// API's host name (Render passes just the host, e.g. "skycrash-api.onrender.com").
const host = import.meta.env.VITE_API_HOST?.trim()
const origin = host ? (host.includes('://') ? host.replace(/\/$/, '') : `https://${host}`) : null

export const API_BASE_URL: string = origin ? `${origin}/api` : import.meta.env.VITE_API_BASE_URL
export const SIGNALR_HUB_URL: string = origin ? `${origin}/hubs/game` : import.meta.env.VITE_SIGNALR_HUB_URL
