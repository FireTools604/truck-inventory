# Truck Inventory Check

Cabinet-by-cabinet apparatus inventory check for Agassiz Fire Department. Owner: Allan Dicks, Captain – Equipment.

`docs/SPEC.md` is the source of truth. Read it before changing anything. Where `docs/flow-map-original.pdf` differs from the spec, the spec wins.

## Hard constraints

- Runs in Chrome on the dispatcher's Zebra ET40/ET45 tablets. We don't control the device: no app installs, no DataWedge or MDM changes.
- Scanner input arrives as keystrokes (DataWedge Profile0 keystroke output) into a focused text field. Keep a hidden input focused with `inputmode="none"`. Commit a scan on Enter, Tab or ~250 ms idle. See `index.html` (scanner test) for the working pattern.
- Hosted on GitHub Pages from the `main` branch root. Plain HTML, CSS and JavaScript. No build step, no frameworks, no external services, no CDN dependencies unless Allan agrees.
- Check data lives in localStorage on the tablet. Wrap every read and write in try/catch. Export is one flat CSV (format in the spec).
- Master list is sample data in `data/trucks.json` until the real contents are final. Photos go in `images/<apparatus>/`.
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
- When the spec changes, update `docs/SPEC.md` in the same change.
