# Truck Inventory Check

Cabinet-by-cabinet apparatus inventory check for Agassiz Fire Department, run on the department's Zebra ET40/ET45 tablets (software and OS managed by dispatch) using their built-in scanner.

Live page: https://firetools604.github.io/truck-inventory/

- Spec: [`docs/SPEC.md`](docs/SPEC.md)
- Phase 3 work list: [`docs/PHASE3.md`](docs/PHASE3.md)
- Instructions for coding sessions: [`CLAUDE.md`](CLAUDE.md)
- Scanner test: https://firetools604.github.io/truck-inventory/scan-test.html

## Status

| Phase | Status |
| --- | --- |
| 0. Scanner test | Done 17 Nov 2026 |
| 1. Click-through prototype, sample data for S1 | Done 18 Nov 2026 |
| 2. Test data sized to the real truck | Done 18 Nov 2026 |
| 3. UI refinement | In progress. Work list: [`docs/PHASE3.md`](docs/PHASE3.md) |
| 4. Scanning in the flow, test QR labels | |
| 5. Ready for real data: template, photo rules, clear test checks, crew trial | |
| 6. Real data for S1 after the retrofit, first duty-weekend check | |
| 7. E1, E1-2, R1, T1 | |

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The app |
| `css/app.css` | Styles |
| `js/app.js` | App logic: screens, check data, CSV export |
| `data/trucks.json` | Master list. Short test set for S1 (L1, L2, R1, R2), loaded by default |
| `data/trucks-full.json` | Full-size test set for S1 (L1 to L4, R1 to R4). Load with `?data=full` |
| `fonts/` | Bebas Neue, DM Sans, JetBrains Mono (SIL Open Font License). Same fonts as the SCBA tracker, stored here |
| `images/S1/` | Cabinet photos. Real S1 photos for L1, L2, R1, R2; placeholders for L3, L4, R3, R4 |
| `scan-test.html` | Phase 0 scanner test page |

## Testing on the tablet

Two test sets. Cabinets are picked by hand until phase 4.

| Link | Data |
| --- | --- |
| https://firetools604.github.io/truck-inventory/ | Short set: 4 cabinets, 14 items. For quick runs |
| https://firetools604.github.io/truck-inventory/?data=full | Full-size set: 8 cabinets, 62 items. Run once per batch to check nothing breaks at full size |

After an update is merged:

1. Wait a few minutes for GitHub Pages to publish, then reload the page.
2. Check **App version** at the bottom of the Start screen matches the version in the pull request. If it doesn't, wait a few more minutes and reload again.
3. Discard any check in progress. A check keeps the list it started with.

**Quick run (short set)**

1. Pick **S1**, enter a name and FF#, tap **Start check**.
2. **L1:** mark the chainsaw Present and work its 6 sub-checks. The list collapses when the last one is marked; tap **Show** to change one. Set the fuel can to 50% (flags restock) and bar oil to 75%.
3. **L2:** count items. Tap − on floor dry (counts down from full), type a count for absorbent pads below 10 (flags restock), try **All 20**.
4. **R1:** med kit "Check expiries", AED sub-checks, water bottles count.
5. **R2:** leave part done.
6. **Finish and review:** check Not checked, Outstanding and Low stock.
7. **Complete check** twice, then **Export CSV**. The `found` column has counts and levels.
8. Also try: reload Chrome mid-check (the check should resume), and the Android back button (steps back one screen; with a photo full screen it closes the photo).

**Full-size set** covers: L1 and L3 at 10 items, two items with 6 sub-checks, long names, 1 to 7 photos per cabinet, R2 names with inch marks and commas (CSV test), R4 with 2 items and 1 photo.

## Data on the tablet

The check in progress and the completed-check log are kept in Chrome's local storage on that tablet (`afd-truck-check-active`, `afd-truck-check-log`). Clearing Chrome's site data wipes them, and two tablets never see each other's checks. Export after every completed check.

## Testing on a computer

The app loads `data/trucks.json` with `fetch`, so opening `index.html` straight from disk won't work. Serve the folder instead, for example `python3 -m http.server` in the repo folder, then open http://localhost:8000.

## Scanner test (scan-test.html)

Shows whether the tablet's scanner can send data into a web app through DataWedge keystroke output, with no changes to the device.

1. Open https://firetools604.github.io/truck-inventory/scan-test.html in Chrome on the tablet.
2. Tap the status bar until it turns green ("Listening for scans").
3. Press the scan button and scan any barcode or QR code.
4. The data shows under **Last scan** and is added to the log.

The "Ended with" tag shows whether DataWedge sends an Enter after each scan. The page handles both.

### If scans don't arrive

1. Scan in the **DWDemo** app. If that works, the scanner is fine and the problem is the browser profile.
2. In **DataWedge → Profile0** (or a Chrome-specific profile, if one exists), check the profile is enabled, Barcode input is on and Keystroke output is enabled.
3. If data arrives broken up, turn off "Hide on-screen keyboard" on the page or raise the inter-character delay in Keystroke output.
4. If DataWedge is locked or Profile0 is disabled, it's an MDM/admin setting and the device owner will need to change it.

Scan logs are kept only in that browser's local storage. They are not shared between devices.
