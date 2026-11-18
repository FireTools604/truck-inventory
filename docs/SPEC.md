# Truck Inventory Check – Project Spec

Last updated 2026-11-18. Living version: the Claude doc "Truck Inventory Check – Project Spec". Keep this file in step with it.

## Purpose and scope

A standalone web app that walks a crew through a full apparatus inventory check, cabinet by cabinet, using the scanner built into the Zebra ET40/ET45 tablet. The first goal is a working proof of concept on one apparatus.

- **Apparatus:** E1, E1-2, R1, S1, T1. SPU excluded for now.
- **Codes:** cabinets get a QR label. Individual items do not.
- **Frequency:** every 5 weeks, during the duty weekend.
- **Standalone:** no link to the SCBA tracker, the clothing inventory or FireTrack. Integration can come later.
- **Proof of concept is done when:** a crew member can run a full check on one apparatus on the tablet, from start screen to truck summary, by scanning real cabinet labels, and export the log.

## Constraints and decisions

The tablet belongs to the dispatcher, so the whole app has to work in Chrome with no installs and no device settings changed.

| Decision | Reason |
| --- | --- |
| Web app hosted on GitHub Pages (FireTools604/truck-inventory) | No app install or device admin needed. Same approach as the SCBA tracker. |
| Scanner input through DataWedge Profile0 keystroke output | Tested 17 Nov 2026 with the scan test page: scans reach Chrome with no device changes. |
| Zebra ET40/ET45 only | Integrated scanner. Phones are out of scope for now. |
| Plain HTML, CSS and JavaScript, no build step, no external services | Easy to host, edit and hand over. Matches the SCBA tracker. |
| Check data stored on the tablet (localStorage) | No backend for the proof of concept. Same as the SCBA log. |
| Master list held as sample data in the repo | Final truck contents are still being decided. |
| Exports pulled from the tablet itself | Getting reports off the device is a later decision. |

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
| Cabinet | Checking one cabinet | Top third: cabinet photos, swiped through (whole cabinet first, then each shelf or drawer). Bottom two thirds: the checklist. Add extra item button. Cabinet complete button. |
| Truck summary | Review before closing the check | Not checked cabinets at the top, then outstanding items, extra items and low stock, grouped by cabinet. Complete check button. |
| Log | Past checks on this tablet | Checks listed newest first. Export CSV button. |

**Cabinet checklist.** Every item that belongs in the cabinet is listed with its expected quantity.

- Each item is marked **Present** or **Missing**. Consumables (floor dry, water bottles) can also be marked **Low**.
- Items that need a detailed check expand into a sub-list. Example: chainsaw → bar oil level, fuel level, chain tension. Each sub-check is marked pass or fail. An item marked Present or Low isn't checked until all its sub-checks are marked. Missing items skip their sub-checks.
- Any item can take a short note.
- **Add extra item** records something found in the cabinet that isn't on its list.
- Cabinet complete is allowed once every item has a status. Unchecked items stay highlighted until then.
- A cabinet can be reopened after it's complete. If a change leaves an item unchecked, the cabinet goes back to in progress.

**Truck summary** lists:

- **Not checked:** cabinets not marked complete, shown at the top as "Not started" or "In progress, x of y items". The check can still be completed.
- **Outstanding:** missing items and failed sub-checks.
- **Extra:** items added on the cabinet screen.
- **Low stock:** consumables marked Low.

## Cabinet labels and scanning

Each cabinet gets one QR label holding a fixed ID. The app looks the ID up in the master list, so the label never needs to change when the cabinet's contents do.

- **ID format (proposed):** `AFD-<apparatus>-<cabinet>`, for example `AFD-E1-L2` or `AFD-E1-2-R1`. The app matches the whole string, so the hyphen in E1-2 is not a problem.
- **Cabinet codes:** the department's existing compartment calls. L1, L2… driver side, front to back (L1 = driver side front); R1, R2… passenger side, front to back.
- **QR over 1D barcode:** reads at any angle, holds the full ID, and stays readable when partly worn.
- **Once a label is on a truck, its ID doesn't change.** If a cabinet's contents change, update the master list, not the label.

**How a scan is handled**

- A hidden text field keeps focus so DataWedge can type into it. The on-screen keyboard stays hidden (`inputmode="none"`).
- A scan is complete on Enter or Tab, or after a short pause (about 250 ms) if DataWedge sends neither. `scan-test.html` already does this.
- Scanning a cabinet label opens that cabinet's screen.
- Scan while on a cabinet screen: if it's the same cabinet, nothing happens. If it's a different cabinet, ask before leaving the current one.

## Data model

The master list (what should be on each truck) is a JSON file in the repo, `data/trucks.json`, with photos in `images/`. Check results are saved on the tablet.

**Master list**

| Record | Fields |
| --- | --- |
| Apparatus | ID (E1), name, list of cabinets |
| Cabinet | Label ID (`AFD-E1-L2`), apparatus, display name ("Driver side 2"), photos in swipe order, list of items |
| Item | ID, name, expected quantity, consumable yes/no (allows Low), list of sub-checks |
| Sub-check | ID, label ("Bar oil level") |

**Check results**

| Record | Fields |
| --- | --- |
| Check | Check ID, apparatus, name, FF#, start time, completed time |
| Cabinet result | Check ID, cabinet, opened time, completed time |
| Item result | Check ID, cabinet, item, status (Present / Missing / Low), sub-check results (pass / fail), note |
| Extra item | Check ID, cabinet, description, quantity, note |

For the proof of concept the master list holds sample data for S1 (cabinets L1, L2, R1, R2, placeholder photos). The real list gets loaded once truck contents are finalized. Each check keeps a copy of the apparatus's master list from when it started, so editing `data/trucks.json` mid-check doesn't break it.

## Check log and export

Same approach as the SCBA log: completed checks are kept on the tablet and exported as one flat CSV, one row per item checked.

```csv
check_id,date,apparatus,name,ff_number,cabinet,item,expected_qty,status,failed_subchecks,note
E1-20261206-0915,2026-12-06,E1,J. Smith,123,AFD-E1-L2,Chainsaw,1,Present,Chain tension,Chain loose
E1-20261206-0915,2026-12-06,E1,J. Smith,123,AFD-E1-L2,Floor dry,2,Low,,One bag left
E1-20261206-0915,2026-12-06,E1,J. Smith,123,AFD-E1-L2,Pry bar,,Extra,,Qty 1; Not on list
```

- Export CSV on the Log screen downloads the file to the tablet's Downloads folder.
- Extra items go in the same file with status Extra. The quantity found goes at the start of the note ("Qty 1; Not on list").
- Items in cabinets that weren't checked go in with status Not checked.
- Column set is a starting point. Report format gets settled later.

## Build phases

Each phase is tested on the tablet before the next one starts.

0. **Scanner test** – done 17 Nov 2026. Scans reach a web page in Chrome with no device changes.
1. **Click-through prototype.** All five screens working with sample data for S1 (cabinets L1, L2, R1, R2, placeholder photos). Cabinets picked by hand. *Done when:* a full check runs from Start to Log and the CSV exports.
2. **Scanning in the flow.** Print test QR labels for the sample cabinets. Add scan handling. *Done when:* a check on S1 is completed by scanning labels only.
3. **Real data for one apparatus.** Load S1's actual contents, sub-checks and photos. Fit permanent labels. *Done when:* one real duty-weekend check is completed and crew feedback is collected.
4. **Remaining apparatus.** E1, E1-2, R1, T1: master list, photos and labels for each.

## Not in this build

- SPU equipment and trailer.
- Barcodes or tags on individual items.
- Sharing data between tablets, or a central database.
- Report formats beyond the CSV log.
- First Due, FireTrack, the SCBA tracker and the clothing inventory.
- Phones, iOS and laptops.
- Logins or user accounts. Name and FF# are entered per check.

## Open items

- [ ] Final contents for each apparatus and cabinet (the master list)
- [ ] Codes for any rear or top compartments (L and R cover the sides)
- [x] Other check details on the Start screen: name and FF# only for now (decided 18 Nov 2026)
- [ ] Add a Damaged / needs repair status, or leave that to notes and failed sub-checks?
- [x] Can a truck be completed with cabinets unchecked? Yes. Finish and review is available any time; unchecked cabinets show at the top of the truck summary as "Not checked" (decided 18 Nov 2026)
- [ ] Label material and printing (laminated, like the SPU bin labels?)
- [ ] Who takes the cabinet and shelf photos
- [ ] How exported CSVs get off the tablet
- [ ] Dispatcher OK to use the tablets on duty weekends
