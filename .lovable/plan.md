## Fix History page Day detail panel sizing

Two small layout adjustments in `src/pages/History.tsx` on the Day detail container (line 136).

### 1. Match horizontal width to calendar + stats blocks

The stats strip and calendar use `mx-5` (20px side margin). The Day detail panel currently uses `mx-2 md:mx-5`, which makes it visibly wider than the blocks above on mobile.

Change its horizontal margin to `mx-5` so all three blocks share the exact same left/right alignment.

### 2. Stretch panel down to just above the bottom nav

Currently the panel has `mb-4` plus `safe-bottom` padding, leaving a visible gap between the bottom of the panel and the bottom navigation bar. The user wants the bottom gap to match the gap between the calendar and the stats strip (which is `mt-3` = 12px).

`AppShell` already reserves space for the fixed bottom nav via `pb-20` on `<main>`, so the panel just needs a small consistent bottom margin and no extra `safe-bottom` padding.

Replace:
```
mx-2 md:mx-5 mt-3 mb-4 flex-1 min-h-0 flex flex-col rounded border border-line bg-white/40 safe-bottom overflow-hidden
```
with:
```
mx-5 mt-3 mb-3 flex-1 min-h-0 flex flex-col rounded border border-line bg-white/40 overflow-hidden
```

This:
- Aligns the panel's left/right edges with the calendar and stats strip (`mx-5`).
- Uses `mb-3` (12px) — the same spacing used between calendar and panel — so the panel ends a consistent distance above the bottom nav.
- Removes `safe-bottom` since AppShell's `pb-20` already clears the fixed nav and safe area.
- `flex-1 min-h-0` continues to make the panel fill all remaining vertical space, and the inner `flex-1 overflow-y-auto` scroll area on line 147 automatically grows with it — no change needed there.

### Files

- `src/pages/History.tsx` — single className change on the Day detail wrapper div (line 136).
