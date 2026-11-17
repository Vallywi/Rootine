# Rootine Test Plan (Draft)

| | |
|---|---|
| **Status** | DRAFT, for review |
| **Purpose** | Define how the team proves that Rootine meets the PRD, before the app is submitted |
| **Related** | `docs/product/PRD.md` (section 14, acceptance criteria), `docs/backend/BACKEND-PLAN.md`, `docs/frontend/FRONTEND-PLAN.md` |

---

## 1. Test levels

| Level | Who | Tools | When |
|---|---|---|---|
| Backend API tests | Backend members | Node's built-in test runner, a fake clock | On every change, before merging |
| Frontend manual checks | Frontend members | Browser and device mode | After each screen is done |
| Full-flow (end-to-end) check | Whole team | Manual checklist, optionally an automated browser script | Before each milestone |
| Security checks | Backend lead plus one reviewer | Test cases below, `npm audit` | Before release |
| Accessibility checks | Frontend lead | Keyboard, screen reader, contrast checker | Before release |
| User testing | Whole team | 5 or more testers, short survey | Last week |

---

## 2. Backend test cases

The backend should let tests set the current time, so a 25-minute session can be tested in milliseconds.

### Authentication

| ID | Case | Expected |
|---|---|---|
| T-A1 | Register with valid data | 201, cookie is `HttpOnly` and `SameSite`, no password data in the response |
| T-A2 | Register with weak password or bad email | 400 with a message for each field |
| T-A2b | Register with a confirm password that differs from the password | 400 with "Passwords do not match." on confirmPassword, no user saved |
| T-A2c | Register successfully, then read the user row in the database | Row has email, password hash (never the password), nickname, full name, age, gender, default settings, created time |
| T-A2d | Register with a missing profile field, age 4 or 121 or 20.5, an unknown gender, a one-letter or numeric full name | 400 with a message on that field, no user saved |
| T-A2e | Edit full name, age, and gender in Settings; send an empty update or an `email` field | 200 with new values; 400 for empty or unknown fields |
| T-A3 | Register with an email already used | 409 with wording that does not confirm the account |
| T-A4 | Login with wrong password versus unknown email | 401 with identical messages |
| T-A5 | Five wrong passwords, then the correct one | 429 until the lock time passes, then 200 |
| T-A6 | Logout, then reuse the old cookie | 401 |
| T-A11 | Change password with wrong current password | 400 on `currentPassword` |
| T-E1 | Edit display name to empty, 41 characters, and a valid value | 400, 400, then 200 and the new name appears in `/auth/me` |
| T-E2 | Delete account with the wrong password | 400, user and data still exist |
| T-E3 | Delete account with the correct password | 200, user row, tasks, and sessions are gone, old cookie returns 401 |
| T-E4 | Set daily goal to 0, 13, and 5 | 400, 400, then 200; changing it during a running session works |
| T-E5 | Complete 3 focus sessions today, read `/garden` | `todaySessions` is 3, `first_plant` is earned, `ten_plants` shows progress 3 of 10 |
| T-E6 | Set theme to `dark` and read settings on another device | `theme` is `dark`; an invalid value returns 400 |
| T-C1 | Complete a focus session, read the garden, collect it, collect again | Waiting in `pending` first, then in `plants`. The second collect returns `newlyCollected: false` and the same `collectedAt`. |
| T-C2 | Collect a running, given-up, or break session, and another user's session | 409 for the first three, 404 for another user's session |
| T-C3 | Collect all with two waiting plants, twice, and with a second user who also has a waiting plant | `collected: 2`, then `0`. The other user's plant is untouched. |
| T-C4 | Upgrade an old database that has finished plants, then run the upgrade again | Old finished plants are collected. A plant finished after the first upgrade is still waiting after the second. |
| T-R1 | Save each rhythm: 15/3, 25/5, 40/10, 50/10, 75/15, 90/20 | 200 for each, and `GET /settings` reports focus 15 to 90 and short break 3 to 20 |
| T-R2 | Save focus 14 or 91, short break 2 or 21 | 400 on that field |
| T-R3 | Save Sprint 15/3, start a focus session, finish it, start a break. Repeat with 90/20. | Focus lasts 15 minutes and the break 3. Then 90 and 20. |
| T-R4 | Upgrade an old database that has the narrower limits, twice | 90 and 3 are accepted, 91 and 2 are rejected, and exactly one constraint exists per column |
| T-P1 | Start a focus session with each of the 13 plants and a long enough length | 201 for each, with the chosen `plantType` |
| T-P2 | Start Pine at 39, Apple at 49, Cherry at 74, Ginkgo at 89 minutes, and with the default 25 | 400 on `plantType` naming the minimum, and no session left running |
| T-P3 | Save a 50 minute rhythm, then start an Apple Tree without sending minutes | 201 and a 50 minute session |
| T-P4 | Start an unknown plant such as `oak` | 400 |
| T-Y1 | Place a collected plant, move it, read the garden, then take it out (twice) | Position saved and rounded, then moved, then null. The second delete also returns 200. |
| T-Y2 | Send x or y out of range, not a number, missing, or an extra field | 400 |
| T-Y3 | Place a plant that is not collected, withered, or a break | 409 |
| T-Y4 | Another user places or removes your plant, or the id is invalid | 404, and your plant is unchanged |
| T-Y5 | Put 60 plants outside, then place one more, then move or remove an existing one | 409 for the 61st, 200 for moving, and room again after removing |
| T-Y6 | Set only one of `yard_x` or `yard_y`, or a value above 100, directly in the database | The database refuses it |
| T-Y7 | Upgrade an old database (4 plants, no yard columns) twice | New plants are accepted, old plants keep their collected state, and the yard columns exist |

### Security

| ID | Case | Expected |
|---|---|---|
| T-S1 | State-changing request without the CSRF header | 403 |
| T-S2 | Signed-in request with a wrong CSRF value | 403 |
| T-S3 | Any data route without a session | 401 |
| T-S4 | User B reads, edits, or deletes user A's task | 404 and nothing changes |
| T-S5 | User B acts on user A's session | 404 |
| T-S6 | Start a session with another user's task | 404 |
| T-S7 | Send extra fields such as `isAdmin` | 400 |
| T-S8 | Task title containing HTML | Stored as text, returned as plain JSON |
| T-S9 | Body larger than 10 KB | 413 |
| T-S10 | Response headers | CSP present, no `X-Powered-By`, `no-store` on API |
| T-S11 | `npm audit` | No high or critical findings |

### Tasks and settings

| ID | Case | Expected |
|---|---|---|
| T-T1 | Create task with blank title, estimate 0, estimate 100 | 400 |
| T-T2 | Create, edit, complete, reopen, delete | Each works, title trimmed |
| T-T3 | Delete a task that has sessions | Sessions remain, show the saved title |
| T-ST1 | Settings below and above every range | 400 |
| T-ST2 | Change focus length during a session | 409 |
| T-ST3 | Change sound flag during a session | 200 |

### Timer sessions

| ID | Case | Expected |
|---|---|---|
| T-M1 | Start focus with default settings | 25 minutes, `target_at` is 25 minutes later |
| T-M2 | Start a second session while one is open | 409 and the existing session is returned |
| T-M3 | Two start requests at the same time | Exactly one session exists |
| T-M4 | Complete before time is up | 409 |
| T-M5 | Pause at minute 10, wait 60 minutes, resume | 15 minutes remain |
| T-M6 | Complete at the right time, then complete again | Same result, one plant, one task credit |
| T-M7 | Give up, then complete | 409, no plant |
| T-M8 | Give up twice | Same result both times |
| T-M9 | Time runs out while the page is closed, then load current session | Session is completed exactly once |
| T-M10 | Change settings after starting | Running session length unchanged (BR-12) |
| T-M11 | Complete focus, then break | Break gives no plant (BR-4) |
| T-M12 | Interval set to 2: focus, short break, focus | Next break is long |
| T-M13 | Complete a long break | Counter resets |
| T-M14 | Custom minutes 14 and 61 | 400 |
| T-M15 | Invalid plant type | 400 |

### Garden and stats

| ID | Case | Expected |
|---|---|---|
| T-G1 | Completed and given-up sessions | Completed in `plants`, given-up in `withered`, only completed counted in stats |
| T-G2 | Three days in a row | Current and longest streak are 3 |
| T-G3 | No session today, one yesterday | Current streak continues |
| T-G4 | Sessions near midnight with different time zone offsets | Counted in the user's local day |
| T-G5 | Week starts on Monday | Sunday and Monday fall in different weeks |

---

## 3. Frontend and full-flow checklist

Run on a phone-width screen first, then desktop.

| ID | Flow | Pass condition |
|---|---|---|
| F-1 | Open the app signed out | The landing page opens with Log in and Get started buttons |
| F-1a | Landing page on a phone (390 px) and a desktop (1280 px) | No horizontal scroll, readable text, easy-to-tap buttons, backgrounds do not cover text |
| F-1b | Register step 1 with empty fields, then with age 200 | Every empty field shows a message, age shows its range message, Next does not continue |
| F-1c | Finish step 2 and open Settings | The nickname shows in the top bar, and full name, age, and gender are filled in Settings |
| F-1d | Start a focus session, jump the clock to half time, reload | The plant is clearly bigger than at the start, with leaves visible. Near the end the flower is open. |
| F-1e | Finish a session | Full plant, confetti, **Collect plant** and **Collect later**. The break buttons are not shown until the plant is collected. |
| F-1f | Choose **Collect later**, then open Focus and Garden | A "ready to collect" banner on Focus. The plant is listed under "Ready to collect" in the Garden and moves to Plants after **Collect**. |
| F-1g | Turn on reduced motion in the system settings | Clouds, butterflies, confetti, and growth transitions stop. Every screen still shows the plant stage in static form. |
| F-1h | Choose each rhythm on the Focus screen, then reload | The chosen one is still selected, the title says "Focus for N minutes ... then rest for M", and the timer starts at N |
| F-1i | Choose Custom with focus 5, then with focus 33 and break 7 | A clear message for 5, then "Focus for 33 minutes" is shown and saved |
| F-1j | Register a new account | The tour opens by itself. Each step lights up the right control. Back and Next work. Escape and Skip close it. It does not come back after a reload. |
| F-1k | Press the ? button in the top bar, and use Settings, Replay the tour | The tour opens again from the first step |
| F-1l | Use the tour with the keyboard only (Tab, Enter, Escape) and with a screen reader | Focus stays inside the tour card. The title and text are read for every step. |
| F-1m | Open the Focus screen with Classic, then choose Focus Block (40) | Trees are locked with "40+ min" style labels under Classic. Pine unlocks at 40. Apple, Cherry, and Ginkgo stay locked. |
| F-1n | Start a Pine Tree and watch it | A tree grows from the pot, with its crown opening from the middle of the session |
| F-1o | Open the Yard with collected plants | Plants can be placed, dragged, moved with arrow keys, put back with Delete or the button, and are still there after a reload |
| F-1p | Open the Yard on a phone, and with dark mode on | The scene fits the screen, dragging with a finger does not scroll the page, and the night yard shows stars and fireflies |
| F-1q | Scroll to the bottom of the landing page on a phone and on a desktop | The footer is complete and readable, its links jump to sections, and there is no horizontal scroll |
| F-2 | Register with a weak password | Inline error under the field |
| F-3 | Register correctly | Lands on Focus screen |
| F-4 | Add, edit, complete, and delete a task | Delete asks for confirmation. History stays. |
| F-5 | Start a focus session with a task | Timer counts down. Plant starts as a seed. |
| F-6 | Watch the plant | Seed at 0%, sprout at 25%, small plant at 60% |
| F-7 | Refresh in the middle of a session | Timer continues with the correct time |
| F-8 | Switch to another tab for 2 minutes and return | Timer is correct |
| F-9 | Pause and resume | Frozen while paused, continues after resume |
| F-10 | Open Settings during a session | Timing fields are disabled with an explanation |
| F-11 | Let a session finish | Result screen, in-app alert, one sound if on, garden has one new plant |
| F-12 | Open the app in two tabs and finish | One plant only |
| F-13 | Start a break from the result screen | Short or long as expected |
| F-14 | Give up, press Keep going | Session continues |
| F-15 | Give up, press Yes | Withered result, no plant, no stats |
| F-16 | Garden page | Grown plants, withered section, stats tiles |
| F-17 | Task shows progress | "x of y Pomodoros done" updates |
| F-18 | Notifications: allow | A system notification appears at the end |
| F-19 | Notifications: block | A message explains. In-app alerts still work. |
| F-20 | Log out, press Back | Protected pages are not shown |

---

## 4. Responsive and device matrix

| Check | Phone 320 px | Phone 390 px | Tablet 768 px | Desktop 1280 px |
|---|---|---|---|---|
| No horizontal scroll | ☐ | ☐ | ☐ | ☐ |
| Bottom nav not hiding content | ☐ | ☐ | n/a | n/a |
| Touch targets at least 44 px | ☐ | ☐ | ☐ | n/a |
| Forms usable with on-screen keyboard | ☐ | ☐ | ☐ | n/a |
| Landscape orientation | ☐ | ☐ | ☐ | n/a |

Browsers: current Chrome, Edge, Firefox, and Safari. Real phone check on at least one Android and one iPhone if available.

---

## 5. Accessibility checks

| Check | Pass condition |
|---|---|
| Keyboard only | Whole main flow works with Tab, Enter, Space, Esc. Focus ring is always visible. |
| Screen reader | Labels read correctly, errors announced, stage changes announced politely, timer not read every second |
| Contrast | All text meets 4.5 to 1 (3 to 1 for large text) per the table in the design system |
| Not color only | Paused, error, and success states include icon and text |
| Reduced motion | No sway, confetti, or breathing. Information still visible. |
| Zoom | Usable at 200% zoom |

---

## 6. User testing

- At least 5 testers who are not on the team, ideally students.
- Task script: register, add a task, run a 15-minute session (or a shortened test build), see the garden.
- Survey (5 questions, 1 to 5 scale): easy to understand, looks nice, plant growth is motivating, timer felt accurate, would use again. Add one open question: "What confused you?"
- Record results in a table and list fixes made.

---

## 7. Mapping to PRD acceptance criteria

Section 14 of the PRD has the formal acceptance criteria. Each criterion must point to at least one test ID above. Keep that mapping as a table at the end of this file once the team approves the PRD. **[TO DO after approval]**

---

## 8. Exit criteria (ready to submit)

- All backend tests pass.
- All items in the frontend checklist pass on a phone and a desktop.
- No open high-priority bugs. Medium bugs are listed with reasons.
- Security checks T-S1 to T-S11 pass.
- Accessibility checks in section 5 pass.
- User testing finished and findings addressed or listed.
