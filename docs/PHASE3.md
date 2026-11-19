# Phase 3 – UI refinement: work list

**Phase 3 done 19 Nov 2026. Signed off by Allan.** This file is now a record of the batches. Open items carried into phases 4 and 5 are in `docs/SPEC.md` under Build phases.

Phase 3 in `docs/SPEC.md`.

**How it runs**

- Changes go in batches of 3 to 6, one pull request each.
- Each batch is tested on the tablet and merged before the next starts. Ticked here when merged.
- New ideas from testing go under Backlog, not into the batch in progress.
- Spec changes go into `docs/SPEC.md` in the same pull request.
- Phase 3 is done when Allan runs a full check on the tablet with nothing left on this list and signs off.

Quick runs use the short test set (default). Run the full-size set (`?data=full`) at least once per batch to check nothing breaks at full size.

## Batch 1 – quick test truck, sub-checks, consumables, extra items

Done 18 Nov 2026. Tested on the tablet by Allan (PR #8, cache fix PR #9, app version 2026-11-18b).

- [x] Short test set (4 cabinets, 14 items) for quick runs. Full-size set kept at `?data=full`.
- [x] Sub-checks collapse to one line once all are marked. Show / Hide to change them.
- [x] Consumables: count items (count found, minimum flags Low, zero is Missing) and level items (25/50/75/100%, restock point flags Low). Placeholder minimums; restock point 50%.
- [x] Add extra item removed for now.
- [x] Tablet test and merge.

## Batch 2 – photos

Done 19 Nov 2026. Tested on the tablet by Allan (PR #11, app version 2026-11-19a). Photos from Allan: 19 sample photos from several trucks, loaded as S1's L1, L2, R1 and R2. S1's own photos come with the real data.

- [x] Load real photos into the test data. L1, L2, R1 and R2 in both sets. Checked in the photo strip, portrait and landscape, in a desktop browser at tablet size.
- [x] Set a size limit for photos: JPEG, longest side 1600 px, under 300 KB. In `docs/SPEC.md`; feeds the phase 5 photo rules.
- [x] Tap a photo to see it full screen: yes. Swipe through the cabinet's photos; Minimize or Back returns to the cabinet screen on the last photo viewed.
- [x] Check load time on the tablet: photos load fine on the fire hall Wi-Fi, which the tablets use.
- [x] Tablet test and merge.

## Batch 3 – look and feel

Done 19 Nov 2026. Tested on the tablet by Allan (PR #13, app version 2026-11-19b). Decided 19 Nov 2026: match the SCBA tracker's look only. No link between the apps. Cosmetic changes may be revisited once the project is done.

- [x] Colours and colour scheme: SCBA tracker palette (dark, red accent). Green, amber and red status colours from the same palette.
- [x] Button shapes and sizes: SCBA rounded buttons, red primary buttons in Bebas Neue. Kept at 48 px or more for the tablet.
- [x] Overall look, matched to the SCBA tracker: header with red logo tile, Start screen title block, uppercase section labels, cards. Fonts stored in `fonts/`, not loaded from Google.
- [x] Tablet test and merge.

## Backlog

Closed with phase 3. Nothing left open here.

- [x] Portrait or landscape at the truck: portrait (19 Nov 2026). In `docs/SPEC.md`.
- Moved to `docs/SPEC.md`, phase 4: scans only on the Scanner screen, stray-scan test, scan field focus.
- Moved to `docs/SPEC.md`, phase 5: portrait or landscape photos; real minimums and restock points.
- Later, after the project: cosmetic changes to the look.
