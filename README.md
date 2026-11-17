# Truck Inventory

Barcode/QR-based truck cabinet inventory for Zebra ET40/ET45 tablets.

## Scanner proof of concept

`index.html` is a standalone test page. It shows whether the tablet's built-in scanner can send data into a web app through DataWedge keystroke output, with no changes to the device.

Live page: https://firetools604.github.io/truck-inventory/

### How to test

1. Open the live page in Chrome on the tablet.
2. Tap the status bar until it turns green ("Listening for scans").
3. Press the scan button and scan any barcode or QR code.
4. The data shows under **Last scan** and is added to the log.

The "Ended with" tag shows whether DataWedge sends an Enter after each scan. The page handles both cases.

### Proposed cabinet label format

`DEPT-UNIT-C##`, for example `AFD-E1-C03` (Agassiz Fire Department, Engine 1, Cabinet 3). The page splits this into its parts to show how a scan maps to a cabinet.

### If scans don't arrive

1. Scan in the **DWDemo** app. If that works, the scanner is fine and the problem is the browser profile.
2. In **DataWedge → Profile0** (or a Chrome-specific profile, if one exists), check the profile is enabled, Barcode input is on and Keystroke output is enabled.
3. If data arrives broken up, turn off "Hide on-screen keyboard" on the page or raise the inter-character delay in Keystroke output.
4. If DataWedge is locked or Profile0 is disabled, it's an MDM/admin setting and the device owner will need to change it.

The scan log is kept only in that browser's local storage. It is not shared between devices.
