# Truck Inventory Check

Cabinet-by-cabinet apparatus inventory check for Agassiz Fire Department, run on the dispatcher's Zebra ET40/ET45 tablets using their built-in scanner.

Live page: https://firetools604.github.io/truck-inventory/

- Spec: [`docs/SPEC.md`](docs/SPEC.md)
- Instructions for coding sessions: [`CLAUDE.md`](CLAUDE.md)

## Status

| Phase | Status |
| --- | --- |
| 0. Scanner test | Done 17 Nov 2026 |
| 1. Click-through prototype, sample data for E1 | Next |
| 2. Scanning in the flow, test QR labels | |
| 3. Real data for E1, one duty-weekend check | |
| 4. E1-2, R1, S1, T1 | |

## Scanner test (current index.html)

Shows whether the tablet's scanner can send data into a web app through DataWedge keystroke output, with no changes to the device. In phase 1 it moves to `scan-test.html` and the app takes over `index.html`.

1. Open the live page in Chrome on the tablet.
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
