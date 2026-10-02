/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SIGNALR_HUB_URL: string
  /** Hosted builds: the API's host name; overrides the two URLs above. */
  readonly VITE_API_HOST?: string
}
