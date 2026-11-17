# Rootine Product Requirements Document

| Document detail | Value |
|---|---|
| Product name | **Rootine** |
| Course | CS0053 |
| Status | Draft for review and approval |
| Version | 0.4 |
| Primary release | Responsive web MVP |

> **Decision labels:** **Confirmed** means the current product concept establishes the decision. **Assumption A-#** is a proposed default that still needs approval. **Open Question OQ-#** requires a product or course decision before the affected feature is finalized.

---

## 1. Product Overview and Positioning

### 1.1 Product summary

Rootine is a personal productivity web app that combines a Pomodoro-style focus timer with a virtual plant-growing experience. Starting a focus session plants a seed. The plant advances through visible growth stages as the timer runs. Completing the session adds the grown plant to the user's garden; giving up produces a withered result.

Rootine is positioned as a student-first focus companion for people who want more motivation than a plain countdown timer provides. It supports individual focus habits and basic personal task planning. It is not intended to replace a full project manager, calendar, website blocker, or team collaboration tool.

### 1.2 Name rationale

**Rootine** is the final product name. The name is a wordplay on **root** and **routine**, connecting the plant-growth interaction with the goal of building a regular focus habit. This is the intended product rationale, not a claim about trademark availability or market uniqueness.

### 1.3 Problem statement

Students and independent workers are often interrupted, lose motivation during long tasks, or ignore a plain timer because it provides little sense of progress. Existing timer behavior can also become frustrating when a page refresh loses a session or when rewards do not clearly reflect completed work.

Rootine should make elapsed focus time visible, make completion feel rewarding, and preserve an accurate session state without turning the app into invasive monitoring.

### 1.4 Value proposition

Rootine turns focused time into a small, persistent visual collection. Users receive:

- a clear structure for alternating configurable focus sessions and breaks;
- a basic task list that connects planned work to completed focus sessions;
- visible progress while focusing;
- a garden that records completed sessions;
- optional rewards, streaks, categories, and statistics for longer-term habit tracking.

---

## 2. Goals and Success Indicators

The targets below are MVP validation targets for a student project. They do not claim long-term behavior change.

| ID | Product goal | Measurable MVP indicator |
|---|---|---|
| G-1 | Let users complete a structured focus cycle. | At least 4 of 5 test users can register, start a session, complete it, and find the resulting plant without assistance. |
| G-2 | Keep the timer dependable. | The displayed remaining time differs from elapsed wall-clock time by no more than 1 second during a 25-minute test, including a background-tab period. |
| G-3 | Make focus progress understandable. | At least 4 of 5 test users correctly explain what the plant stage and completed garden plant represent. |
| G-4 | Prevent session loss during common interruptions. | Refreshing the active session page restores the same session and correct remaining time in all supported-browser test cases. |
| G-5 | Deliver the agreed MVP reliably. | All P0 acceptance criteria pass, with no unresolved blocker or critical defects before submission. |
| G-6 | Gather usable feedback. | At least 5 representative users complete the core-flow test and a short feedback survey. |
| G-7 | Connect planned tasks to focused work. | At least 4 of 5 test users can create a task, select it for a session, and find the updated completed-session count without assistance. |
| G-8 | Make the core experience usable on phones. | All P0 flows pass the representative mobile viewport checks in AC-21 and AC-22 without horizontal page scrolling. |
| G-9 | Protect accounts and personal records. | All security acceptance criteria pass with no known unresolved critical vulnerability before release. |

If Rootine is used beyond classroom testing, possible later indicators include completed sessions per active user, repeat use across separate days, and focus-session completion rate. Collecting product analytics is not part of the MVP unless OQ-12 is approved.

---

## 3. Target Users, Needs, and Pain Points

### 3.1 Primary persona: Student

**Context:** A college or high school student studying independently, reviewing material, or completing assignments.

**Needs**

- Start a focus session quickly with little setup.
- Capture, update, complete, and remove study tasks without opening a separate tool.
- Connect a task to a focus session and see how many sessions it has received.
- See how much time remains and whether progress is being saved.
- Receive motivation to finish without distracting interactions.
- Review completed work over time.

**Pain points**

- Phone, browser, and environmental interruptions.
- Large tasks that feel difficult to begin.
- Plain timers that are easy to dismiss.
- Lost progress after an accidental refresh.

### 3.2 Secondary persona: Young professional or freelancer

**Context:** A person completing independent work in focused blocks.

**Needs**

- Flexible session lengths.
- Optional links between sessions and tasks.
- A simple view of focus time by day, week, month, task, or category.

**Pain points**

- Frequent context switching.
- Difficulty estimating time spent on a task.
- Productivity tools with more project-management features than needed.

### 3.3 Administrative user

An administrative user was suggested in the original concept, but the need and authority of this role are unconfirmed. Admin tools are outside the MVP until OQ-3 is answered. Rootine must not expose user-management controls merely because a user is a project owner or developer.

---

## 4. Scope and Release Priorities

| Priority | Meaning |
|---|---|
| **P0 — Must** | Required for the MVP to be accepted. |
| **P1 — Should** | Valuable after the core flow is stable; include only if time permits. |
| **P2 — Future** | Candidate enhancement, not committed for the MVP. |

### 4.1 MVP scope (P0)

- Email/password registration (no email verification), login, logout, and change password while signed in. Password reset is out of scope.
- Basic personal task management: create, edit, complete, and delete tasks; optionally estimate Pomodoro sessions; select a task for a focus session; and count completed sessions against it.
- Focus-session setup with a seed and editable Pomodoro settings.
- Default settings of 25-minute focus, 5-minute short break, 15-minute long break, and a long break after 4 completed focus sessions, saved per authenticated account.
- Accurate countdown based on timestamps, with Pause, Resume, and Give up controls.
- Four visible plant-growth stages.
- Explicit give-up flow with confirmation and a withered result.
- Completed-session result and persistent garden entry.
- Pomodoro-style short and long break flow.
- One in-app completion alert per finished focus or break, optional sound, and optional permission-based browser notifications with an in-app fallback.
- Recovery after refreshing an active session.
- Secure-by-default access, storage, and session handling as defined in Sections 11 and 12.
- Mobile-first, responsive, keyboard- and touch-usable core screens.

**Assumption A-1:** The MVP launches with 2 to 3 plant types so every type can have complete, consistently licensed artwork. More variety can follow.

### 4.2 Post-MVP scope (P1)

- Task categories.
- Coins, unlockable plants, and a shop/catalog.
- Focus statistics and streaks.

### 4.3 Future candidates (P2)

- Guest mode and profile personalization.
- Achievements, rare plants, and badges.
- Ambient sounds and dark mode.
- Friends, leaderboards, and group focus rooms.
- Admin tools, if a valid admin use case is approved.
- Guided onboarding, streak freeze, and weekly summary.
- Optional strict-focus mode that reacts to extended tab absence.
- Push notifications that can be delivered through a PWA, service worker, or backend when Rootine is closed, subject to later architecture and privacy decisions.
- Expansion to 4 to 6 launch-quality plant types after the initial art set is complete.

### 4.4 Explicit non-goals for the MVP

- Native iOS or Android apps; the web app will be responsive instead.
- Payments, subscriptions, or real-money purchases.
- Team/company workspaces, shared task management, group task assignments, or collaboration.
- Calendar integrations and complex scheduling or due-date automation.
- Website/app blocking, device surveillance, or proof that the user was continuously attentive.
- Full offline-first support.
- Social feeds, friends, leaderboards, and group rooms.
- Advanced project-management features such as subtasks, dependencies, file attachments, or recurring-work automation.
- Health, medical, or guaranteed productivity claims.

---

## 5. Product Principles and Definitions

- **Focus session:** A timed work period selected and started by the user.
- **Break:** A timed rest period. Breaks do not grow plants, earn coins, or count toward focus totals.
- **Completed session:** A focus session whose timer reaches zero and whose completion is recorded successfully.
- **Given-up session:** A session the user explicitly ends before zero after confirming the action.
- **Abandoned session:** A session left unresolved because the browser or device was closed. Its final treatment is pending OQ-5.
- **Garden plant:** A persistent visual record of a focus-session outcome, including the date and planned duration.
- **Task:** A personal work item with a required title, optional estimated Pomodoro count, completion state, and a count of completed focus sessions linked to it.
- **Pomodoro settings:** Per-account focus, short-break, long-break, and long-break-interval defaults used for sessions created after a settings change.
- **Streak:** Consecutive local calendar days with at least one completed focus session. This is P1 and uses Assumption A-7 until confirmed.

Rootine should motivate through visible progress rather than punishment. **Assumption A-2:** Merely switching tabs does not fail an MVP session. A strict-focus option may be tested later, but it must be disclosed and opt-in.

---

## 6. Key User Journeys

### J-1: First completed focus session

1. A new user opens the landing page and chooses **Register**.
2. The user creates an account and reaches the Focus screen.
3. The user optionally selects an existing task, selects an available seed, confirms the saved focus duration or chooses another valid duration, and starts.
4. The timer counts down while the plant changes growth stages.
5. At zero, Rootine records the session once and shows a completion result.
6. The fully grown plant appears in the user's garden with its date and duration.
7. Rootine offers the appropriate break.

**Success:** The user can find the new plant after completion and the timer remains accurate.

### J-2: Returning user begins quickly

1. The user logs in.
2. Rootine shows the Focus screen with the user's saved Pomodoro defaults.
3. The user may select a task, but can start a session without creating or selecting one.

**Success:** Task selection never blocks the core timer flow, and saved settings avoid repeated setup.

### J-3: User pauses, resumes, or gives up

1. During an active focus session, the user can select **Pause**; the remaining time and plant progress stop advancing.
2. The user selects **Resume** to continue from the paused remaining time without changing the session's planned duration.
3. If the user instead selects **Give up**, Rootine explains that the plant will wither and the session will not earn completion rewards.
4. The user cancels and continues, or confirms.
5. On confirmation, Rootine stops the session and shows a withered result.

**Success:** Pause and Resume do not reset or extend the planned work duration, accidental Give up activation does not end the session, and confirmed give-up is recorded only once.

### J-4: User refreshes during a session

1. The user refreshes the page while the timer is active or paused.
2. Rootine restores the same active or paused session.
3. Remaining time is recalculated from stored timestamps.
4. The correct plant stage is displayed.

**Success:** Refreshing does not reset, extend, duplicate, or automatically fail the session.

### J-5: User takes a break

1. Rootine identifies whether the next break is short or long from the user's saved interval.
2. **Assumption A-3:** Rootine prompts the user, and the break begins only after the user selects **Start break**.
3. The break timer ends with one in-app completion alert; enabled sound and enabled/permitted browser notifications may also run.
4. The user returns to the Focus screen.

### J-6: User plans and tracks a task (P0)

1. The user creates a task with a title and may add an estimated Pomodoro count.
2. The user can edit its title or estimate, mark it complete or incomplete, and delete it after a confirmation or with a short Undo opportunity.
3. The user selects one of their tasks for a focus session, or starts with no task.
4. After a linked focus session completes, Rootine increments that task's completed-session count exactly once.
5. The user can see progress against the estimate when an estimate exists.

**Success:** Task changes persist only for the owner, deleting a task does not delete historical sessions, and only completed linked focus sessions increment its count.

### J-7: User changes Pomodoro settings (P0)

1. Before starting a session, the user opens Settings and changes focus, short-break, long-break, or long-break-interval values within the allowed ranges.
2. Rootine saves the values to the authenticated account and uses them for subsequently created sessions.
3. During an active or paused focus or break session, Pomodoro settings are locked. The user retains the session controls available for that session, including Pause, Resume, or Give up for a focus session.

**Success:** Valid settings survive logout and login, invalid values are rejected, and changing settings never changes an already-created session.

### J-8: User enables completion notifications (P0)

1. Completion alerts work in-app without notification permission.
2. The user can independently toggle completion sound. Browser notifications remain off until the user selects **Enable Notifications**.
3. Rootine asks for browser permission only in direct response to **Enable Notifications**.
4. Only if permission is granted and the browser supports the API, Rootine may show one generic system notification when a focus session or break completes.
5. If permission is denied, unavailable, or later revoked, Rootine keeps the in-app alert and explains the fallback without blocking the flow.

**Success:** Rootine does not prompt on page load, does not repeat the same completion notification, and does not claim delivery after the browser is fully closed.

---

## 7. Information Architecture and Main Screens

### 7.1 Primary navigation

For an authenticated user, primary navigation contains:

1. **Focus** — task selection, session setup, active timer, plant growth, break timer, and result states.
2. **Tasks** — basic personal task management and completed-session progress (P0); categories may follow in P1.
3. **Garden** — completed plants and their session details. **Assumption A-4:** a separate filtered history view on this screen contains withered results.
4. **Settings** — P0 Pomodoro, sound, browser-notification, motion, and account/session controls.

When implemented after the P0 flow is stable, **Stats** (P1) adds focus totals, streaks, and charts; **Shop / Plant Catalog** (P1) adds available, locked, and unlocked plants; and **Profile** options follow FR-4 (P2). Unavailable P1/P2 destinations must not appear as dead navigation items.

### 7.2 Supporting screens and states

- Landing page.
- Register and login screens.
- Empty garden, empty task list, and no-statistics states.
- Loading, save failure, invalid input, notification-permission denied/unsupported, and offline states.
- Give-up and destructive task-delete confirmation dialogs, or a task-delete Undo state.
- Completion and withered result states.

Rootine uses a mobile-first layout. On phone viewports, primary Focus, Tasks, Garden, and Settings destinations use compact or bottom navigation; timer and task primary actions remain thumb-reachable and are not hidden behind hover interactions. Portrait and landscape layouts expose equivalent actions, respect device safe areas, and adapt when the mobile keyboard opens. Labels and available actions remain equivalent across screen sizes. Rootine does not claim native-app behavior.

---

## 8. Functional Requirements

### 8.1 Account and access

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | A user can register by giving a nickname, full name, age (5 to 120), gender (female, male, non-binary, or prefer not to say), a valid email address, a password, and a matching confirm-password entry. Invalid and duplicate-account cases show a clear error without exposing sensitive account details. Age and gender are shown only to the account owner and are deleted with the account (FR-39). | P0 |
| FR-2 | A registered user can log in and explicitly log out. Protected personal screens require authentication. | P0 |
| FR-3 | Removed by team decision. There is no password reset and no email verification. A new account is usable right after registration. | Removed |
| FR-4 | A user can edit their nickname, full name, age, and gender in Settings. Avatar upload stays P2. | P1 |
| FR-5 | A visitor can try one non-persistent session without an account. Whether the result can be transferred after registration is unresolved. | P2 |

### 8.2 Focus timer and breaks

| ID | Requirement | Priority |
|---|---|---|
| FR-6 | Before starting, a user can use the saved focus duration or select another whole-minute focus duration from 15 through 60 minutes. A new account defaults to 25 minutes. | P0 |
| FR-7 | During a session, Rootine displays the remaining time, current plant, selected task if any, and unambiguous Pause and Give up actions. | P0 |
| FR-8 | Remaining time and growth are derived from stored start/target timestamps rather than counting `setInterval` ticks. Backgrounding the tab must not make the timer drift. | P0 |
| FR-9 | A user can pause and resume an active focus session. Pausing freezes remaining time and plant progress; resuming calculates a new target timestamp from the frozen remaining time. Pause/Resume cannot reset elapsed progress, alter the planned duration, or create another session. | P0 |
| FR-10 | Selecting Give up opens a confirmation. Cancel returns to the unchanged active or paused session; confirm stops it and records one given-up result. | P0 |
| FR-11 | New accounts default to a 5-minute short break, a 15-minute long break, and a long break after every 4 completed focus sessions. Break-start behavior follows Assumption A-3. | P0 |
| FR-12 | Only while no focus or break session is active or paused, a user can set focus to 15–90 minutes, short break to 3–20 minutes, long break to 10–30 minutes, and the long-break interval to 2–6 completed focus sessions, using whole numbers. Valid settings persist per authenticated account and apply to subsequently created sessions. Once a session starts, its target duration cannot be edited. | P0 |
| FR-13 | At the end of each focus session or break, Rootine shows one in-app completion alert and, when the user enables it, plays one completion sound. Audio or notification failure must not block completion or reward processing. | P0 |
| FR-35 | Browser/system notifications are optional and off until the user selects an explicit **Enable Notifications** action. Rootine requests browser permission only in response to that action. If permission is denied, revoked, or unsupported, Rootine explains that status and continues to use the in-app completion alert. | P0 |
| FR-36 | Settings provide an independent sound toggle and browser-notification controls appropriate to permission state: **Enable Notifications** before a permission request, an app preference after permission is granted, and status/browser-settings guidance when denied, revoked, or unsupported. Rootine sends no more than one browser notification for a completed focus session or break, uses generic text without task details by default, and states that delivery is not reliable when the browser is fully closed. Closed-browser push delivery is P2. | P0 |

### 8.3 Plant growth and session outcomes

| ID | Requirement | Priority |
|---|---|---|
| FR-14 | Every available plant has four complete visual stages: seed, sprout, small plant, and full plant. **Assumption A-6:** stages begin at 0%, 25%, 60%, and 100% elapsed; the full plant appears on completion. | P0 |
| FR-15 | The active screen communicates stage changes with an image change or animation. Reduced-motion settings must preserve the same information without required motion. | P0 |
| FR-16 | Successful completion marks exactly one full-plant record as finished and waiting to be collected, linked to the session. The user adds it to the garden with **Collect plant** (FR-40). Finished focus time counts toward statistics and streaks right away, even before the plant is collected. | P0 |
| FR-17 | Confirmed give-up creates a withered result, grants no completion rewards, and follows the display location in Assumption A-4. | P0 |
| FR-18 | A future strict-focus mode may detect an extended tab absence and wither a plant after a disclosed grace period. It is not enabled in the MVP and must not be added until OQ-5 is decided. | P2 |

### 8.4 Garden and rewards

| ID | Requirement | Priority |
|---|---|---|
| FR-19 | The Garden shows all completed plants for the authenticated user. Each entry includes at least the plant type, completion date, and planned focus duration. | P0 |
| FR-20 | A completed focus session can earn coins according to one documented formula. Given-up sessions and breaks earn none. The formula is pending OQ-8. | P1 |
| FR-21 | A user can spend sufficient coins once to unlock a locked plant type. A transaction must not produce a negative balance or duplicate charge. | P1 |
| FR-22 | Rare plants can be unlocked by documented achievements, such as a 7-day streak. | P2 |
| FR-23 | A user can earn milestone badges, such as first session, 10 sessions, or 100 completed focus hours. | P1 |

### 8.5 Tasks

| ID | Requirement | Priority |
|---|---|---|
| FR-24 | A user can create, edit, mark complete or incomplete, and delete their own tasks. A task requires a non-blank title and may include an optional positive whole-number estimated Pomodoro count. Deletion requires confirmation or provides a short Undo action. | P0 |
| FR-25 | A user can optionally select one of their tasks before starting a focus session. Starting without a task remains allowed. | P0 |
| FR-26 | Each task shows its completed focus-session count and, when an estimate exists, progress against that estimate. A completed focus session increments the selected task exactly once; given-up sessions and breaks do not. | P0 |
| FR-37 | A user can optionally organize tasks with personal categories and review category-level focus totals. | P1 |
| FR-38 | A user can set a daily goal of 1 to 12 completed focus sessions (default 4). The Focus screen shows progress toward today's goal, using the same local-day boundary as the statistics. Changing the goal never changes past sessions. | P1 |
| FR-39 | A signed-in user can permanently delete their account after confirming with their password. All their data (tasks, sessions, plants, settings) is removed, other devices are signed out, and the confirmation states that this cannot be undone. This also covers the missing password reset, so users are never locked into data they cannot remove. | P1 |
| FR-40 | After each finished focus session the user can **collect** the plant to add it to the Garden, one at a time or all at once. A plant that is not collected stays waiting (it is never lost if the tab is closed) and appears in "Ready to collect" on the Focus screen and in the Garden. Collecting twice changes nothing. Only the owner can collect, and only finished focus sessions (not breaks, given-up, or running sessions). | P1 |
| FR-41 | While a focus session runs, the plant grows smoothly with the elapsed time (seed, leaves unfurling, flower opening), with a small pop and sparkles at each stage, and confetti when it is fully grown. Reduced-motion settings replace the animation with static images that still show the stage. | P1 |
| FR-42 | The Focus screen offers ready-made rhythms: Sprint 15/3, Classic 25/5 (marked "Great for beginners"), Focus Block 40/10, Deep Work 50/10, Extended Sprint 75/15, and Ultradian Rhythm 90/20, plus Custom. Each shows who it is best for. Choosing one saves the focus length and short break to the account, so the timer and the breaks use them. New accounts start on Classic. The long break and the long-break interval are not changed by a rhythm. They stay as set in Settings. | P1 |
| FR-43 | A short guided tour explains the app to beginners: picking a rhythm, a seed, and a task, starting, growing, collecting, and the Tasks, Garden, and Settings tabs. It opens once on the first visit, can be skipped, closed with Escape, and replayed from the **?** button or Settings. It is keyboard operable and readable by screen readers. | P1 |
| FR-44 | There are 13 plants: nine flowers and plants (Sunflower, Cactus, Tulip, Sakura, Rose, Daisy, Lavender, Succulent, Mushroom) that can be grown with any focus length, and four trees that need a longer focus: Pine Tree 40 minutes or more, Apple Tree 50, Cherry Blossom Tree 75, and Golden Ginkgo 90. The Focus screen groups them and shows locked trees with the minutes they need. The server refuses a tree that is too short for the chosen focus length. | P1 |
| FR-45 | A **Yard** tab shows the plants the user has collected and lets them place them outside in a yard scene. A plant can be dragged (mouse, pen, or finger), moved with the arrow keys, and put back with Delete or a button. Positions are saved to the account, so the yard looks the same on every device. At most 60 plants can be outside at once. Only collected plants of the signed-in user can be placed. | P1 |
| FR-46 | The landing page ends with a footer: the brand and a short description, links to its sections, links to create an account or log in, a few facts, the year, and a Back to top link. | P1 |

### 8.6 Statistics and streaks

| ID | Requirement | Priority |
|---|---|---|
| FR-27 | The Stats screen shows completed focus time for today, the current week, and the current month. | P1 |
| FR-28 | The Stats screen shows current and longest streaks based on consecutive days with at least one completed session. | P1 |
| FR-29 | Charts show completed focus time by day and, when categories exist, by category. Text values or a table provide an accessible alternative to charts. | P1 |

### 8.7 Optional experience and social features

| ID | Requirement | Priority |
|---|---|---|
| FR-30 | A user can play optional ambient audio, such as rain or nature sounds, with separate controls from completion alerts. | P2 |
| FR-31 | A user can choose a light or dark theme in Settings. The choice is saved to the account and applied on every device. | P1 |
| FR-32 | Users can connect as friends and join an opt-in leaderboard with defined privacy controls. | P2 |
| FR-33 | Friends can join a group focus room and grow plants together under rules defined in a future PRD. | P2 |
| FR-34 | Authorized administrators can manage plant catalog entries and, only if approved, limited user administration. Roles and audit requirements are pending OQ-3. | P2 |

---

## 9. Business Rules

| ID | Rule |
|---|---|
| BR-1 | A user can have at most one active focus session at a time across the app. Repeated Start actions must not create duplicates. |
| BR-2 | Only a completed focus session adds a full plant, completed focus time, streak credit, achievements, or coins. |
| BR-3 | A confirmed given-up session stops immediately, produces one withered result, and cannot later become completed. |
| BR-4 | Breaks never produce plants or completion rewards and do not count toward the configured number of completed focus sessions used to select a long break. |
| BR-5 | The long-break counter advances only after completed focus sessions and compares against the saved interval in effect when each focus session starts. The exact reset behavior when a long break is skipped is part of OQ-6. |
| BR-6 | Completion processing is idempotent: refreshes, repeated requests, or multiple open tabs cannot grant the same plant, task-session credit, or reward more than once. |
| BR-7 | Before rewards are introduced, every MVP plant is available for selection. After FR-21 is introduced, a user may select only initially available or unlocked plants. |
| BR-8 | Statistics use completed focus duration. Given-up elapsed time may be retained in history but does not contribute to focus totals. |
| BR-9 | Users can view and change only their own profile, settings, tasks, sessions, garden, rewards, and statistics. |
| BR-10 | **Assumption A-7:** Day, week, month, and streak boundaries use the user's local time at session completion; the week begins Monday. Time-zone behavior is pending OQ-9. |
| BR-11 | Deleting a task must not delete historical sessions. **Assumption A-8:** historical sessions keep a non-editable copy of the task title. |
| BR-12 | A session snapshots its focus or break duration when it is created. Later settings changes affect only future sessions and never alter an active or paused session's target duration. |
| BR-13 | Marking a task complete does not delete it or its session history; the owner may mark it incomplete again. |
| BR-14 | A focus or break completion event can produce at most one in-app alert, one sound, and one browser notification. Notification delivery and session outcome processing are independent. |

---

## 10. Edge Cases and Expected Handling

| Situation | Expected behavior |
|---|---|
| Start is clicked repeatedly | Create one active session and disable or ignore duplicate submissions. |
| No seed or an invalid duration is selected | Do not start; identify the field and explain the allowed value. |
| Pause or Resume is clicked repeatedly or from another tab | Apply each valid state transition once; preserve elapsed progress and one active session. |
| The user tries to edit Pomodoro settings during an active or paused focus or break session | Reject the edit, keep the saved settings and current session target unchanged, and explain that changes are allowed before the next session starts. |
| A setting is blank, fractional, or outside its allowed range | Reject it, keep the last valid saved value, and show the permitted whole-number range. |
| The tab goes to the background | Continue based on timestamps. Do not fail the session under Assumption A-2. |
| The page refreshes before the end | Restore the active or paused session, remaining time, selected plant/task, and correct growth stage. |
| The browser closes and reopens before the target end | Restore the active session if recoverable. Browser/system notification delivery while fully closed is not promised. |
| The browser reopens after the target end | Do not issue duplicate task credit, plant, or reward. Whether an unresolved session completes or becomes abandoned is pending OQ-5. |
| The network is unavailable while saving | Keep the user informed and retry or allow retry; do not show a saved reward or task-session increment until persistence succeeds. Full offline mode is out of scope. |
| The same account opens Rootine in multiple tabs | Show the same active session and prevent a second one from starting. Completion, give-up, task credit, and alerts can be applied only once. |
| Browser notification permission is denied, revoked, or unsupported | Keep the in-app completion alert available, show the current setting status, and continue normally without repeated permission prompts. |
| A completion event is received more than once | Show no duplicate alert, sound, or browser notification and grant no duplicate session result or task credit. |
| The browser is locked or shows a system notification preview | Use generic completion text by default; do not include the task title or other sensitive task details. |
| A plant image fails to load | Preserve timer controls and show the plant name/stage as text rather than blocking the session. |
| The device clock or time zone changes | Never duplicate a result or reward. Reconcile using the stored session timestamps; final cross-time-zone rules follow OQ-9. |
| The user logs out during an active session | Ask for confirmation. Final treatment of the active session follows the same give-up/abandonment decision in OQ-5. |
| A task title is blank or contains only whitespace | Reject the save, preserve the user's other valid input, and identify that a title is required. |
| A task title or other text contains markup or script-like input | Validate its length and format, store it as data, and encode it on output so it cannot execute. |
| Delete is selected accidentally | Require confirmation before removal or provide the documented short Undo opportunity. Repeated deletion requests must remain harmless. |
| A task linked to old sessions is deleted | Keep historical session totals and the copied task label under Assumption A-8; do not allow new sessions to select the deleted task. |
| A user requests another user's task, settings, session, or garden identifier | Reject the request at the data boundary without revealing the other user's record. |
| Login or registration receives repeated automated attempts | Apply the documented rate limit or equivalent abuse control and return a safe, non-enumerating response. |
| An authenticated session expires or is invalidated | Reject protected actions, clear unusable local authentication state, and direct the user to log in again without exposing saved records. |
| A state-changing request lacks required CSRF protection | Reject it without applying the change when the chosen authentication mechanism is susceptible to CSRF. |
| A phone rotates, the keyboard opens, or a safe-area inset is present | Reflow without horizontal page scrolling; keep the focused field and primary timer/task actions visible and operable. |
| The user zooms text or the page | Reflow core content without clipping controls or requiring two-dimensional scrolling at the tested zoom level. |
| The user prefers reduced motion | Replace nonessential transitions with static stage changes and retain all status information. |

---

## 11. Non-Functional Requirements

| ID | Area | Requirement / verification target |
|---|---|---|
| NFR-1 | Performance | Core screens become usable within 3 seconds on the team's agreed test device and connection. The test profile must be recorded with results. |
| NFR-2 | Timer accuracy | A 25-minute timer remains within 1 second of elapsed wall-clock time, including at least 5 minutes with the tab in the background. |
| NFR-3 | Responsiveness | P0 flows use a mobile-first layout and work without horizontal page scrolling from a 320 CSS px viewport through tested desktop sizes, except where two-dimensional scrolling is unavoidable for user content at zoom. Representative portrait and landscape sizes are defined in AC-21. |
| NFR-4 | Compatibility | P0 flows pass on the current stable versions available to the team of Chrome, Edge, Firefox, and Safari. Any unavailable test platform is documented as a constraint. |
| NFR-5 | Accessibility | Target WCAG 2.2 AA for P0 screens: sufficient contrast, semantic labels, visible focus, logical keyboard order, keyboard-operable controls, no color-only status, meaningful text alternatives, and reflow at 200% browser zoom. |
| NFR-6 | Motion and alerts | Honor reduced-motion preferences. Do not require animation, audio, or browser notifications to understand or complete a session. |
| NFR-7 | Reliability | A refresh during an active or paused session restores correct state. Completing or giving up is atomic and cannot create duplicate plants, task-session credit, or rewards. |
| NFR-8 | Authentication and passwords | Use an established authentication service or a current salted, adaptive password-hashing method. Never store, transmit outside an encrypted connection, or log plain-text passwords. Release checks must verify that stored credentials are not recoverable passwords. |
| NFR-9 | Privacy and data minimization | Maintain a data inventory that maps every collected field to an approved feature. Collect only required account, settings, task, session, garden, and reward data; include no third-party advertising or undisclosed tracking. |
| NFR-10 | Error handling | User-facing errors state what failed and the next available action without exposing stack traces, credentials, tokens, account existence, internal identifiers, or database details. |
| NFR-11 | Data integrity | Session outcome, plant grant, task-session credit, statistics credit, and later coin credit remain consistent after retries, repeated events, or concurrent tabs. |
| NFR-12 | Session security | The chosen authentication approach must document idle and absolute session lifetimes, reject expired or invalidated credentials, and invalidate the current session on logout. If cookies carry authentication, they use `Secure`, `HttpOnly`, and an appropriate `SameSite` value; an equivalent non-cookie design must document how it protects tokens from theft and cross-site requests. |
| NFR-13 | Authorization | Every operation on settings, tasks, sessions, garden records, rewards, and statistics enforces authenticated ownership at the data boundary. Cross-user positive and negative tests are required for every personal record type exposed by the MVP. |
| NFR-14 | Input and output safety | Validate type, length, format, and allowed range at each trust boundary. Treat user text as data and contextually encode output. Stored and reflected XSS test payloads in task titles and other user-controlled fields must not execute. |
| NFR-15 | CSRF protection | If the authentication design allows credentials to be sent automatically across sites, every state-changing request must use an effective CSRF defense and reject a test request with missing or invalid protection. |
| NFR-16 | Transport security | Deployed environments use HTTPS for all authenticated and personal-data traffic, redirect HTTP to HTTPS, and load no active content over an insecure connection. |
| NFR-17 | Abuse protection | Authentication endpoints use a documented rate limit or equivalent abuse control per relevant account and client signal. A test that exceeds the documented threshold within its window must be throttled or rejected without revealing account existence. |
| NFR-18 | Password reset | Removed by team decision. |
| NFR-19 | Secrets and maintenance | Secrets remain outside source code and client bundles unless explicitly public client configuration. Before release, run a dependency/security scan, resolve all known critical findings, and either resolve each high finding or record an approved mitigation and owner. |
| NFR-20 | Notification safety | Deduplicate completion alerts across retries and tabs. Browser notification previews use generic copy by default and exclude task titles, email addresses, tokens, and other sensitive details. |
| NFR-21 | Mobile interaction | Interactive P0 controls have touch targets at least 44 by 44 CSS px. Core screens remain operable with browser zoom, the mobile keyboard, portrait/landscape changes, and safe-area insets; primary timer and task actions remain visible and thumb-reachable. |

---

## 12. Privacy, Security, Accessibility, and Data

### 12.1 Privacy and data use

- Explain at registration what data is required and why.
- Keep email addresses private; do not display them in public or social areas.
- Treat task titles and task details as potentially sensitive. Exclude them from browser notification previews and analytics by default.
- Ask for browser-notification permission only after the user selects the explicit Enable Notifications action. Denial must not trigger repeated prompts.
- Do not collect tab history, browsing contents, keystrokes, contacts, precise location, or data from unrelated sites.
- Product analytics, if later approved, must use documented events and avoid sensitive task titles by default.
- Data retention, account deletion, and export rules require a decision in OQ-10 before any public release.

### 12.2 Security controls

- Authentication secrets and service credentials must not be committed to source control, shipped in client bundles, or logged, unless a value is explicitly designed and documented as public client configuration.
- Password handling, session expiry and invalidation, HTTPS, and sensitive-endpoint abuse controls must satisfy NFR-8 and NFR-12 through NFR-19.
- Authorization must be enforced at the data boundary for every personal record operation, not only by hiding interface controls.
- Session, task, and user identifiers supplied by the client never prove identity or ownership.
- Validate all client input again at the trust boundary. Encode user-controlled text for its output context and apply an effective CSRF defense where the authentication design is susceptible.
- Completion processing and task-session credit must use a persisted uniqueness or equivalent atomicity rule so request replay, retries, and concurrent tabs cannot produce duplicate rewards.
- Safe errors and logs may contain an internal correlation identifier, but never passwords, authentication tokens, sensitive task text, or stack traces shown to users.
- Before implementation, document a lightweight threat model covering account takeover, credential abuse, session theft, broken object ownership, XSS, CSRF where applicable, request replay/duplicate rewards, secret exposure, and notification privacy. Identify trust boundaries after the architecture is selected rather than assuming a specific backend.

### 12.3 Accessibility and inclusive use

- Every timer and task action must work by keyboard and have a visible text label or accessible name.
- Interactive P0 controls must provide a touch target of at least 44 by 44 CSS px without requiring pixel-perfect tapping.
- Timer changes must not cause disruptive announcements every second. Completion and important state changes should be announced appropriately.
- Growth stage and withered/completed state must be available as text, not only as color or artwork.
- Users must be able to disable nonessential motion and sound.
- Layout and text must support 200% browser zoom and responsive reflow without hiding core controls.
- When the mobile keyboard opens, the active field, validation message, and save action must remain reachable; safe-area padding must prevent controls from sitting under device cutouts or browser UI.

### 12.4 Conceptual data model

This model describes required product data without choosing a database or backend architecture.

| Entity | Minimum data |
|---|---|
| **User** | id, email/auth reference, nickname (display name), full name, age, gender, created timestamp |
| **Settings** | user id, focus duration, short-break duration, long-break duration, long-break interval, sound-enabled preference, browser-notification-enabled preference, notification permission status if needed, motion preference, theme (when implemented), updated timestamp |
| **Plant catalog entry** | id, name, four stage assets, withered asset, availability, cost/rarity/unlock rule when rewards exist |
| **Garden record** | id, user id, session id, plant id, outcome, created/completed timestamp |
| **Task** | id, user id, title, estimated Pomodoro count (optional), completion state, created/updated/completed timestamps; category is optional when FR-37 is implemented |
| **Focus session** | id, user id, optional task id and copied task label, plant id, planned duration, relevant timestamps, status, elapsed duration, completion timestamp, and uniqueness reference needed for idempotent outcome/task credit |
| **Reward transaction** (P1) | id, user id, session or purchase reference, amount, reason, timestamp |
| **Plant unlock** (P1) | user id, plant id, unlock source, timestamp |

Possible focus-session statuses are `active`, `paused`, `completed`, `given_up`, and `abandoned`. A break can be represented separately or by a session type; that implementation choice must preserve the business rules.

Derived values such as coin balance, current streak, longest streak, and task totals may be stored or calculated. Whichever approach is chosen, session and transaction records remain the source used to verify that credits are not duplicated.

---

## 13. Assumptions, Dependencies, and Constraints

### 13.1 Assumptions requiring confirmation

A-5 is retained for requirement traceability but was resolved by the approved Pomodoro ranges in version 0.3. It no longer requires confirmation.

| ID | Working assumption or status |
|---|---|
| A-1 | The MVP includes 2 to 3 complete plant types; expansion follows after the core art is ready. |
| A-2 | Background tab use alone does not fail an MVP session. |
| A-3 | Breaks are offered automatically but start only when the user confirms. |
| A-4 | Withered results appear in a history filter within Garden, separate from the main completed garden. |
| A-5 | **Resolved:** The earlier proposed 1–180 minute custom range is replaced by FR-6 and FR-12: focus 15–90, short break 3–20, long break 10–30, and interval 2–6, all in whole minutes/sessions as applicable. |
| A-6 | Growth stages begin at 0%, 25%, 60%, and 100% elapsed. |
| A-7 | Streaks and reports use the user's local date, with Monday as the start of the week. |
| A-8 | Deleting a task preserves a copied historical task title on past sessions. |
| A-9 | The project follows the original nine-week outline, but actual dates are not yet known. |

### 13.2 Dependencies

- Approved wireframes for the Focus, result, Garden, and authentication screens.
- Complete and consistently styled assets for each plant's seed, sprout, small, full, and withered states.
- Confirmed rights or licenses for all third-party art, fonts, icons, and audio.
- A chosen authentication and persistence approach that can enforce per-user data access and the controls in NFR-8 and NFR-12 through NFR-19.
- A documented threat model and security test plan after architecture selection.
- Course requirements for framework, database, hosting, documentation, and demo format.
- Access to target browsers and representative phone/desktop sizes for portrait, landscape, zoom, touch-target, keyboard, safe-area, and notification-fallback testing.
- At least 5 representative test participants for MVP validation.

### 13.3 Constraints

- This is a student software project with an unconfirmed team size, schedule, and budget.
- P0 work takes precedence over P1 and P2 features.
- The product is a mobile-first responsive web app, not a native mobile app; native background execution or closed-app delivery is not promised.
- Plant art effort can limit catalog size; incomplete visual stages must not be shipped as selectable plants.
- The app must remain usable when optional sound, browser notifications, animation, rewards, categories, and statistics are unavailable.

### 13.4 Non-binding implementation options

The original draft suggested React with Vite and either Firebase (Authentication, Firestore, Hosting) or a custom Node.js/Express backend with MySQL or MongoDB. Tailwind CSS or plain CSS, Chart.js or Recharts, and SVG or PNG plant assets were also listed.

These are options, not approved requirements. Choose only after the course constraints, team experience, deadline, data access rules, and deployment needs are confirmed. A managed backend may reduce setup time; a custom backend may be necessary if the course requires server-side or SQL work.

---

## 14. MVP Acceptance Criteria

| ID | Acceptance criterion |
|---|---|
| AC-1 | Given valid new-account details, a user can register, enter an authenticated state, log out, and log back in. Invalid or duplicate input produces a useful, non-enumerating error. |
| AC-2 | Given a selected available seed, an optional owned task, and a valid saved or one-time focus duration, starting creates one active session and displays the correct initial time, seed stage, and task label when selected. |
| AC-3 | During a test session, the timer derives remaining time from timestamps and meets NFR-2 after foreground and background periods. |
| AC-4 | Refreshing an active or paused session restores the same session, state, correct remaining time, plant, optional task reference, and growth stage. |
| AC-5 | At the specified elapsed thresholds, the plant displays the appropriate textual and visual stage, including a reduced-motion presentation. |
| AC-6 | When the focus timer reaches zero, Rootine records exactly one completed session, one full garden plant, and one completed-session increment for the selected task, if any. Reloading, retrying, or completing from another tab adds none of them again. |
| AC-7 | When Give up is selected from an active or paused session, Cancel leaves the session unchanged. Confirm records one given-up result, grants no completion or task credit, and cannot later complete. |
| AC-8 | A new account receives 25-minute focus, 5-minute short-break, 15-minute long-break, and 4-session interval defaults. The default fourth completed focus offers a long break; a valid changed interval is honored. Breaks produce no plant or focus/task credit. |
| AC-9 | The Garden shows the authenticated user's completed plants and does not expose another user's records. Its empty state explains how to grow the first plant. |
| AC-10 | All P0 actions can be completed with keyboard only, remain understandable without color, sound, browser notifications, or animation, and have visible focus indicators and accessible names. |
| AC-11 | P0 Focus, Tasks, Garden, authentication, and Settings flows remain readable and usable from 320 CSS px through tested desktop widths without hidden core actions or horizontal page scrolling. |
| AC-12 | Authentication and data-access tests confirm that unauthenticated users cannot access protected records and User A cannot read, create, change, or delete User B's settings, tasks, sessions, garden records, rewards, or statistics by changing identifiers or request data. |
| AC-13 | The complete P0 flow passes on the supported browsers available under NFR-4, and unavailable Safari testing is explicitly reported if the team has no access. Notification API support is recorded separately and does not fail the in-app fallback. |
| AC-14 | At least 5 target users attempt the account, task, focus, and garden flow; at least 4 complete it without assistance, at least 4 find the updated task-session count, and at least 4 correctly explain the plant-growth meaning. Findings are documented. |
| AC-15 | A user can create a task with a required non-blank title and optional positive whole-number estimated Pomodoro count, edit it, mark it complete and incomplete, and delete it using the approved confirmation or short Undo pattern. Invalid input does not save. |
| AC-16 | A session can start with no task or one owned task. Completing a linked session increments only that task once and updates estimate progress; a break or given-up session does not. Deleting the task preserves historical session records and its copied historical label. |
| AC-17 | Settings accept and persist whole-number values only within focus 15–90 minutes, short break 3–20 minutes, long break 10–30 minutes, and interval 2–6 sessions. Values survive logout/login. Invalid values keep the last valid settings. During an active or paused focus or break session, settings controls are unavailable or reject changes, leaving both the saved settings and current session target unchanged. |
| AC-18 | Pausing freezes the displayed remaining time and plant progress. Resuming continues from that value using a recalculated target timestamp; repeated Pause/Resume requests, refreshes, and another open tab do not reset progress or create another session. |
| AC-19 | Completing one focus session and one break each produces one in-app alert without requesting browser permission. The sound toggle independently enables or disables one completion sound, and audio failure does not block the recorded outcome. |
| AC-20 | Rootine requests browser notification permission only after **Enable Notifications** is selected. Granting permission allows one generic completion notification; denial, revocation, or unsupported API keeps the in-app fallback and does not cause repeated prompts. Notification text excludes task details by default, and Settings explains that delivery is not reliable while the browser is fully closed. |
| AC-21 | The complete P0 flow is tested at minimum at 320×568, 375×667, and 390×844 CSS px in portrait and at 844×390 CSS px in landscape. Responsive navigation, the timer, task cards, forms, alerts, and notification fallback remain readable and usable with no horizontal page scrolling. |
| AC-22 | At the AC-21 viewports, every P0 interactive control measures at least 44×44 CSS px. At 200% browser zoom and with a mobile keyboard and representative safe-area insets, the focused field, validation, navigation, and primary timer/task actions remain reachable and operable without two-dimensional scrolling. |
| AC-23 | Security tests or provider evidence confirm that passwords are handled under NFR-8 and never stored or logged as plain text. |
| AC-24 | The session-security configuration documents idle and absolute lifetimes. Tests confirm that logout and expiry block subsequent protected requests; cookie-based authentication has `Secure`, `HttpOnly`, and appropriate `SameSite` attributes, or the documented alternative passes equivalent token-theft and cross-site-request checks. |
| AC-25 | Boundary tests reject invalid types, lengths, formats, and ranges. Representative stored and reflected XSS payloads in task titles and other user text render without execution. When CSRF applies, a state-changing request with missing or invalid protection is rejected without changing data. |
| AC-26 | In the deployed test environment, HTTP redirects to HTTPS and authenticated pages load no insecure active content. Exceeding the documented authentication attempt threshold triggers throttling or rejection, while user-visible and logged errors expose no account existence, password, reset credential, token, sensitive task text, stack trace, or database detail. |
| AC-27 | A release review confirms that committed source and client bundles contain no private secrets, the collected-data inventory maps each field to an approved requirement, and the dependency/security scan has no unresolved critical finding; every high finding is resolved or has an approved mitigation and owner. |

The MVP is ready for submission when all applicable P0 requirements and AC-1 through AC-27 pass, no blocker or critical defect or unresolved critical security finding remains, plant-asset licenses are documented, high security findings have an approved disposition under AC-27, and any unmet browser constraint is disclosed.

---

## 15. Milestone Template

Dates remain unconfirmed under Assumption A-9.

| Phase | Work | Provisional target |
|---|---|---|
| 1. Planning | Approve PRD, answer blocking open questions, choose stack | Week 1 |
| 2. Design | Mobile-first wireframes, interface mockups, notification/privacy copy, and complete MVP plant art | Week 2 |
| 3. Core build | Authentication, tasks, configurable timer, Pause/Resume/Give up, plant growth, alerts, session persistence, and Garden | Weeks 3–5 |
| 4. P1 work | Categories, statistics, and coins/shop only after P0 is stable | Weeks 6–7 |
| 5. Testing | Functional, security, accessibility, responsive/mobile, notification-fallback, browser, and user testing; fixes | Week 8 |
| 6. Submission | Documentation, screenshots, demo, and final presentation | Week 9 |

---

## 16. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Timer drifts when the tab is in the background | Compute remaining time from stored timestamps and test foreground/background transitions. |
| Refresh, retries, or multiple tabs duplicate rewards | Persist one active session and process each outcome idempotently. |
| Too many features threaten the deadline | Complete and test P0 before starting P1 or P2. |
| Plant art takes too long | Limit MVP to 2 to 3 plants; require all stages and verify asset licenses early. |
| Punishing tab switches frustrates users or creates accessibility issues | Keep strict focus out of MVP; make any later version opt-in with a disclosed grace period. |
| Authentication, session, or ownership flaws expose user data | Complete the threat model after architecture selection, use proven authentication/password handling, enforce ownership at the data boundary, and run AC-12 and AC-23 through AC-27. |
| Retries or multiple tabs duplicate task progress or alerts | Use the same idempotent completion reference for the session outcome and task credit, and deduplicate user-facing alerts. |
| Browser notification permission is denied or delivery is unavailable | Keep in-app alerts as the P0 fallback, request permission only from Enable Notifications, and do not promise fully closed-browser delivery. |
| Lock-screen notifications reveal study details | Use generic notification copy by default and exclude task titles and account details. |
| Phone layouts hide actions behind browser UI or the keyboard | Test the AC-21 viewports, safe areas, zoom, orientation, keyboard states, and 44×44 CSS px targets before release. |
| Team members create integration conflicts | Agree on ownership, use Git branches and pull requests, and integrate small changes regularly. |
| Testing devices or Safari are unavailable | Record the constraint, test available browsers, and arrange external testing if course acceptance requires it. |

---

## 17. Open Questions Requiring Decisions

| ID | Decision needed | Why it matters | Provisional treatment |
|---|---|---|---|
| OQ-1 | What are the deadline, team size, and team roles? | Determines feasible P1 scope and ownership. | Use the nine-week template; build P0 first. |
| OQ-2 | Does CS0053 require a particular language, framework, backend, SQL database, or hosting service? | Blocks the implementation stack decision. | Keep all listed technologies non-binding. |
| OQ-3 | Is an admin role required, and what exact actions may it perform? | Affects authorization, audit, and privacy requirements. | No admin interface in MVP. |
| OQ-4 | Should the MVP cap the number or total duration of pauses? | A limit would change interruption handling and needs clear UX. | Pause/Resume are P0 under FR-9; use no arbitrary cap unless product testing supports one. |
| OQ-5 | What happens when a user changes tabs, closes the browser, logs out, or returns after the target end time? | Defines abandonment, fairness, recovery, and withering behavior. | Tab changes do not fail a session; refresh recovers active or paused state. Post-end closure remains unresolved. |
| OQ-6 | Should breaks start automatically, and what happens to the completed-session count if a long break is skipped? | Affects the main Pomodoro journey. | Prompt and require Start break; reset when the long break is offered. |
| OQ-7 | Are the 0/25/60/100 growth thresholds acceptable for focus durations from 15 through 60 minutes? | Needed for validation and consistent artwork timing. | Use A-6 for design prototypes; duration ranges are resolved in FR-6 and FR-12. |
| OQ-8 | Will coins/shop be included, and what earning formula, prices, starter balance, and unlock rules should apply? | Prevents an arbitrary or frustrating reward economy. | P1; no coins in the P0 acceptance flow. |
| OQ-9 | Which time zone and week-start rules apply when users travel or use multiple devices? | Changes streaks and statistics. | Use A-7 until confirmed. |
| OQ-10 | Must users be able to delete/export accounts, and how long are session and task records retained? | Required before a public release and affects the data model. | Limit collection; define policy before public use. |
| OQ-11 | Is guest mode required, and should a guest result transfer after registration? | Affects storage, onboarding, and conversion flow. | P2; accounts are required for persistent progress. |
| OQ-12 | Is product analytics allowed or expected by the course? | Affects consent, privacy notice, and metric collection. | Use observed user tests only in the MVP. |
| OQ-13 | Should withered plants be visible in the main garden, a history filter, or nowhere after the result screen? | Changes the emotional tone and Garden design. | Use the separate history filter in A-4. |
| OQ-14 | Which plant species, visual style, and asset sources are approved? | Blocks complete stage artwork and licensing review. | Produce 2 to 3 consistently styled MVP plants. |
| OQ-15 | Which P1 features does the instructor expect in the final submission after the expanded P0 is stable? | Determines whether categories, stats, or rewards should be scheduled. | Tasks, editable Pomodoro settings, Pause/Resume, alerts, and security/mobile requirements remain P0; do not promote other features without confirmation. |
| OQ-16 | Which authentication, persistence, and hosting approach will be used, and what idle/absolute session lifetimes fit it? | Defines trust boundaries and the exact password, token, cookie, CSRF, rate-limit, logging, and secret controls. | Keep requirements technology-neutral; document the architecture and threat model before implementation. |
| OQ-17 | Will task deletion use confirmation, a short Undo window, or both, and how long is Undo available? | Affects recovery, accessibility, and whether deletion is delayed or immediately reversible. | Either pattern must satisfy FR-24 and AC-15; decide in interaction design before implementation. |
| OQ-18 | Should completion sound be on or off for new accounts, and which generic browser-notification copy is approved? | Affects disruption, privacy, and user expectations. | Browser notifications stay off until explicitly enabled; keep task details out of notification copy. |
| OQ-19 | Who owns dependency alerts, security review, incident handling, and retention decisions during the course project? | Security controls need named follow-up even when no production operations team exists. | Assign owners before release and record them with the threat model and security test results. |
| OQ-20 | What maximum title length and estimated Pomodoro count should a task allow? | Input limits must prevent abuse while supporting realistic student tasks. | Require a non-blank title and a positive whole-number estimate when present; document and test reasonable upper bounds before implementation. |

---

## 18. Approval

Approving the PRD should include either confirming or replacing unresolved assumptions A-1 through A-4 and A-6 through A-9, and answering the blocking open questions for the intended release. A-5 is resolved by FR-6 and FR-12.

| Name | Role | Status | Date |
|---|---|---|---|
|  |  | ☐ Approved ☐ Changes needed |  |
|  |  | ☐ Approved ☐ Changes needed |  |
