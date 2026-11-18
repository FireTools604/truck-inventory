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

Built 18 Nov 2026. Tablet test pending.

- [x] Short test set (4 cabinets, 14 items) for quick runs. Full-size set kept at `?data=full`.
- [x] Sub-checks collapse to one line once all are marked. Show / Hide to change them.
- [x] Consumables: count items (count found, minimum flags Low, zero is Missing) and level items (25/50/75/100%, restock point flags Low). Placeholder minimums; restock point 50%.
- [x] Add extra item removed for now.
- [ ] Tablet test and merge.

## Batch 2 – photos

Needs from Allan: 3 to 6 real cabinet photos (any truck), taken the way the crew should see them.

- [ ] Load real photos into the test data. Check how they look in the photo strip, portrait and landscape.
- [ ] Check load time and file size on the tablet. Set a size limit for photos (feeds the phase 5 photo rules).
- [ ] Decide: tap a photo to see it full screen?

## Batch 3 – look and feel

Needs from Allan: match the SCBA tracker's look only, or also link the two apps? (Spec says standalone.) OK to read the `FireTools604/firetrack-scba` repo for its styles.

- [ ] Colours and colour scheme.
- [ ] Button shapes and sizes.
- [ ] Overall look, matched to the SCBA tracker.

## Backlog

- [ ] Real minimums and restock points per item, once S1's items are known.
- [ ] Portrait or landscape at the truck (spec open item).
- [ ] Placeholder photos say "Test photo 1 of 4" where the short set has 3. Cosmetic; goes away with real photos.
- [ ] For phase 4: typing a count opens the keyboard and takes focus from the hidden scan field. Scan handling has to take focus back after typing.
