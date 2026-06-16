import { useEffect } from 'react'
import { clearToken } from '../lib/auth'

// __APP_VERSION__ is replaced at build time by vite.config.js
/* global __APP_VERSION__ */
const BUILT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

const POLL_INTERVAL = 3 * 60 * 1000 // 3 minutes

export function useVersionCheck() {
  useEffect(() => {
    // Never run version checks in local dev — the version changes every restart
    if (import.meta.env.DEV) return

    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`) // cache-bust
        if (!res.ok) return
        const { v } = await res.json()
        if (v && v !== BUILT_VERSION) {
          // New version deployed. Clear session and hard-reload so the browser
          // fetches the fresh bundle instead of serving stale cached JS.
          clearToken()
          window.location.replace('/login')
        }
      } catch {
        // Network error or missing file — ignore, don't disrupt the user
      }
    }

    const id = setInterval(check, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])
}
