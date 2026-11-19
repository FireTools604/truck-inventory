# Phase 3 – UI refinement: work list

Phase 3 in `docs/SPEC.md`. This file is the running list of changes.

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

Built 19 Nov 2026 (app version 2026-11-19a). Tablet test pending. Photos from Allan: 19 of S1, cabinets L1, L2, R1 and R2.

- [x] Load real photos into the test data. L1, L2, R1 and R2 in both sets. Checked in the photo strip, portrait and landscape, in a desktop browser at tablet size.
- [x] Set a size limit for photos: JPEG, longest side 1600 px, under 300 KB. In `docs/SPEC.md`; feeds the phase 5 photo rules.
- [x] Tap a photo to see it full screen: yes. Swipe through the cabinet's photos; Minimize or Back returns to the cabinet screen on the last photo viewed.
- [ ] Check load time on the tablet: open L1 (7 photos, about 1.6 MB) on the dispatcher's Wi-Fi and on cell data if the tablet has it.
- [ ] Tablet test and merge.

## Batch 3 – look and feel

Needs from Allan: match the SCBA tracker's look only, or also link the two apps? (Spec says standalone.) OK to read the `FireTools604/firetrack-scba` repo for its styles.

- [ ] Colours and colour scheme.
- [ ] Button shapes and sizes.
- [ ] Overall look, matched to the SCBA tracker.

## Backlog

- [ ] Real minimums and restock points per item, once S1's items are known.
- [ ] Portrait or landscape at the truck (spec open item).
- [ ] For phase 4: scans only count on the Scanner screen (decided 19 Nov 2026). Test that a stray scan on the cabinet screen or a full-screen photo does nothing, and that the scan field has focus again on returning to the Scanner screen.
- [ ] For phase 5: photo rules say landscape, but tall cabinets (L1, R2) were taken portrait and look narrow in the strip. Settle portrait or landscape per cabinet type.
