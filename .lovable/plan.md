## Extend History detail area to fill viewport

**Problem**: On the History page, when an entry is short (e.g. just "Affirmation"), the white entry card ends partway down the screen, leaving a large empty beige area between it and the bottom navigation bar.

**Goal**: The entry detail container should always extend down to just above the bottom nav (TODAY / HISTORY / PROFILE), regardless of content length. Long entries continue to scroll naturally past the viewport.

### Change

In `src/pages/History.tsx`:

- Wrap the page content in a flex column so the day-detail section can grow.
- Make the outer scroll container `flex flex-col` (it's already `flex-1 overflow-y-auto`).
- Give the day detail wrapper `flex-1 flex flex-col` so it stretches to fill remaining space.
- Apply a subtle bordered/white surface to the detail panel so it visually reads as a continuous box down to the bottom nav line — matching the existing `border-line bg-white/40` style used by the calendar/stats blocks.
- Keep `pb-6` so the last entry isn't flush against the nav.
- Long content still scrolls because the parent is `overflow-y-auto`.

### Technical detail

```
<div className="flex-1 overflow-y-auto flex flex-col">
  ...header, stats, calendar...
  <div className="mx-5 mt-3 mb-3 flex-1 flex flex-col rounded border border-line bg-white/40 p-4">
    <div className="mb-2 flex items-baseline gap-3">...date strip...</div>
    {entries list or empty state}
  </div>
</div>
```

This makes the panel a real bordered box that always reaches just above the bottom nav, matches the visual language of the other cards on the page, and still allows long entries to push past the fold and scroll.
