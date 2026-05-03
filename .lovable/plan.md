## History page redesign

Replace the current 14-day list with a month-view calendar plus a day-detail view.

### Header
- Remove the "HISTORY • 14 DAYS" eyebrow row.
- Keep the "What you've kept." headline.
- Keep the stats strip (streak / entries / words).

### Calendar (month view)
- Use shadcn `Calendar` (react-day-picker), single-select mode, styled to match the journal aesthetic (serif/mono tokens, `border-line`, no harsh accents).
- Show one month at a time with prev/next month navigation; default to current month.
- Allow navigation to any past month (disable future dates beyond today).
- For each day in the visible month, query journal entries and render a small indicator dot under days that have at least one completed entry. Today gets an italic/emphasized number per existing style.
- Tapping a day selects it and reveals the Day Detail panel below.

### Day detail panel (below calendar)
- Header: full date (e.g. "Mon, 27 Apr").
- If no entries: muted serif italic "Nothing written." (or "Today is still open." for today).
- If entries: list each entry as a card showing journal icon + title + duration, and the full content (not just a 36-char preview). Tapping a card expands/collapses the full text inline (no new route needed).

### Data
- Single query: fetch all completed entries for the user (already done) — reuse existing `entries` query, just derive a `Set` of `YYYY-MM-DD` keys for indicators and filter by selected day for the detail panel. No schema changes.

### Files to change
- `src/pages/History.tsx` — replace the 14-day list section with `<Calendar>` + day-detail panel; remove the eyebrow row.
- Possibly minor tweaks to `src/components/ui/calendar.tsx` styling props (via `modifiers` / `modifiersClassNames`) to render the "has entry" dot — no structural changes to the shared component.

### Layout
- Keeps the fixed bottom nav and `h-dvh` shell. Calendar sits at top (fixed height ~ 280px), detail panel below uses `flex-1 overflow-y-auto` so long entries scroll without breaking the shell.
