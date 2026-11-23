/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface Window {
  APP_CONFIG: {
    apiUrl: string
    stagingAuth: string
  }
}
