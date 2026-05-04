## Make History entries reach the bottom nav line

### Root cause

The entries panel can't reach the line above the bottom nav because of two stacked gaps:

1. `AppShell` reserves a fixed `pb-20` (80px) on `<main>` to clear the `fixed` bottom nav — but the nav itself is only ~56–64px tall, leaving ~16–24px of dead space below the panel.
2. The panel adds another `mb-3` (12px) on top of that.

So even with `flex-1`, the panel stops well above the nav's top border.

### Fix

Switch the bottom nav from `fixed` to a normal flex child of `AppShell`. Then `<main>` no longer needs reserved padding, and `flex-1` on the entries panel naturally stretches all the way down to the nav's top border line.

**1. `src/components/AppShell.tsx`** — drop the `pb-20` reservation since the nav is in normal flow now:
```tsx
<main className={hideNav ? "..." : "flex flex-1 min-h-0 flex-col overflow-hidden"}>
```

**2. `src/components/BottomNav.tsx`** — remove `fixed bottom-0 left-0 right-0`; keep border, background, and `safe-bottom`. It becomes a sibling that sits at the bottom of the flex column automatically:
```tsx
<nav className="z-40 border-t border-line-strong bg-paper/90 backdrop-blur-sm safe-bottom">
```

**3. `src/pages/History.tsx`** — change the entries panel margin from `mb-3` to `mb-0` so its bottom border sits flush against the nav's top border (matches the "horizontal line right above the bottom menu" the user described). Keep `mx-5` and `mt-3` as-is.

### Result

- Entries panel grows to fill all space between the calendar and the nav's top border — no dead gap.
- Significantly more entries visible without scrolling, and scrolled text reaches the nav line before being clipped.
- Nav stays pinned to the bottom (it's the last child in a full-height flex column), with safe-area inset preserved for iOS.
- No layout impact on other pages — `AppShell` already wraps every screen the same way.

### Files

- `src/components/AppShell.tsx`
- `src/components/BottomNav.tsx`
- `src/pages/History.tsx`
