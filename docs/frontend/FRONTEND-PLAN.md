# Rootine Frontend Plan

| | |
|---|---|
| **Status** | DRAFT, for review. No code is written until the plan is approved. |
| **Scope** | Everything the user sees and touches. Backend work is in `docs/backend/BACKEND-PLAN.md`. |
| **Related** | `docs/design/CUTE-DESIGN-SYSTEM.md` (look and feel), `docs/backend/API-SPEC.md` (what the frontend calls), `docs/product/PRD.md` (requirements) |

Items marked **[TO CONFIRM]** need a team decision.

---

## 1. Purpose

Build a phone-friendly, cute, accessible single-page app where students run Pomodoro sessions, watch a plant grow, manage tasks, and see their garden.

The frontend never decides the outcome of a session. It shows what the backend reports and sends the user's actions. This keeps refresh, multiple tabs, and cheating from breaking the rules.

---

## 2. Stack **[TO CONFIRM]**

| Need | Choice | Reason |
|---|---|---|
| UI library | React 18 | Team familiarity, large community |
| Build tool | Vite | Fast start, simple config |
| Routing | React Router | Standard for React SPAs |
| Styling | Plain CSS with design tokens (CSS variables) | No extra library to learn, easy to make the cute look consistent |
| Fonts | Nunito (rounded), self-hosted | Cute and readable, and works with a strict Content Security Policy |
| Plant art | Inline SVG React components | Sharp on every screen, can animate, no image files to manage |
| State | React Context for auth and the running session, local state for pages | A state library is not needed at this size |
| Server calls | `fetch` wrapper in one file | Keeps CSRF, errors, and cookies in one place |
| Charts (P1) | Simple CSS bars or a small chart library | Accessible text alternative required (FR-29) |

**Not used:** UI kits such as Bootstrap or Material UI. They fight the custom cute design.

If the course requires plain HTML/CSS/JS, the same screens and rules apply. Only the component structure changes.

---

## 3. Folder structure

```
frontend/
├── index.html
├── public/                 # favicon, static images
└── src/
    ├── main.jsx            # app entry, providers
    ├── App.jsx             # route table, route guards
    ├── api.js              # fetch wrapper (CSRF, errors)
    ├── auth/               # AuthProvider, useAuth
    ├── session/            # SessionProvider (running timer), useSession
    ├── notify.js           # sound and browser notification helpers
    ├── pages/
    │   ├── auth/           # Login, Register
    │   ├── Focus.jsx
    │   ├── Tasks.jsx
    │   ├── Garden.jsx
    │   └── Settings.jsx
    ├── components/
    │   ├── plants/         # Plant.jsx and one file per plant type
    │   ├── Layout.jsx      # top bar, bottom nav, banners
    │   ├── ConfirmDialog.jsx
    │   ├── Field.jsx       # label, hint, error
    │   └── Mascot.jsx
    └── styles/
        ├── tokens.css      # colors, spacing, radii, shadows
        ├── base.css        # reset, typography
        └── components.css  # buttons, cards, forms, nav
```

---

## 4. Routes and access

| Path | Screen | Access | PRD |
|---|---|---|---|
| `/login` | Log in | Guests only | FR-2 |
| `/` (signed out) | Landing page: hero, how it works, plant stages, meet the plants, features, call to action, and a footer | Guests only | PRD 4.1 |
| `/register` | Create account | Guests only | FR-1 |
| `/` | Focus (idle, running, break, result) | Signed in | FR-6 to 17 |
| `/tasks` | Task list | Signed in | FR-24 to 26 |
| `/garden` | Garden and stats | Signed in | FR-19, 27, 28 |
| `/yard` | Yard: place collected plants outside | Signed in | FR-45 |
| `/settings` | Timer, alerts, account | Signed in | FR-12, 35, 36 |
| anything else | Redirect to `/` | | |

**Route guards**
- Signed-out user opening a signed-in page goes to `/login`, then returns to the page after login.
- Signed-in user opening `/login` goes to `/`.
- If any API call returns 401, the app clears the user and goes to `/login` with a friendly message.

---

## 5. State plan

| State | Where | Notes |
|---|---|---|
| Current user, CSRF token | `AuthProvider` | Loaded from `GET /auth/me` on app start |
| User settings | `AuthProvider` | Durations, sound flag, notification flag |
| Running session | `SessionProvider` | Lives at app level, so the timer finishes and alerts even when the user is on the Tasks page |
| Completion result and alert banner | `SessionProvider` | Shown on Focus and in the layout banner |
| Tasks, garden data | The page that shows them | Fetched when the page opens, refetched after changes |
| Form values and errors | The form component | |
| Chosen plant | `localStorage` | Preference only, not sensitive |

**Never stored in `localStorage`:** tokens, passwords, or session data. The login cookie is `HttpOnly`, so scripts cannot read it.

---

## 6. Screens

Each screen needs these states built from the start: **loading, empty, error, success**.

### 6.1 Auth screens
- Cute card with the mascot and a small plant at the top.
- Log in: email and password (show/hide toggle).
- Register has two steps with a progress indicator. Step 1 "About you": nickname, full name, age, and gender (four chips). Step 2 "Your account": email, password, confirm password (checked on the page and again on the server; a mismatch shows "Passwords do not match."). A server error on a step 1 field sends the user back to step 1.
- Look: pastel sky background with drifting clouds, floating leaves and sparkles, and rolling hills (`Backdrop` component, decorative and `aria-hidden`). It is quieter in the signed-in app. Motion stops when the user prefers reduced motion.
- Inline errors under each field, plus one form-level error for general failures.
- Register shows "At least 8 characters" as a hint before the user makes a mistake.
- Submit buttons show a busy label and are disabled to prevent double submit.

### 6.2 Focus screen (main screen)
- **Rhythms (FR-42):** `PresetPicker` shows six rhythms and Custom as cards (emoji, `25 / 5`, name). The chosen one is saved to the account. A short bubble below explains who it is best for. Custom shows two number fields with the allowed range and an error message for out-of-range values. Cards have a small bounce on hover and when chosen.
- **Beginner tour (FR-43):** `Tour` lights up the real controls (rhythms, plants, task, Start focus, navigation) with a spotlight that glides between steps, and explains growing and collecting with small animated examples in the card. It opens by itself the first time (remembered per account in the browser), has Back, Next, Skip tour, and step dots, traps focus inside the card, closes with Escape, and replays from the **?** button in the top bar or from Settings. Targets are marked with `data-tour` attributes. If a target is not on screen, the step is shown in the middle.
- **Motion:** the landing sections slide in as they scroll into view, lists and grids pop in one after another, the goal ring fills when it appears, finished tasks get an animated strike-through, earned badges shine, and the main button gently breathes. All of it stops with reduced motion.
- **Growing animation (FR-41):** `GrowingPlant` takes a `progress` from 0 to 1. The whole plant scales up from the pot, the leaves unfurl around 20 to 50 percent, and the flower pops open from 60 to 95 percent. Each part uses a CSS transition, so new values glide. A small squish and sparkles play when the stage changes. At the end, confetti bursts. With reduced motion, parts change without transitions and confetti and sparkles are hidden.
- **Collect (FR-40):** when a session finishes, the result shows the full plant and **Collect plant** (with **Collect later**). After collecting: "Added to your garden!" with a hop and "+1", then **Start break**, **Skip break**, and **See my garden**. A break cannot start before the plant is collected or deferred. Plants left uncollected show a "ready to collect" banner with **Collect all** on the Focus screen.

| State | What the user sees | Actions |
|---|---|---|
| **Idle** | Seed in a pot, plant picker (4 plants), task picker (optional), duration chips (15, 25, 45, 60) and a custom number field | Start focusing |
| **Running** | Big countdown, growing plant, progress bar, stage name, selected task | Pause, Give up |
| **Paused** | Countdown frozen and visually calmer, "Paused" label | Resume, Give up |
| **Give-up confirm** | Dialog explaining the plant will wither | Keep going, Yes give up |
| **Success result** | Full plant, confetti, minutes and task | Take a break, Skip break |
| **Withered result** | Sad but gentle withered plant, encouraging text | Try again |
| **Break running** | Breathing sun animation, countdown | Skip break |
| **Break done** | Friendly message | Back to focus |

Rules the screen must follow:
- Duration can be changed only before starting (PRD FR-6, FR-12).
- Start button is disabled while a request is in flight (stops duplicate sessions, BR-1).
- Plant stage changes at 0%, 25%, 60%, and full plant on completion (PRD A-6).
- A hidden live region announces stage changes for screen readers.
- Page title shows the remaining time, for example `12:34 · Rootine`.

### 6.3 Tasks screen
- "Add a task" form: title (required), estimated Pomodoros (optional, 1 to 99).
- To-do list and a Done list.
- Each task: checkbox to complete or reopen, title, "2 of 3 Pomodoros done", buttons **Focus**, **Edit**, **Delete**.
- Edit opens inline in the same row. Delete opens a confirmation dialog that says history is kept (BR-11).
- Empty state: friendly mascot message.
- **Focus** button opens the Focus screen with that task preselected.

### 6.4 Garden screen
- **Ready to collect:** a panel at the top lists finished plants that are not collected yet, with **Collect** on each and **Collect all**. Collected plants move to the Plants grid with a small hop.
- Stat tiles: today, this week, this month, streak (and best streak).
- Daily goal ring ("3 of 4 today") shown on the Focus screen and in the Garden. It also shows text, not only color.
- Badges row: earned badges in color, locked badges grey with progress ("6 of 10"). Each badge has a text name.
- Grid of grown plants with plant name, date, minutes, and task.
- "Withered" section, collapsed to the most recent items. **[TO CONFIRM]** (PRD A-4)
- Empty state: a seed with an invitation to start.

### 6.5 Settings screen
- **Pomodoro timer:** focus, short break, long break, long-break interval. Each shows its allowed range. Fields are disabled with an explanation while a session is open.
- **Alerts:** sound toggle. Browser notifications button that adapts to permission state (see section 8).
- **Daily goal:** number of sessions per day, 1 to 12. Can change at any time.
- **Theme:** Light or Dark. Applies at once and is saved to the account. Dark colors come from the design tokens (`CUTE-DESIGN-SYSTEM.md`, **[TO CONFIRM]** dark palette contrast).
- **Account:** edit display name, change password, log out, and **Delete account** (a confirmation dialog that asks for the password and says it cannot be undone).

---

### 6.6 Yard screen (FR-45)
- A scene with a sky, sun, clouds, hills, a picket fence, grass, stepping stones, and a pond. In dark mode it becomes a night yard with stars and fireflies.
- **Tray** below the scene lists every collected plant with **Place in yard** or **Put back**, plus **Place all** and **Put all back**. A banner points to the Garden when plants are still waiting to be collected.
- **Placing and moving:** plants stand on the grass only (below the fence). Drag with a mouse, pen, or finger. Or select a plant (click, tap, or Tab to it) and use the arrow keys (Shift moves further). Delete puts it back. Positions are saved when the drag ends or 0.4 seconds after the last key press. Trees are drawn bigger. Plants further down the scene are drawn in front.
- **Outside, plants have no pot.** They stand on a small mound of earth with a face.
- Accessibility: every plant is a button with a label that explains the keys, changes are announced in a live region, and the yard works without a mouse.

### 6.7 Plants and trees (FR-44)
- The picker groups "Flowers and plants" and "Trees". Locked trees are dimmed and show the minutes they need. Choosing a longer rhythm unlocks them. If the rhythm gets shorter while a tree is chosen, the choice goes back to the Sunflower.
- Each plant is drawn in `Plant.jsx` and `plantArt.jsx` for every stage (seed, sprout, small, full, withered) and animates through `GrowingPlant`. Trees grow their crown from the middle of the session, and flowers pop open near the end.

### 6.8 Landing footer (FR-46)
- Four blocks (brand with a short description and little plants, Explore, Get started, Good to know) in one rounded card, then the year and a Back to top button. Links to sections use smooth scrolling, which stops with reduced motion.

## 7. Timer behavior in the browser

1. The backend sends `targetAt` and `serverNow` with every session response.
2. The frontend computes `clockOffset = serverNow - Date.now()` once per response.
3. Remaining time is always `targetAt - (Date.now() + clockOffset)`. It never counts ticks.
4. The screen repaints about 4 times per second while a session is running. The repaint is only for display.
5. When remaining time reaches 0, the frontend calls `complete`. If the backend says "not finished yet" (small clock gap), it retries after 1 second.
6. When the tab becomes visible again, the frontend asks the backend for the current session, so two tabs or devices stay in agreement.
7. A page refresh loads the current session from the backend and continues from the right time.

---

## 8. Notifications

| Layer | Behavior | Fallback |
|---|---|---|
| In-app banner | Always shown when a focus session or break ends. Dismissable. Uses `role="status"`. | None needed |
| Sound | Soft two-note chime. Off by a toggle. Created only after a user action (browsers block audio otherwise). | If audio fails, nothing breaks |
| Browser notification | Off until the user presses **Enable notifications**. Permission is requested only on that press. | Denied: show "blocked in browser settings" message. Unsupported: show "not supported" message |

Notes for the Settings screen:
- Permission `default`: show the Enable button.
- Permission `granted`: show a toggle.
- Permission `denied` or unsupported: explain, and keep in-app alerts working.
- Tell the user that notifications work only while Rootine is open in a browser tab. Alerts when the browser is closed need push notifications and are post-MVP.

---

## 9. API client rules (`api.js`)

- Always send cookies (`credentials: same-origin`).
- Send the `X-Rootine-CSRF` header on every request. Before login, use a placeholder. After login, use the token from the server.
- Convert every failure into one error type with `status`, `message`, and `fields`.
- Network failure gives the message "Cannot reach Rootine. Check your connection."
- A 401 on a signed-in page triggers sign-out handling.
- Never log request bodies (they can contain passwords).

---

## 10. Forms and validation

- Validate on the client for fast feedback, but the backend is the authority. Show backend field errors in the same places.
- Each input has a visible label, a hint where useful, and an error message linked by `aria-describedby`.
- Errors never rely on color alone. They include a ⚠ icon and text.
- Number inputs use `inputMode="numeric"` and 16 px text so phones do not zoom in.
- Match the limits in the PRD: focus 15 to 90, short break 3 to 20, long break 10 to 30, interval 2 to 6, task title 1 to 120 characters, estimate 1 to 99.

---

## 11. Responsive plan

| Width | Layout |
|---|---|
| Under 768 px (phones, mobile first) | Single column. Fixed bottom navigation with 4 tabs. Safe-area padding for notched phones. Cards fill the width. |
| 768 px and up (tablet, desktop) | Top navigation. Content centered, maximum width about 760 px. |

Checklist:
- No horizontal scrolling at 320 px width.
- Touch targets at least 44 by 44 px.
- Works in portrait and landscape.
- Bottom nav never hides content (extra bottom padding).
- Keyboard opening on a phone does not hide the focused input.

---

## 11a. Installable web app (PWA)

Rootine can be installed from Chrome or Edge like an app. It stays a website. There is no app store and no separate mobile code.

**What the user sees**
- Chrome on desktop shows an install icon in the address bar. Chrome on Android offers "Install app" (or "Add to Home screen").
- After install, Rootine has its own icon and opens in its own window without browser bars.
- Login, tasks, and garden work the same as in the browser, because the data comes from the same backend.

**What to build**
| Item | Detail |
|---|---|
| Web app manifest (`manifest.webmanifest`) | `name` "Rootine", `short_name`, `start_url` `/`, `display` `standalone`, `theme_color` `#2F5D50`, `background_color` `#F7F3E8`, link it in `index.html` |
| Icons | 192x192 and 512x512 PNG, plus a 512x512 maskable icon (keep the plant inside the safe center area) |
| Service worker | Needed for Chrome to offer install. Use `vite-plugin-pwa`. Cache only the app files (HTML, JS, CSS, fonts, icons). Set the navigation fallback to exclude `/api` (`navigateFallbackDenylist: [/^\/api/]`), so Vercel's API routes are never answered with `index.html`. |
| Optional install button | Listen for `beforeinstallprompt`, show an "Install Rootine" button in Settings, hide it once installed |
| Offline page | If the network is down, show a simple "You are offline" screen with a Retry button |

**Rules (security and correctness)**
- The service worker must **never cache `/api` responses**. Cached API data could show one user's tasks to another user after logout, and a stale timer breaks the server-as-source-of-truth rule.
- The timer and all data need internet. Offline use is not supported. The offline page says so.
- HTTPS is required for install. `localhost` also works for testing.
- Update behavior: when a new version is deployed, show "New version available, Reload" instead of silently swapping files mid-session.
- iPhone: Safari does not show an automatic install prompt. Users choose Share, then Add to Home Screen. Add a short hint for iOS users in Settings.

**Acceptance checks**
1. Chrome DevTools, Application tab, Manifest: no errors and installable.
2. Lighthouse PWA check passes.
3. Install on Android Chrome and on desktop Chrome. The app opens standalone and login works.
4. After logout, no user data appears offline.
5. Turn the network off: the offline page shows, and no API data is served from cache.

---
## 12. Accessibility plan

- One `h1` per screen, logical heading order.
- Skip-to-content link.
- Visible focus ring on every control (amber outline).
- Native elements first (buttons, links, `dialog`, inputs) before custom ones.
- Timer has `role="timer"` with an accessible label. It is not announced every second.
- Progress bar has `role="progressbar"` with min, max, and current value.
- Plant SVGs have text labels, for example "Cactus: Sprout".
- Dialogs trap focus and close with Esc.
- `prefers-reduced-motion`: turn off sway, confetti, and breathing, but keep the same information (stage names and progress text).
- Target contrast: 4.5 to 1 for normal text and 3 to 1 for large text.

---

## 13. Security in the frontend

- No `dangerouslySetInnerHTML`. All user text (task titles, names) is rendered as plain text.
- Only same-origin API calls. No third-party scripts, fonts, or analytics, so a strict Content Security Policy works.
- No secrets in the frontend code. Environment values that ship to the browser are public.
- Do not put tokens in URLs.
- Password fields use correct `autocomplete` values so password managers work.

---

## 14. Performance plan

- Target first load under 3 seconds on a normal mobile connection (PRD NFR).
- Self-host only the font weights needed. Use the variable font once.
- Split the code per route if the bundle grows above about 250 KB (compressed).
- Plant SVGs are small and inline, so no image requests.
- Avoid re-rendering the whole page every 250 ms. Only the timer area should repaint.

---

## 15. Work breakdown

| # | Task | Depends on | Done when |
|---|---|---|---|
| F1 | Project setup, folders, tokens, base styles, font | none | Empty page shows cute base styling |
| F2 | `api.js`, `AuthProvider`, route guards | backend auth endpoints (or a mock) | Login state survives refresh |
| F3 | Auth screens with validation and errors | F2 | All error states match the PRD |
| F4 | Layout, top nav, bottom nav, banners, skip link | F1 | Navigation works on phone and desktop |
| F5 | Plant SVG components (4 plants, 4 stages, withered) | design system art specs | All 20 variants render |
| F6 | `SessionProvider` and timer logic | backend session endpoints | Timer stays correct after refresh and tab switch |
| F7 | Focus screen, all states | F5, F6 | Every state in section 6.2 works |
| F8 | Tasks screen and Focus link | tasks endpoints | CRUD and "x of y Pomodoros" work |
| F9 | Settings screen and alerts | settings endpoints | Limits enforced, lock during session |
| F10 | Garden screen and stats | garden endpoint | Grown and withered lists, stats tiles |
| F11 | Notifications (banner, sound, browser) | F6, F9 | One alert per completion |
| F12 | Accessibility and responsive pass | F3 to F11 | Checklists in sections 11 and 12 pass |
| F13 | Polish: animations, empty states, microcopy | F12 | Matches the design system |

**Parallel work tip:** while the backend is not ready, the frontend can use a small fake API (mock responses based on `API-SPEC.md`). This lets both teams work at the same time.

---

## 16. Definition of done (frontend)

- Matches the screens and states in section 6.
- Works at 320 px, 390 px, 768 px, and 1280 px widths.
- Keyboard-only and screen-reader checks pass for the main flow.
- No console errors or warnings in a normal session.
- Error, empty, and loading states exist for every data screen.
- Reviewed by at least one other team member.
