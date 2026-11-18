# Truck Inventory Check

Cabinet-by-cabinet apparatus inventory check for Agassiz Fire Department, run on the dispatcher's Zebra ET40/ET45 tablets using their built-in scanner.

Live page: https://firetools604.github.io/truck-inventory/

- Spec: [`docs/SPEC.md`](docs/SPEC.md)
- Instructions for coding sessions: [`CLAUDE.md`](CLAUDE.md)
- Scanner test: https://firetools604.github.io/truck-inventory/scan-test.html

## Status

| Phase | Status |
| --- | --- |
| 0. Scanner test | Done 17 Nov 2026 |
| 1. Click-through prototype, sample data for S1 | Done 18 Nov 2026 |
| 2. Test data sized to the real truck | Done 18 Nov 2026 |
| 3. UI refinement | Next |
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
| `data/trucks.json` | Master list. Test data for S1 only (L1 to L4, R1 to R4), sized to the real truck |
| `images/S1/` | Cabinet photos. Test placeholders for now |
| `scan-test.html` | Phase 0 scanner test page |

## Phase 2 test on the tablet

Same run as phase 1, on the larger test data. Cabinets are still picked by hand. Scanning comes in phase 4.

Before starting: if a check from phase 1 is still in progress, discard it. A check keeps the list it started with, so an old check won't show the new cabinets.

What the test data covers:

| Cabinet | What to look at |
| --- | --- |
| L1 | 10 items, two with 6 sub-checks, long names, 4 photos |
| L2 | 9 items, generator with 5 sub-checks, 3 photos |
| L3 | 10 items, no sub-checks, longest names, 5 photos |
| L4 | Mostly consumables (Low button), 2 photos |
| R1 | Med kit with "Check expiries", AED, oxygen kit, qty 24 water |
| R2 | 10 items with inch marks and commas in the names (CSV test) |
| R3 | Qty 12 items, long sign name, 2 photos |
| R4 | Only 2 items and 1 photo |

Done when every screen works at this size on the tablet. Check in particular:

- Cabinet screen: photos swipe, item names wrap, Pass/Fail buttons stay usable with 6 sub-checks, Cabinet complete stays visible at the bottom.
- Truck summary: long failed sub-check lists and notes stay readable.
- Try the tablet both portrait and landscape.
- Open the exported CSV and check the R2 names come through intact.

## Phase 1 test on the tablet

1. Open the live page in Chrome on the tablet.
2. Pick **S1**, enter a name and FF#, tap **Start check**.
3. Tap a cabinet. Swipe the photos. Mark each item Present, Missing or Low. Mark sub-checks Pass or Fail. Add a note or an extra item.
4. Tap **Cabinet complete**. It stays grey until every item and sub-check is marked; tapping it jumps to the first unchecked item.
5. Leave at least one cabinet unchecked, then tap **Finish and review**. Check the Not checked, Outstanding, Extra and Low stock lists.
6. Tap **Complete check** twice. The Log screen opens.
7. Tap **Export CSV**. The file lands in Downloads.
8. Also try: reload Chrome mid-check (the check should resume), and the Android back button (should step back one screen).

Done when a full check runs from Start to Log and the CSV exports.

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
