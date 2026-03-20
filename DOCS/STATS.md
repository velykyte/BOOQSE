## Stats Page Reference

### Route
- `GET /stats`

### MVP Goal
Help users understand reading patterns with three simple, reliable metrics derived only from real-time reading sessions.

MVP Metrics (must show)
1. Pages per day (line chart)
2. Time per day (line chart)
3. Average reading speed (pages/hour)

MVP Streak + Calendar (must show, optional calendar UI)
1. Streak: number of consecutive calendar days with at least one valid reading session.
2. Calendar: optional monthly view with one “gold star” per reading day, and streak behavior driven by missed days.

### Data Source (InstantDB)
All stats must be based on `reading_sessions` linked to the user’s **currently reading** books only.

Core rule:
- Exclude past books from stats (MVP).

Implementation expectation:
- When aggregating sessions, scope `reading_sessions` to the user’s `user_books` where `status === "currently_reading"`.

Ownership:
- Every query is scoped to the signed-in user.

Privacy:
- Never include reflections in stats.
- Never expose other users’ session data.

### Definitions
Reading day:
- Any valid reading session where the session has both:
  - `pages_read` (number)
  - `time_minutes` (number)
- The session belongs to a day derived from the session’s `date` field (Y-M-D in UTC).

Average reading speed:
- `pages/hour` computed from aggregated daily totals:
  - `avgPagesPerHour = totalPages / (totalMinutes / 60)`
- If `totalMinutes` is 0 (should not happen for valid sessions), omit the point or treat as 0 (choose one consistent behavior).

Streak:
- Based on calendar days, not sessions.
- A “reading day” advances the streak.
- A missed day resets the streak (stars can remain in the calendar view).

### Metric Computation (Reference)

1. Pages per day
- Group all qualifying sessions by day.
- Sum `pages_read` for each day.
- Display as a line chart.

2. Time per day
- Group all qualifying sessions by day.
- Sum `time_minutes` for each day.
- Display as a line chart.

3. Average reading speed (pages/hour)
- For each day:
  - `totalPages = sum(pages_read)`
  - `totalMinutes = sum(time_minutes)`
  - `pages/hour = totalPages / (totalMinutes / 60)`
- Display as a line chart (or as a derived series consistent with the UI design).

4. Streak and Calendar
- Determine which days are “reading days” (days with at least one qualifying session).
- Streak rules:
  - Missed day → streak resets.
  - Existing “gold star” indicators can remain on the calendar.

### UX Requirements (Reference)
From MVP spec:
- Show only the three metrics: pages/day, time/day, avg reading speed.
- Add streak and reading calendar above the detailed stats (streak and monthly summary).
- Calendar is optional in MVP.
- Keep the page calm and minimal: no dense dashboards.

### Security / Trust Boundary
- All aggregations and eligibility logic must run server-side.
- Frontend may only render results.
- Never rely on client-side filtering to enforce privacy or exclusions (past books exclusion must be enforced on the server).

### Current Implementation Note
- The current `/stats` page is a placeholder.
- This reference doc defines the intended MVP behavior and computations so the eventual implementation can follow it exactly.

