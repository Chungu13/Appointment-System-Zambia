# Maintenance mode is ON

`vercel.json` currently routes every request (all paths, all domains/subdomains
pointed at this Vercel project — including `kimawa.pro` and any tenant
subdomains) to the static page `frontend/public/maintenance.html`.

This was done because the Railway backend is paused, so the normal React app
(which needs the API) would otherwise show broken/loading screens everywhere.

`maintenance.html` is fully static — no React, no API calls — so it works
even with the backend completely down.

## To turn maintenance mode OFF (bring Kimawa back online)

1. Make sure the Railway backend is unpaused and healthy.
2. Copy the contents of `vercel.json.normal` over `vercel.json`:
   ```
   cp vercel.json.normal vercel.json
   ```
3. Commit and push — Vercel will redeploy with normal routing restored.
4. (Optional cleanup) Delete `vercel.json.normal`, `MAINTENANCE_MODE.md`, and
   `frontend/public/maintenance.html` once you're confident you won't need
   maintenance mode again soon — none of them affect the app when unused.

No existing routes, components, or backend-calling code were touched — this
is purely a routing override at the Vercel level.
