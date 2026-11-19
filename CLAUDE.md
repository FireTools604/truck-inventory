# Truck Inventory Check

Cabinet-by-cabinet apparatus inventory check for Agassiz Fire Department. Owner: Allan Dicks, Captain – Equipment.

`docs/SPEC.md` is the source of truth. Read it before changing anything.

## Hard constraints

- Runs in Chrome on the department's Zebra ET40/ET45 tablets, on the fire hall Wi-Fi. Dispatch manages their software and OS, so we don't control the device: no app installs, no DataWedge or MDM changes.
- Scanner input arrives as keystrokes (DataWedge Profile0 keystroke output) into a focused text field. Keep a hidden input focused with `inputmode="none"`. Commit a scan on Enter, Tab or ~250 ms idle. See `scan-test.html` for the working pattern.
- Hosted on GitHub Pages from the `main` branch root. Plain HTML, CSS and JavaScript. No build step, no frameworks, no external services, no CDN dependencies unless Allan agrees.
- Check data lives in localStorage on the tablet. Wrap every read and write in try/catch. Export is one flat CSV (format in the spec).
- Master list is test data until the real contents are final: `data/trucks.json` (short set, default) and `data/trucks-full.json` (full-size set, `?data=full`). Keep both in the current item format. Photos go in `images/<apparatus>/`. S1 is the first apparatus built out.
- App code: `index.html`, `css/app.css`, `js/app.js`. No other scripts.
- Standalone. No links to the SCBA tracker (FireTools604/firetrack-scba), the clothing inventory or FireTrack unless asked.

## Scope

- Apparatus: E1, E1-2, R1, S1, T1. SPU excluded.
- Only cabinets get QR labels. Items don't.
- Label IDs, once printed, never change.

## Working style

- Proof of concept first, following the build phases in the spec. Keep changes small and testable on the tablet.
- Touch targets at least 44 px. The tablet is used standing at the truck.
- Plain, concise, operational wording in the UI and docs.
- Ask before adding libraries, a backend or a new data store.
- Flag anything that would need access to the tablet's settings.
- Every change to `js/app.js` or `css/app.css`: bump `APP_VERSION` in `js/app.js` and the `?v=` on both tags in `index.html` to the same value (date plus a letter, e.g. `2026-11-18b`). Put the new version in the PR description. Without it the tablet can run cached old code on new data.
- When the spec changes, update `docs/SPEC.md` in the same change.
- Decisions made in a chat go into `docs/SPEC.md` before the chat ends. New chats only see what's in the repo on `main`.
