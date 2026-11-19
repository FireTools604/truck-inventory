# Truck Inventory Check – Project Spec

Last updated 2026-11-19. This file is the master copy of the spec. Every chat in the Truck Inventory Check Project reads it from the repo. The old Claude doc "Truck Inventory Check – Project Spec" is retired and no longer kept up to date.

## Purpose and scope

A standalone web app that walks a crew through a full apparatus inventory check, cabinet by cabinet, using the scanner built into the Zebra ET40/ET45 tablet. The first goal is a working proof of concept on one apparatus.

- **Apparatus:** E1, E1-2, R1, S1, T1. SPU excluded for now.
- **Codes:** cabinets get a QR label. Individual items do not.
- **Frequency:** every 5 weeks, during the duty weekend.
- **Standalone:** no link to the SCBA tracker, the clothing inventory or FireTrack. Integration gets looked at once the app is deployed, tested and has buy-in from the floor (19 Nov 2026). Matching the SCBA tracker's look is fine.
- **Proof of concept is done when:** a crew member can run a full check on one apparatus on the tablet, from start screen to truck summary, by scanning real cabinet labels, and export the log.

## Constraints and decisions

The tablets run on the fire hall Wi-Fi. Dispatch manages their software and OS, so any change to the device goes through them. The whole app has to work in Chrome with no installs and no device settings changed.

| Decision | Reason |
| --- | --- |
| Web app hosted on GitHub Pages (FireTools604/truck-inventory) | No app install or device admin needed. Same approach as the SCBA tracker. |
| Scanner input through DataWedge Profile0 keystroke output | Tested 17 Nov 2026 with the scan test page: scans reach Chrome with no device changes. |
| Zebra ET40/ET45 only | Integrated scanner. Phones are out of scope for now. |
| Plain HTML, CSS and JavaScript, no build step, no external services | Easy to host, edit and hand over. Matches the SCBA tracker. |
| Check data stored on the tablet (localStorage) | No backend for the proof of concept. Same as the SCBA log. |
| Master list held as sample data in the repo | Final truck contents are still being decided. |
| Exports pulled from the tablet itself | Report summaries reach a phone by QR code (phase 7, decided 19 Nov 2026). Getting the CSV off the tablet is still open. |
| Tablet held portrait | The scanner reads out of the top short edge. Layouts are built and checked in portrait first (19 Nov 2026). |
| Look matches the SCBA tracker; fonts stored in the repo | Same look as the other FireTools604 app. Fonts in `fonts/` (SIL Open Font License) instead of Google Fonts, so no external service. |

localStorage belongs to one browser on one tablet. Clearing Chrome's site data wipes the log, and two tablets never see each other's checks. Export after every completed check.

## Check workflow

One crew member, one tablet, one apparatus per check: pick the truck, scan each cabinet, work its checklist, then close the truck out. Finish and review sits on the scanner screen and is available at any time, even with cabinets left unchecked.

```
Start check (pick apparatus, name, FF#)
  -> Scanner screen (cabinet list and status)
       -> scan cabinet -> Cabinet screen -> confirm cabinet complete -> back to Scanner screen
       -> Finish and review -> Truck summary (not checked, outstanding, extra, low stock) -> Complete -> Saved to log
```

## Screens

| Screen | What it does | What's on it |
| --- | --- | --- |
| Start | Opens a new check | Apparatus buttons (E1, E1-2, R1, S1, T1). Name and FF#. Date and time filled in automatically. |
| Scanner | Home base for the check | "Scan a cabinet" prompt. List of that apparatus's cabinets showing not started, in progress or done. Manual cabinet pick if a label won't scan. Finish and review button, available any time. |
| Cabinet | Checking one cabinet | Top third: cabinet photos, swiped through (whole cabinet first, then each shelf or drawer). Tap a photo to see it full screen. Bottom two thirds: the checklist. Cabinet complete button. |
| Truck summary | Review before closing the check | Not checked cabinets at the top, then outstanding items and low stock, grouped by cabinet. Complete check button. |
| Log | Past checks on this tablet | Checks listed newest first. Export CSV button. |

**Look** (19 Nov 2026). Matches the SCBA tracker: dark theme, red accent, Bebas Neue headings, DM Sans text, JetBrains Mono for label and check IDs, red primary buttons, status colours green (done, Present, pass), amber (in progress, Low, still to check) and red (Missing, fail). Sizes stay set for a tablet used standing at the truck: 17 px body text, buttons at least 48 px. No link to the SCBA tracker.

**Cabinet checklist.** Every item that belongs in the cabinet is listed with its expected quantity.

- Each item is marked **Present** or **Missing**.
- **Consumables** are one of two types. Status is set from what the crew enters; nobody picks Low by hand.
  - **Count** (water bottles, floor dry): the crew enters how many are there, with − and + buttons, by typing, or "All" for a full count. Each item has a full quantity and a minimum. Below the minimum is **Low**. Zero is **Missing**.
  - **Level** (fuel, bar oil): the crew picks 25%, 50%, 75% or 100%, or Missing. Each item has a restock point. At or below it is **Low**. Placeholder restock point is 50% until real items are set.
  - The minimums and restock points in the test data are placeholders.
- Items that need a detailed check expand into a sub-list. Example: chainsaw → bar oil level, fuel level, chain tension. Each sub-check is marked pass or fail. An item marked Present or Low isn't checked until all its sub-checks are marked. Missing items skip their sub-checks.
- Once every sub-check is marked, the list collapses to one line ("All 6 sub-checks passed" or "1 of 6 sub-checks failed: Chain tension"). **Show** opens it again to make a change; **Hide sub-checks** closes it.
- Any item can take a short note.
- **Add extra item** is off for now (decided 18 Nov 2026). It may come back. Older checks that recorded extras still show and export them.
- Cabinet complete is allowed once every item has a status. Unchecked items stay highlighted until then.
- A cabinet can be reopened after it's complete. If a change leaves an item unchecked, the cabinet goes back to in progress.
- **Kits** (the med kit) are one item with a "Check expiries" sub-check for now. A kit page of its own comes later (see Not in this build).

**Cabinet photos**

- Swipe through them in the strip at the top of the cabinet screen. Caption and "x/y" show which one is up.
- Tap a photo to open it full screen (decided 19 Nov 2026). Swipe through the cabinet's photos there too. **Minimize**, or the tablet's Back button, returns to the cabinet screen as it was, with the strip on the last photo viewed.
- The first two photos load when the cabinet opens; the rest load as the crew swipes to them.

**Truck summary** lists:

- **Not checked:** cabinets not marked complete, shown at the top as "Not started" or "In progress, x of y items". The check can still be completed.
- **Outstanding:** missing items and failed sub-checks.
- **Low stock:** count items below their minimum, level items at or below their restock point.
- **Extra:** only shown for older checks that recorded extra items.

## Cabinet labels and scanning

Each cabinet gets one QR label holding a fixed ID. The app looks the ID up in the master list, so the label never needs to change when the cabinet's contents do.

- **ID format (proposed):** `AFD-<apparatus>-<cabinet>`, for example `AFD-E1-L2` or `AFD-E1-2-R1`. The app matches the whole string, so the hyphen in E1-2 is not a problem.
- **Cabinet codes:** the department's existing compartment calls. L1, L2… driver side, front to back (L1 = driver side front); R1, R2… passenger side, front to back.
- **QR over 1D barcode:** reads at any angle, holds the full ID, and stays readable when partly worn.
- **Once a label is on a truck, its ID doesn't change.** If a cabinet's contents change, update the master list, not the label.

**How a scan is handled**

- A hidden text field keeps focus so DataWedge can type into it. The on-screen keyboard stays hidden (`inputmode="none"`).
- A scan is complete on Enter or Tab, or after a short pause (about 250 ms) if DataWedge sends neither. `scan-test.html` already does this.
- Scans are only taken on the Scanner screen (cabinet select). Scanning a cabinet label there opens that cabinet's screen.
- A scan on any other screen, including the cabinet screen and full-screen photos, is ignored (decided 19 Nov 2026). The hidden scan field only needs focus on the Scanner screen.

## Data model

The master list (what should be on each truck) is a JSON file in the repo, `data/trucks.json`, with photos in `images/`. Check results are saved on the tablet.

**Photo files** (set 19 Nov 2026 from the first sample photos)

- JPEG, longest side 1600 px, under 300 KB each, no location or camera data. Photos straight off a phone (several MB) get resized before they go in the repo.
- At that size the 19 sample photos come to about 4 MB, 160 to 290 KB each.
- Stored in `images/<apparatus>/`. Whole-cabinet shot named for the cabinet (`L1.jpg`), close-ups after it (`L1-Drawer_1.jpg`, `L1-Top_Shelf.jpg`).

**Master list**

| Record | Fields |
| --- | --- |
| Apparatus | ID (E1), name, list of cabinets |
| Cabinet | Label ID (`AFD-E1-L2`), apparatus, display name ("Driver side 2"), photos in swipe order, list of items |
| Item | ID, name, type (plain, count or level), expected quantity (full quantity for count items), minimum (count items), restock point in % (level items), list of sub-checks |
| Sub-check | ID, label ("Bar oil level") |

Expected size: up to about 10 items per cabinet and up to 6 sub-checks per item. Test data and screen layouts are built to that size.

**Check results**

| Record | Fields |
| --- | --- |
| Check | Check ID, apparatus, name, FF#, start time, completed time |
| Cabinet result | Check ID, cabinet, opened time, completed time |
| Item result | Check ID, cabinet, item, status (Present / Missing / Low), found (count or level %), sub-check results (pass / fail), note |
| Extra item | Check ID, cabinet, description, quantity, note. Older checks only while Add extra item is off. |

Until the real list exists, there are two test sets for S1:

- `data/trucks.json`, loaded by default: short set for quick runs. 4 cabinets (L1, L2, R1, R2), 14 items, one of each item type.
- `data/trucks-full.json`, loaded by adding `?data=full` to the address: full-size set from phase 2. 8 cabinets (L1 to L4, R1 to R4), up to 10 items per cabinet, up to 6 sub-checks per item.
- Photos: L1, L2, R1 and R2 in both sets use real AFD cabinet photos (3 to 7 per cabinet), filed under `images/S1/`. They are samples taken from several trucks, picked because they had good multi-photo sets. They are not S1's cabinets. Allan supplies S1's own photos when the real data goes in (phase 6). L3, L4, R3 and R4 in the full set keep placeholder images. The test items don't match what's in the photos.

The real list gets loaded once truck contents are finalized. Each check keeps a copy of the apparatus's master list from when it started, so editing `data/trucks.json` mid-check doesn't break it.

## Check log and export

Same approach as the SCBA log: completed checks are kept on the tablet and exported as one flat CSV, one row per item checked.

```csv
check_id,date,apparatus,name,ff_number,cabinet,item,expected_qty,found,status,failed_subchecks,note
E1-20261206-0915,2026-12-06,E1,J. Smith,123,AFD-E1-L2,Chainsaw,1,,Present,Chain tension,Chain loose
E1-20261206-0915,2026-12-06,E1,J. Smith,123,AFD-E1-L2,Floor dry,4,1,Low,,
E1-20261206-0915,2026-12-06,E1,J. Smith,123,AFD-E1-L2,Mixed fuel can,1,50%,Low,,
```

- Export CSV on the Log screen downloads the file to the tablet's Downloads folder.
- `found` is the count for count items and the level ("50%") for level items. Blank for other items.
- Extra items from older checks go in the same file with status Extra and the quantity in `found`.
- Items in cabinets that weren't checked go in with status Not checked.
- Column set is a starting point. The readable report and PDF come in phase 7.

## Build phases

Each phase is tested on the tablet before the next one starts.

S1 is waiting on its retrofit, so its real master list doesn't exist yet. Phases 2 to 5 build and refine the app on test data. Phase 6 loads the real contents once S1's equipment is confirmed.

0. **Scanner test** – done 17 Nov 2026. Scans reach a web page in Chrome with no device changes.
1. **Click-through prototype** – done 18 Nov 2026. All five screens working with sample data for S1 (cabinets L1, L2, R1, R2, placeholder photos). Cabinets picked by hand. Start to Log runs and the CSV exports.
2. **Test data sized to the real truck** – done 18 Nov 2026. Replace the S1 sample data with test cabinets at the expected size: up to 10 items per cabinet, items with up to 6 sub-checks, long item names, several photos per cabinet, and a med kit as one item with a "Check expiries" sub-check. *Done when:* every screen works at that size on the tablet.
3. **UI refinement** – done 19 Nov 2026, signed off by Allan. Short test set, sub-check collapse, count and level consumables, real sample photos with tap for full screen, SCBA tracker look, tablet held portrait. Record of the batches in `docs/PHASE3.md`. Cosmetic changes may be revisited once the project is done.
4. **Scanning in the flow.** Print test QR labels for the test cabinets. Add scan handling. *Done when:* a check on S1 test data is completed by scanning labels only.
   - Scans only count on the Scanner screen (see Cabinet labels and scanning). Test that a stray scan on the cabinet screen or a full-screen photo does nothing.
   - The hidden scan field must have focus again whenever the Scanner screen shows, including after typing a name or a count elsewhere.
5. **Ready for real data.**
   - Master list template: a spreadsheet, one row per item (apparatus, cabinet, item, type, expected quantity, minimum or restock point, sub-checks), converted to `data/trucks.json`.
   - Photo rules for whoever takes the cabinet photos (whole cabinet first, then each shelf or drawer; taken from where the crew stands; file size as under Data model). Portrait or landscape photos still to settle: with the tablet held portrait, the photo strip is wide and short, so landscape photos fill it and tall portrait shots (whole cabinet of a tall compartment) show narrow. Full screen shows either well.
   - Real minimums and restock points per item, set in the template.
   - A way to clear or mark test checks so they don't end up in real exports.
   - Crew trial: one or two members run a check on test data and give feedback.

   *Done when:* the template is agreed, the photo rules are written, test checks can be cleared and crew trial feedback is in.
6. **Real data for S1.** After the retrofit: fill in the template, load S1's contents, sub-checks and photos, fit permanent labels. *Done when:* one real duty-weekend check is completed and crew feedback is collected.
7. **Reports and QR handoff.** Added 19 Nov 2026. Doesn't need S1's real data, so it can start any time after phase 4.
   - **Report screen** for a completed check. Opens straight after Complete check, and from any check on the Log screen.
   - **Report contents:** apparatus, date, start and finish times, name and FF#. Summary counts (cabinets checked and not checked, items missing, low, failed sub-checks). Discrepancies grouped by cabinet: not checked, missing, failed sub-checks, low stock, with notes. Full item list at the end.
   - **PDF:** made with the browser's own print and a print stylesheet ("Save as PDF" in Chrome's print dialog). No library. Test on the tablet first. If print isn't available there, ask Allan before adding a PDF library.
   - **QR handoff:** the report screen shows a QR code holding the discrepancy summary. The officer scans it with their own phone and sends it on by text, WhatsApp or email. Nothing installed or signed in on the tablet. Works offline.
   - QR code generator written into `js/app.js`. No library unless Allan agrees.
   - **To settle in this phase:**
     - What the QR code holds: plain text the phone can copy and send, or a link to a report page on the GitHub Pages site with the results carried in the link (the phone opens a formatted report and can save the PDF itself; nothing is sent to a server). A report page is a second page and needs Allan's OK.
     - Size: the code has to read reliably off the tablet screen with a phone camera. If the summary doesn't fit, split it across numbered codes (1 of 2) or trim it to counts and the first items.
     - Test with the phones the crew actually carry (Android and iPhone camera apps handle text codes differently).

   *Done when:* after a completed check on test data, the report shows on the tablet, saves as a PDF, and the summary reaches a phone by QR scan and is sent on from it.
8. **Remaining apparatus.** E1, E1-2, R1, T1: master list, photos and labels for each.

## Not in this build

- SPU equipment and trailer.
- Barcodes or tags on individual items.
- Sharing data between tablets, or a central database.
- Report formats beyond the CSV log, the report screen and its PDF (phase 7).
- Sending reports automatically (email, WhatsApp, push alerts). Options looked at 19 Nov 2026: share to Gmail or WhatsApp from the tablet (needs an account signed in on the tablet), a Google Apps Script relay to email it and file it in Drive or a Sheet, and push alerts through ntfy or Teams. QR handoff chosen for now. Revisit after phase 7.
- First Due, FireTrack, the SCBA tracker and the clothing inventory.
- Phones, iOS and laptops.
- Logins or user accounts. Name and FF# are entered per check.
- Adding extra items found in a cabinet (off for now, may come back).
- Kit pages and expiry tracking. Later, tapping the med kit could open its own page, like a sub-cabinet: a med kit master list by bag compartment, with expiry dates tracked. Needs its own scoping.

## Open items

- [ ] Final contents for each apparatus and cabinet (the master list)
- [ ] Codes for any rear or top compartments (L and R cover the sides)
- [x] Other check details on the Start screen: name and FF# only for now (decided 18 Nov 2026)
- [ ] Add a Damaged / needs repair status, or leave that to notes and failed sub-checks?
- [x] Can a truck be completed with cabinets unchecked? Yes. Finish and review is available any time; unchecked cabinets show at the top of the truck summary as "Not checked" (decided 18 Nov 2026)
- [ ] Label material and printing (laminated, like the SPU bin labels?)
- [ ] Who takes the cabinet and shelf photos
- [ ] How exported CSVs get off the tablet. Report summaries go by QR code (phase 7); the full CSV is still open.
- [ ] What the report QR code holds: plain text or a link to a report page (settle in phase 7)
- [ ] Dispatcher OK to use the tablets on duty weekends
- [ ] Med kit master list (by bag compartment) and expiry tracker: scope later
- [x] Tablet held portrait or landscape at the truck? Portrait (decided 19 Nov 2026). The scanner reads out of the top short edge, so the crew holds it upright. Screens are laid out for portrait; landscape still works but shows only about two items under the photos.
- [ ] Log size: one completed check at test size is about 14 KB in localStorage. Chrome allows about 5 MB per site, and every FireTools604 page on GitHub Pages shares that site's storage. Decide in phase 5 whether to prune exported checks.
