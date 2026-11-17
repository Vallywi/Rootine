# Rootine UX/UI Plan

| Document detail | Value |
|---|---|
| Product | **Rootine** |
| Source | `PRD.md` version 0.4 |
| Status | Implementation-ready UX/UI plan, pending the open decisions in Section 14 |
| Release target | Mobile-first responsive web MVP |
| Accessibility target | WCAG 2.2 AA |

This plan is technology-neutral. It defines the user experience, interface behavior, responsive rules, accessibility requirements, and security/privacy copy needed to design and build Rootine. P0 task management is part of the MVP, not a later enhancement. P1 and P2 items are labeled and must not delay P0 work.

## 1. UX goals and design principles

### 1.1 UX goals

1. **Start focus quickly.** A returning student should be able to choose an optional task, seed, and duration and start from the first authenticated screen.
2. **Make the timer trustworthy.** The interface must clearly show whether a session is starting, active, paused, restoring, saving, complete, or unable to save.
3. **Make task planning part of the core loop.** Creating, editing, completing, deleting, and selecting a task must be easy on a phone and must expose completed-session progress.
4. **Motivate without punishment.** Plant growth should reward continued focus. Giving up should explain the result without shame, guilt, or false claims about attention.
5. **Protect progress.** Refreshes, background tabs, retries, and multiple tabs must not appear to reset or duplicate sessions and task credit.
6. **Work without optional sensory features.** Color, animation, sound, and browser notifications may reinforce a state, but text and structure must always communicate it.
7. **Protect student privacy.** Authentication, errors, notifications, and future account-data controls must avoid exposing account existence, task details, or internal system information.
8. **Fit real student devices.** Every P0 flow must work from 320 CSS px wide, with touch, zoom, rotation, safe-area insets, and an open mobile keyboard.

### 1.2 Design principles

- **Calm before celebratory.** Use warm neutral surfaces, short messages, and restrained motion. Completion may feel rewarding without confetti, urgency, or pressure.
- **One clear next action.** Give each state one visually dominant action, such as **Start focus**, **Resume**, **Start break**, or **Save task**.
- **Progress, not judgment.** Use language such as “Session ended” and “Your task is still here” rather than “failed,” “lost,” or “killed your plant.”
- **Visible system status.** Never hide saving, offline, permission, paused, or recovery states.
- **User control.** The user starts sessions and breaks, confirms Give up, controls sound and browser notifications, and can reverse a task’s complete state.
- **No attention surveillance.** Switching tabs does not fail a session in the MVP. Do not imply that Rootine can prove continuous attention.
- **Consistency across screen sizes.** Phone, tablet, and desktop layouts may rearrange content, but labels, data, and available actions remain equivalent.
- **Progressive disclosure.** Show the essential focus controls first. Keep Pomodoro defaults, notification details, and account controls in Settings.
- **Secure, plain-language feedback.** Explain what the user can do next without revealing whether an account exists or exposing tokens, identifiers, stack traces, or database details.

## 2. Mobile-first information architecture

### 2.1 MVP sitemap

- Public
  - Landing
  - Register
  - Log in
- Authenticated
  - **Today / Focus**
    - Focus setup
    - Active or paused focus session
    - Completion or given-up result
    - Break offer, active break, and break result
  - **Tasks**
    - Task list
    - Create task
    - Edit task
  - **Garden**
    - Completed plants
    - Withered history filter, provisionally following A-4 and OQ-13
  - **Settings**
    - Pomodoro defaults
    - Sound and browser notifications
    - Motion preference
    - Account/session actions
    - Privacy and data controls when OQ-10 is resolved
  - **Stats** (P1, hidden until implemented)

The P0 authenticated landing destination is the **Today / Focus** screen. “Today” is the page title and “Focus” is the navigation label, so the plan does not create a separate P0 analytics dashboard. P1 time totals, streaks, and charts belong to Stats.

### 2.2 Navigation by viewport

- **Phone:** A persistent bottom navigation contains Focus, Tasks, Garden, and Settings. Each item has an icon and visible text label. The active item uses shape, text, and color. Bottom padding includes the device safe-area inset. No action relies on hover.
- **Tablet:** Use either the same bottom navigation or a compact side rail when it improves available content width. Do not switch patterns inside one task.
- **Desktop:** Use a left navigation rail/sidebar with the same destination names. Keep the main content in a readable centered column rather than stretching cards across the viewport.
- **P1 Stats:** Add Stats only when the feature is available. Do not ship a dead navigation item. If phone navigation cannot fit all shipped destinations with 44 by 44 CSS px targets and readable labels, place later-priority destinations in a labeled **More** menu.
- **Active session indicator:** The Focus navigation item may show a small timer/state badge plus the text “Active” or “Paused.” It must not use a colored dot alone.
- **Public screens:** Use a simple header with the Rootine wordmark and Log in/Register actions. Authentication forms remain focused and do not show the authenticated bottom navigation.

### 2.3 Content hierarchy

1. Current session state or primary page heading.
2. Primary action.
3. Task/plant/session context.
4. Supporting explanation and secondary actions.
5. Navigation.

Focus and task actions must remain reachable without scrolling through decorative content.

## 3. Screen-by-screen plan

### 3.1 Landing and authentication

#### Landing

- Show the Rootine name, a one-sentence value statement, a calm plant visual, **Create account** as the primary action, and **Log in** as the secondary action.
- State that Rootine is a responsive web app. Do not imply a native app, device-level blocking, continuous attention detection, or guaranteed notification delivery.
- Keep feature claims to the P0 experience: task planning, configurable focus sessions, plant growth, and a personal garden.

#### Register

- Fields: email, password, confirm password, and a password visibility control. Show "Passwords do not match." inline under Confirm password. Display name/avatar are P2 and must not block registration.
- Show password rules before submission and update rule status without revealing the entered password. Permit paste and password managers.
- Explain required data briefly: we use your email only as your login name. Link to the available privacy notice.
- On success, enter the authenticated state and open Today / Focus. Use a compact first-use hint or empty-state guidance, not a multi-step guided onboarding flow, because guided onboarding is P2.
- Safe failure copy: "We could not create an account with those details. Check the information or try logging in." Do not identify an existing email address.

#### Log in

- Fields: email and password, with **Log in** and **Create account**.
- Generic credential failure: "Email or password is incorrect. Try again."
- Rate-limited failure: “Too many attempts. Wait and try again.” Do not disclose whether the email is registered or expose the threshold if that would weaken the selected abuse controls.
- On session expiry, return here with: “Your session ended. Log in again to continue.” Never claim that a protected change was saved when it was not.

#### Authentication states

- **Loading:** Preserve the form size, show progress in the submit control, and prevent duplicate submission.
- **Inline validation:** Keep entered values except passwords when clearing them is required by the authentication provider’s security behavior.
- **Unexpected error:** “We couldn’t complete that request. Try again.” Include a safe correlation reference only if support processes use it.
- **Offline:** "You are offline. Connect to the internet to log in." Keep non-sensitive form input available for retry; never persist passwords.

### 3.2 Today / Focus dashboard

This is the first authenticated screen and the launch point for a focus session.

- Page title: **Today**. Supporting heading: **Start a focus session**.
- Show a compact task selector with **No task** as an explicit valid option and a shortcut to **Create task**.
- Show the selected seed and focus duration summary.
- Primary action: **Start focus**.
- Secondary links: **Choose seed**, **Change duration**, and **Edit Pomodoro defaults**.
- If a recoverable active or paused session exists, replace setup with **Restoring session…**, then open that session. Do not expose another Start action while recovery is unresolved.
- If another tab owns the current session state, show that same session and explain: “A focus session is already active.”
- First-use state: explain in two short steps that a completed focus grows a plant and may count toward a selected task.
- Do not add P1 totals or streaks to the MVP dashboard.

### 3.3 Task management (P0)

#### Task list

- Header contains **Tasks** and a prominent **New task** control.
- Separate active and completed tasks using headings or a status filter. Do not require categories, search, due dates, subtasks, or descriptions in the MVP.
- Each task card/row contains:
  - full title, wrapping to multiple lines;
  - status text, **Active** or **Complete**;
  - completed-focus count;
  - progress text such as “2 of 4 focus sessions” when an estimate exists, or “2 focus sessions” when it does not;
  - **Focus this task**;
  - **Mark complete** or **Mark active**;
  - labeled Edit and Delete actions, available without hover.
- Marking complete does not delete history. A completed task can be marked active again.
- **Empty:** “No tasks yet. Add a task for what you want to focus on, or start a session without one.” Actions: **New task** and **Start without a task**.
- **Loading:** Use title-length skeletons or a plain “Loading tasks…” status. Keep **New task** available only if creation can safely proceed.
- **Load error:** Keep the page heading and show **Try again**. Do not render stale counts as current without labeling them.
- **Offline:** Show a persistent offline banner. Do not report creates, edits, completions, or deletions as saved until persistence succeeds.

#### Task editor

- Use a full-width page or bottom sheet on phones and a modal or narrow page on larger viewports. The interaction and fields remain the same.
- Fields:
  - **Task title**, required, visible label;
  - **Estimated focus sessions**, optional positive whole number.
- Actions: **Save task** and **Cancel**. Edit mode uses **Save changes**.
- Preserve all valid input when another field fails validation.
- If the user closes an editor containing unsaved changes, confirm: “Discard unsaved changes?” Actions: **Keep editing** and **Discard**.
- On success, return focus to the created/edited task in the list and announce the result.
- OQ-20 must set the maximum title length and estimate before final UI specifications and counter text are approved.

#### Task deletion

The recommended MVP baseline is a confirmation dialog, which satisfies FR-24 and avoids introducing a timed Undo queue before OQ-17 is approved.

- Dialog title: **Delete task?**
- Body: “This removes the task from your list. Past focus sessions stay in your history.”
- Actions: **Keep task** (initial focus) and **Delete task**.
- On confirmed success, return focus to the next logical task or the New task control and announce “Task deleted.”
- If the product chooses Undo instead, do not also show a confirmation. OQ-17 must first define the Undo duration, cross-navigation behavior, and when deletion is committed.
- Repeated delete requests must not create contradictory feedback.

### 3.4 Focus setup

- **Task:** searchable selection is not required for MVP; use an accessible list/select appropriate to the number of tasks. Include **No task** first. Deleted tasks cannot be selected.
- **Seed:** show 2 to 3 available MVP plant choices only after all five required assets (four growth stages plus withered) and licenses are complete. Each option has plant name, image, and selected state.
- **Duration:** default to the saved value. Permit a one-time whole-minute value from 15 through 60. Clearly distinguish “This session” from saved Pomodoro defaults.
- Primary action: **Start focus**. Disable duplicate submission while starting and show “Starting…” in the same control.
- Validation identifies a missing seed and any blank, fractional, or out-of-range duration. Move focus to the first invalid field after submit.
- Starting with no task is valid and must never trigger an error.
- If start fails, retain the choices and show **Try again**. If the server reports an existing session, open that session instead of creating another.

### 3.5 Active and paused focus timer

- Header text: **Focus session**; status badge: **Active** or **Paused**.
- Present remaining time as the most prominent text using tabular numerals. The visual countdown must derive from the authoritative session timestamps, not imply that each displayed tick is the source of truth.
- Display:
  - current plant art in a stable frame;
  - visible text stage: Seed, Sprout, Small plant, or Full plant;
  - optional selected task title, preceded by “Focusing on”;
  - planned duration;
  - save/connectivity status when relevant.
- Active actions: **Pause** and **Give up**. Paused actions: **Resume** and **Give up**. Give up is visually secondary but remains a full-size labeled control.
- Pause and Resume show a brief pending state and reject duplicate activation without changing elapsed progress.
- Settings links may remain visible, but Pomodoro fields are locked with: “Timer settings can be changed after this session.”
- Refresh recovery first shows **Restoring your session…** and then the same active/paused state, time, task, plant, and stage.
- A background tab does not wither or fail the plant. On return, update from timestamps.
- If plant art fails, preserve all controls and show the plant name and stage as text in the art frame.
- **Offline while running:** Keep displaying locally derivable time and show “You’re offline. We’ll confirm the result when connection returns.” Do not show a saved plant or task increment before confirmation.
- **Completion reached but unsaved:** Replace controls with **Saving your completed session…**. On failure, show **Try saving again**. Do not offer Start another session until the outcome is reconciled.

### 3.6 Completion and growth result

#### Completed focus

- Show the full plant, plant name, and heading **Focus session complete**.
- Show planned/completed duration and, when linked, the task title and updated count only after the completion is persisted.
- Present one in-app completion alert. Optional sound and browser notification are independent enhancements and must not delay this state.
- Primary action: **Start short break** or **Start long break**, based on the configured interval. Secondary action: **Back to Focus**.
- State that the plant was added to Garden. Link to **View in Garden**.
- Avoid coins, streaks, or statistics in P0 result copy.

#### Given-up focus

- Give up always opens a confirmation before the session ends.
- Dialog title: **End this focus session?**
- Body: “The plant will wither, and this session won’t count toward your task or completed focus time.”
- Actions: **Keep focusing** (initial focus) and **Give up**.
- After persisted confirmation, show the withered visual, heading **Session ended**, and supportive text: “Your task is still here when you’re ready.”
- Do not award task credit or completion rewards. Offer **Return to Focus** and, optionally, **Try again** with the same setup.
- Under A-4, the result appears in the Garden’s History filter rather than the completed-plants view. This remains pending OQ-13.

#### Result failures

- If completion/give-up persistence fails, show a neutral pending/error state and retry action. Never show both completed and given-up outcomes.
- Dedupe the in-app alert, sound, browser notification, plant, and task credit when completion events repeat or another tab resolves first.

### 3.7 Break states

#### Break offer

- Heading identifies **Short break** or **Long break**, with the configured duration.
- Explain that breaks do not grow plants or add focus/task credit.
- Primary action: **Start break**. Secondary action: **Back to Focus** (skip the offer).
- Breaks do not start until the user selects Start break, following A-3.
- The long-break counter behavior after skipping must follow the final OQ-6 decision. The current provisional PRD treatment resets when the long break is offered.

#### Active break

- Use a simpler, low-stimulation timer with heading **Break**, remaining time, and “Step away if you can.”
- Do not show plant-growth progress.
- Pomodoro settings remain locked during an active or paused break as required by FR-12/AC-17. The PRD does not define break Pause, Resume, or End controls, so none should be added without a product decision.
- At zero, show one in-app alert and any independently enabled sound/browser notification.

#### Break complete

- Heading: **Break complete**.
- Primary action: **Return to Focus**.
- Do not add a garden plant, task credit, focus totals, or rewards.

### 3.8 Garden

- Default view: **Completed plants** for the authenticated user only.
- Each card includes plant art/name, completion date, and planned focus duration. Additional task labels should appear only if approved as necessary because task titles are potentially sensitive.
- Provisional secondary filter: **History**, containing withered results under A-4. Use both icon/art and outcome text.
- **Empty completed Garden:** “Your garden is ready for its first plant. Complete a focus session to grow one.” Action: **Start focus**.
- **Empty History:** “No ended sessions to show.” Avoid congratulating the user for absence of withered results.
- **Loading:** reserve card space to reduce layout shift.
- **Error:** “We couldn’t load your garden.” Action: **Try again**.
- **Offline:** label any previously shown data as not refreshed. Do not claim the newest plant is saved until confirmed.
- Garden records must never expose another user’s data. An access-denied response should use a generic protected-resource error rather than revealing that another record exists.

### 3.9 Statistics (P1, later priority)

- Do not show Stats in MVP navigation until FR-27 through FR-29 are implemented and P0 is stable.
- Later screen sections: completed focus time for today/week/month, current and longest streaks, daily focus chart, and category totals only after FR-37.
- Every chart must have a visible text summary and accessible table alternative.
- Use completed focus duration only. Given-up sessions and breaks do not contribute.
- Empty copy: “Complete a focus session to see your statistics.”
- Time-zone/week labels must disclose the final OQ-9 rules.
- Loading, unavailable range, partial-data, and error states must not render a misleading zero.

### 3.10 Settings

#### Pomodoro settings

- New accounts begin with 25-minute focus, 5-minute short break, 15-minute long break, and a long break after 4 completed focus sessions.
- Fields: Focus (15–90 minutes), Short break (3–20), Long break (10–30), and Long break after (2–6 completed focus sessions). All accept whole numbers only.
- Show allowed range next to each persistent label. Use an appropriate numeric keyboard on mobile without removing keyboard access to non-numeric controls.
- **Save Pomodoro settings** shows pending, success, and error states. Invalid submission retains the last saved values and preserves current input for correction.
- During any active or paused focus or break session, lock all four fields and explain that changes apply to future sessions only.

#### Alerts and notifications

- **Completion sound:** independent on/off control. Label audio failure without changing the saved session outcome.
- **Browser notifications:** status and explicit action rather than a misleading native-style toggle in every state:
  - Off and permission not asked: **Enable Notifications**.
  - Permission granted: status **Allowed** and an app preference to turn Rootine notifications off.
  - Permission denied/revoked: status **Blocked in browser settings**, explanation, and no repeated permission prompt.
  - Unsupported: status **Not supported in this browser**.
- Always state: “In-app alerts still work. Browser notifications may not arrive when Rootine is fully closed.”
- Default generic previews: “Focus session complete. Return to Rootine when you’re ready.” and “Break complete. Rootine is ready.” Final copy is pending OQ-18.
- Never include task title, email address, token, or other sensitive details in browser notification copy by default.

#### Accessibility and motion

- Motion preference: **Use device setting**, **Reduce motion**, with any expanded choices tested to preserve meaning.
- Sound is controlled separately. Turning off motion does not turn off sound, and neither blocks completion.

#### Account and privacy

- Provide **Log out**. If a session is active, confirmation and outcome copy cannot be finalized until OQ-5 defines logout treatment.
- When session expiry occurs, direct the user to log in again and identify unsaved changes honestly.
- Place future **Export my data** and **Delete account** under a clearly labeled **Privacy and data** section after OQ-10 defines availability, retention, verification, and consequences. Do not ship nonfunctional controls or promise deletion/export before that policy exists.
- Avoid badges or copy such as “100% secure.” Describe specific protections or actions only when they are implemented and verified.

## 4. Main user flows

### 4.1 Create, edit, complete, reopen, and delete a task

1. Open Tasks and select **New task**.
2. Enter a non-blank title and optional positive whole-number estimate.
3. Select **Save task**. While saving, prevent duplicates and expose the busy state.
4. On success, return to the task and announce “Task created.” On failure, retain input and offer retry.
5. Select Edit, change allowed fields, and save. Return focus to the updated task.
6. Select **Mark complete**. Update only after successful persistence. The control changes to **Mark active**, making the action directly reversible without confirmation.
7. Select Delete. Confirm **Delete task?**. On success, remove it from selectable tasks while preserving copied historical labels/session records.

Validation branches: blank/whitespace title, fractional/non-positive estimate, and later approved upper bounds block saving and focus the affected field. Offline or expired-session branches do not claim success.

### 4.2 Start a session for a selected task

1. From a task, select **Focus this task**, or choose the task in Focus setup.
2. Confirm seed and one-time/saved duration. The task remains optional.
3. Select **Start focus** once. The control becomes **Starting…**.
4. If no existing session exists, open Active timer with the task label. If one exists, restore it and do not create another.
5. At completion, persist one session, plant, and selected-task increment atomically from the user’s perspective.
6. Show the updated task count on the completion result and later in Tasks. Given-up sessions and breaks do not change it.

### 4.3 Edit Pomodoro settings

1. Open Settings > Pomodoro.
2. If no session is active/paused, edit one or more whole-number values within their displayed ranges.
3. Select **Save Pomodoro settings**.
4. Invalid values remain in the fields for correction while the prior valid settings remain saved.
5. Valid values persist across logout/login and apply only to future sessions.
6. If a focus or break is active/paused, fields are locked. The current session duration remains unchanged.

### 4.4 Complete or give up

**Complete:** Timer reaches zero > outcome enters Saving > one persisted completion creates one plant and optional task increment > show one in-app alert/result > optionally play sound and show one generic browser notification > offer the correct break.

**Give up:** User selects Give up > confirmation receives initial focus on **Keep focusing** > Cancel returns to an unchanged active/paused session > Confirm enters Saving > one given-up result is recorded > show withered result with no completion/task credit > the result cannot later complete.

Retries, refreshes, repeated actions, and multiple tabs must resolve to one outcome and one set of feedback.

### 4.5 Enable notifications or fall back

1. Settings initially shows browser notifications Off and **Enable Notifications**. No permission prompt occurs on page load, registration, or session start.
2. User selects **Enable Notifications**.
3. If supported, Rootine triggers the browser permission request from that action.
4. **Granted:** show Allowed; Rootine may issue one generic system notification per completed focus/break while conditions permit.
5. **Denied:** show Blocked in browser settings; do not ask repeatedly. Keep in-app alerts and independent sound available.
6. **Unsupported:** show Not supported in this browser. Keep the same fallback.
7. **Later revoked:** update the status when detected, do not block completion, and direct the user to browser/site settings without claiming Rootine can change browser permission.
8. Explain that delivery is not reliable when the browser is fully closed. Push/PWA delivery remains P2.

## 5. Components and states

### 5.1 Component inventory

| Component | Required content/behavior |
|---|---|
| App shell | Page title, consistent content region, responsive navigation, safe-area padding |
| Bottom navigation / side rail | Icon plus visible label, current destination, keyboard and touch support |
| Page header | Heading, optional back action, one primary page action |
| Button | Primary, secondary, quiet, and destructive emphasis; labels remain visible |
| Icon button | Accessible name, tooltip where hover/focus exists, minimum 44 by 44 CSS px |
| Text/number field | Persistent label, help, input, error, saved/current distinction |
| Task card/row | Title, status, count/progress, Focus/Edit/Complete/Delete actions |
| Task selector | No task option, owned tasks, selected state, empty/loading/error states |
| Seed option card | Plant name, image, selected indicator, keyboard/touch selection |
| Timer display | Accessible name, remaining time, status, tabular numerals; not a per-second live announcement |
| Plant stage | Stable image frame, plant name, textual stage, image-failure fallback |
| Progress indicator | Numeric/text equivalent and stage marker; never color alone |
| Status badge | Icon/shape plus Active, Paused, Saving, Offline, Complete, or Ended text |
| Alert/banner | Severity title, concise next action, dismiss behavior where safe |
| In-app completion alert | One per focus/break event, event-specific text, deduplicated |
| Toast/status message | Short confirmation announced politely; never the only location of critical errors |
| Dialog | Title, consequence, safe initial focus, explicit cancel/confirm actions, focus return |
| Empty state | Explanation and direct primary action, restrained illustration |
| Skeleton/progress state | Preserves layout, has a nonvisual loading status, cannot look actionable |
| Settings section | Group heading, field/status rows, save action, locked explanation |
| Chart + data table (P1) | Same data in visual and text/table forms |

### 5.2 Shared component states

Every interactive component specifies: default, hover where available, focus-visible, pressed, selected, disabled/locked, loading, success where meaningful, validation error, and unavailable/offline where meaningful.

- **Disabled vs locked:** Disabled means the action cannot currently run. Locked settings also include text explaining why and when they become available.
- **Loading:** Keep the action label recognizable, add progress, and prevent duplicate input. Never communicate loading with animation alone.
- **Selected:** Use border/shape, check/icon, and text or an accessible selected state, not color alone.
- **Error:** Pair a visible message with an icon or heading and connect field errors to their fields.
- **Offline:** Use a persistent banner for app-wide connection loss and local messages for blocked save actions.

### 5.3 Feedback patterns

- Use inline messages for validation and save failures near the affected control.
- Use a page/banner message for offline, session expiry, recovery, or data-load failure.
- Use polite status announcements for task saved, task completed/reopened, settings saved, paused/resumed, and task deleted.
- Use an interruptive announcement only for timer/break completion or an action that cannot continue.
- Do not stack duplicate alerts. Update an existing status when retrying.
- A completion alert, sound, and browser notification are feedback channels, not proof that outcome persistence succeeded.

### 5.4 Confirmation and Undo rules

- **Give up:** always confirm. Initial focus is **Keep focusing**. Escape/close means cancel.
- **Delete task:** use confirmation for the MVP baseline. Do not combine confirmation with a timed Undo for the same deletion.
- **Mark task complete/incomplete:** no confirmation because the opposite labeled action reverses it.
- **Discard unsaved editor changes:** confirm only when values changed.
- **Log out during a session:** confirmation required, but final consequence/copy waits for OQ-5.
- **Future account deletion:** require explicit consequence copy and appropriate identity re-verification after OQ-10; do not rely on a toast Undo.
- If OQ-17 replaces task-delete confirmation with Undo, make Undo keyboard reachable, announce the remaining opportunity without a spoken countdown, preserve it across in-app navigation as approved, and define behavior on page close before implementation.

### 5.5 Form validation

- Validate after the user leaves a field and on submit. Do not show an error on an untouched initial field.
- Keep labels visible. Placeholder text may show an example but cannot replace a label.
- On failed submit, focus the first invalid field and provide a linked error summary for forms with multiple errors.
- **Task title:** trim for blank checking; reject blank/whitespace; treat markup as displayable text, not executable content; enforce the OQ-20 maximum once approved.
- **Estimate:** optional; when present, positive whole number; enforce the OQ-20 maximum once approved.
- **Focus duration:** whole number, 15–90.
- **Short break:** whole number, 5–15.
- **Long break:** whole number, 10–30.
- **Long-break interval:** whole number, 2–6.
- **Email:** explain format errors without confirming account existence.
- **Password:** show the exact rules of the selected authentication system; allow password managers and paste; avoid arbitrary composition rules unless required by that system.
- Never clear unrelated valid fields after an error. Never expose raw server/provider errors directly.

## 6. Responsive behavior

Breakpoints are content guidance, not device detection. Test continuously between them.

| Range | Layout guidance |
|---|---|
| Compact: 320–599 CSS px | One content column; bottom navigation; full-width primary actions; stacked timer controls; task editor as page/sheet |
| Medium: 600–1023 CSS px | One or two columns where reading order remains clear; bottom navigation or rail; timer art and details may sit side by side |
| Wide: 1024 CSS px and above | Side navigation; centered content up to roughly 1200 CSS px; task list and editor/details may use two columns |

- At 320 CSS px, cards, forms, navigation, and dialogs fit without horizontal page scrolling. Long task titles wrap and do not widen the page.
- Test the exact AC-21 viewports: 320×568, 375×667, 390×844 portrait, and 844×390 landscape.
- At short landscape heights, place plant art and timer details side by side when space permits, reduce decorative art before text, and keep Pause/Resume/Give up visible.
- Keep all P0 interactive targets at least **44 by 44 CSS px**, including icon controls, navigation, close actions, checkboxes, and seed choices. Spacing between adjacent targets must prevent accidental activation.
- Use a viewport-aware sticky action area only when it does not cover content. The focused field, its error, and Save must remain reachable when the virtual keyboard opens.
- Set form flow to support mobile Next/Done actions. Numeric fields should request a numeric-friendly keyboard while still accepting accessible keyboard entry.
- Safe-area padding applies to the header, bottom navigation, dialogs/sheets, and sticky actions. Use the larger of the normal spacing token or device inset.
- Avoid fixed-height containers based on an assumed full screen. Browser chrome and virtual keyboards change available height.
- At 200% browser zoom, reflow to one column. Core actions must not clip or require two-dimensional scrolling.
- Pointer and keyboard users receive the same actions. Hover may add emphasis but never reveal the only Edit/Delete/control path.

## 7. Visual direction and design tokens

### 7.1 Direction

Rootine should feel like a quiet study desk with a small garden: warm cream canvas, white cards, deep green controls, restrained plant accents, and clear charcoal text. Decorative leaves may soften empty space, but the timer and task content remain visually dominant.

### 7.2 Color tokens and safe usage

| Token | Value | Intended usage |
|---|---:|---|
| Primary / Forest green | `#2F5D50` | Primary buttons, links, focus ring on light surfaces, meaningful icons |
| Plant accent / Leaf green | `#6FA66F` | Plant artwork and decorative accents; meaningful marks need sufficient outline/text contrast |
| Canvas / Warm cream | `#F7F3E8` | App background |
| Surface / White | `#FFFFFF` | Cards, forms, dialogs |
| Text / Deep charcoal green | `#1F2D27` | Primary and secondary body text, text on amber/leaf fills |
| Secondary accent / Earth brown | `#8B6F47` | Limited secondary accents and icons |
| Active/warning / Warm amber | `#D99A2B` | Active/warning fill paired with charcoal text; not text on white/cream |
| Withered/give-up / Muted terracotta | `#B65F50` | Withered art, error/give-up border/icon; pair with separate charcoal text |

Safe solid-color examples:

- White text on forest buttons: **7.49:1**, suitable for normal text.
- Forest text/icons on cream: **6.76:1**, suitable for normal text and UI indicators.
- Charcoal text on cream: **12.95:1**; charcoal on white: **14.35:1**.
- Charcoal text on leaf: **5.03:1**, suitable for normal text, though leaf should remain an accent rather than a large reading surface.
- White text on earth brown: **4.71:1**, just above normal-text AA; test actual font weight and interaction states.
- Charcoal text on amber: **5.88:1**, suitable for warning/active labels.
- Terracotta against white (**4.43:1**) or cream (**3.99:1**) is suitable for non-text indicators, but terracotta normal text on either light surface fails 4.5:1. Use charcoal error text plus a terracotta icon/border.

Combinations that must not carry meaning without a tested alternative:

- Leaf on white: **2.85:1**; leaf on cream: **2.57:1**. Both fail 3:1 for meaningful non-text UI indicators.
- White on amber: **2.44:1**; amber on cream: **2.20:1**. Use charcoal on amber instead.
- White on terracotta: **4.43:1**. It narrowly fails 4.5:1 for normal text.
- Brown on cream: **4.24:1**. It fails normal-text AA, though it passes 3:1 for large text/non-text indicators.
- Forest and leaf: **2.63:1**. Do not use this pair alone for selected or progress states.
- Forest and amber: **3.07:1**. This passes the 3:1 non-text/large-text threshold but not normal text; charcoal-on-amber remains preferred.

Ratios were calculated from the approved hex values using the WCAG relative-luminance formula and rounded to two decimals. Target WCAG 2.2 AA: **4.5:1 for normal text** and **3:1 for large text and meaningful non-text UI indicators**. Every final component must still be tested in default, hover, focus, active, selected, disabled, error, and overlay states. Opacity, antialiasing, gradients, images, and adjacent colors can change effective contrast. Never use color alone to convey state.

Recommended state treatment:

- **Active:** amber surface + charcoal label + active icon/text.
- **Paused:** white/cream surface + forest outline + pause icon and “Paused.”
- **Complete:** forest icon/text + explicit “Complete.”
- **Given up/error:** terracotta icon/border + charcoal heading/message.
- **Selected:** forest border plus checkmark and selected text.
- **Keyboard focus:** forest ring on light surfaces; on forest controls, use an amber outer ring (forest/amber is 3.07:1) plus spacing so the boundary remains visible.

### 7.3 Typography

- Prefer a licensed, highly legible sans-serif or the platform system sans-serif stack. Do not delay P0 for a custom font.
- Body default: 1rem (normally 16 CSS px), line height 1.5.
- Supporting text: 0.875rem minimum with line height about 1.45; do not place essential instructions below this size.
- Page heading: approximately 1.75–2rem; section heading: 1.25–1.5rem.
- Timer: responsive 3–5rem with tabular numerals and enough width for `60:00` without shifting.
- Use sentence case. Reserve bold for headings, values, and the most important action/status.
- Text must tolerate 200% zoom and longer localized copy without clipping.

### 7.4 Spacing, radius, and elevation

- Base spacing unit: 4 CSS px. Use a restrained scale: 4, 8, 12, 16, 24, 32, and 48.
- Compact screen gutter: 16; medium: 24; wide: 32 CSS px.
- Minimum control height: 44 CSS px. Primary phone actions may use 48–52 CSS px for comfort.
- Radius: 8 CSS px for inputs/buttons, 12 for cards, 16 for dialogs/sheets. Use full pills only for short status badges.
- Elevation: flat cards with a border by default; one subtle shadow level for raised navigation/sheets and one for dialogs. Do not use shadows as the only boundary.

### 7.5 Icons and illustrations

- Use a consistent outlined or softly filled icon family with verified licensing.
- Pair unfamiliar or critical icons with text. Delete, Give up, notification permission, sound, and timer controls always have visible labels or immediately adjacent labels.
- Decorative illustrations use empty alternative text; informative plant art receives a concise name/stage alternative unless the same text is adjacent, in which case avoid duplicate announcements.
- Do not use a skull, alarm, or aggressive failure imagery for given-up sessions.

### 7.6 Plant-growth visuals

- Every selectable plant has Seed, Sprout, Small plant, Full plant, and Withered assets in one visual style.
- Keep artwork in a fixed-aspect frame so stage changes do not shift controls.
- Pair each image with stage text and elapsed progress. Follow A-6 thresholds of 0%, 25%, 60%, and 100% until OQ-7 is approved.
- The full plant appears only after persisted completion. A normal tab switch never changes the plant to withered.
- The withered illustration should be recognizable but gentle. Avoid dramatic decay animation or language that blames the user.
- If an asset is missing or fails, show the plant name and stage text; the timer remains fully usable.

### 7.7 Motion and reduced motion

- Use motion only to explain a state change: short fades or scale changes around 150–250 ms, not continuous swaying or pulsing.
- Plant stages change at milestones rather than through distracting constant animation.
- Do not animate the countdown digits spatially every second.
- With reduced motion, replace transitions with immediate static stage swaps and nonmoving status changes. Preserve all timing, text, and completion feedback.
- Avoid flashing. No content may flash more than three times per second.

## 8. Accessibility requirements

- All P0 actions work with keyboard alone in a logical order. Focus moves intentionally after navigation, dialog open/close, save, deletion, and result transitions.
- Focus indicators remain visible at all times for keyboard interaction and meet 3:1 against adjacent colors.
- Use semantic page landmarks, headings, lists, forms, buttons, dialogs, status messages, and a timer/status region appropriate to the selected platform.
- Every input has a persistent label, instructions, and programmatically associated error. Required state is available in text and semantics.
- The countdown is **not** a per-second live region. Screen readers should announce timer start, pause with remaining time, resume, growth-stage changes, one optional near-end milestone if user testing supports it, completion, and break transitions. Completion may use an interruptive announcement; routine saves use a polite announcement.
- Timer information remains discoverable on demand through its accessible name/value even when it is not continuously announced.
- Plant stage, selected task, Active/Paused, Complete/Given up, offline, and permission states use text and semantics, not color/art/sound alone.
- Dialog focus begins on the safer action for Give up/Delete, remains trapped within the dialog, closes with Escape as Cancel, and returns to the invoking control.
- Support browser text/page zoom to 200% with reflow and no clipped core controls. Do not prevent pinch zoom.
- All P0 touch targets are at least 44 by 44 CSS px.
- Honor reduced-motion preferences and provide a visible in-app preference. Sound and browser notifications remain optional.
- Use plain language, direct labels, and specific recovery actions. Avoid idioms, shame, and ambiguous icons.
- Charts added in P1 include text totals and data tables with clear headers.

## 9. Security and privacy UX

### 9.1 Authentication and account safety

- Registration and login messages do not confirm account existence. Raw provider/database errors never reach the interface.
- Password guidance reflects the chosen authentication system, supports password managers and paste, and avoids displaying or logging entered passwords.
- Do not claim a password is “secure” solely because it meets minimum rules.
- On expiry or invalidation, stop protected actions, clear unusable authentication state, and show: “Your session ended. Log in again to continue.” Clearly identify any unsaved action.
- Logout confirmation during an active session must explain the final consequence after OQ-5 is resolved.
- Authorization failures use “You can’t access this item” or a generic unavailable message without revealing another user’s record or identifier.

### 9.2 Destructive actions and data rights

- Give up and task deletion use the confirmation rules in Section 5.4.
- Historical-session preservation is stated in task-delete copy.
- Future account deletion/export belongs under Settings > Privacy and data, not hidden in a profile menu. OQ-10 must define identity checks, retention, export format, deletion timing, and active-session behavior before these controls ship.
- Do not use false assurances such as “completely private” or “unhackable.” Link claims to implemented, testable controls and an accurate privacy notice.

### 9.3 Sensitive content and errors

- Treat email addresses, task titles, copied task labels, and tokens as sensitive.
- Browser/lock-screen notifications use generic copy without task details by default.
- User-facing errors state what failed and the next action. They do not expose stack traces, internal IDs, database details, credentials, tokens, or sensitive task text.
- When offline or persistence fails, do not show a plant, task increment, settings change, or deletion as saved before confirmation.
- If analytics is later approved, exclude task titles and other free text by default and disclose collection. MVP relies on observed usability testing under OQ-12.

## 10. Notification UX contract

- The in-app completion alert is P0 and requires no browser permission.
- Completion sound is optional and independently controlled.
- Browser notifications are optional, off initially, and requested only after the user-triggered **Enable Notifications** action.
- Denied, revoked, or unsupported notification permission never blocks a session, break, result, plant, or task update. The interface retains in-app alerts and explains the fallback.
- Rootine sends no more than one browser notification for one completed focus session or break and uses a generic preview by default.
- Rootine does not promise notification delivery when the browser is fully closed.
- Closed-browser push through a PWA, service worker, or backend is P2 and requires separate architecture, privacy, permission, reliability, and testing decisions.
- UX copy must refer to “browser notifications,” not native/mobile-app notifications, and must not claim native background behavior.

## 11. Traceability to PRD

### 11.1 Functional requirements

| PRD ID | Screen/state mapping | UX treatment |
|---|---|---|
| FR-1 | Register; invalid/loading/offline | Validated account form and safe duplicate/invalid failure |
| FR-2 | Log in, Log out, protected screens, expiry | Explicit authentication actions; protected navigation and safe session-end route |
| FR-3 | Removed (no password reset) | None |
| FR-4, FR-5 | Deferred P2 | No MVP profile/avatar or guest-session UI |
| FR-6 | Focus setup | Saved or one-time whole-minute focus duration, 15–90 |
| FR-7 | Active timer | Remaining time, plant, optional task, Pause and Give up |
| FR-8 | Active/background/restoring | Timestamp-derived display and return-from-background refresh |
| FR-9 | Active/paused timer | Idempotent Pause/Resume states without reset or extension |
| FR-10 | Give-up dialog/result | Safe initial focus, unchanged Cancel, one persisted given-up outcome |
| FR-11 | Settings, completion, break offer | Defaults and short/long break selection |
| FR-12 | Settings locked/validation | Approved ranges; future-session-only save behavior |
| FR-13 | Completion and break result | One in-app alert; independent sound; failures do not block outcome |
| FR-14 | Active timer and plant assets | Four named visible stages at provisional thresholds |
| FR-15 | Stage change and reduced motion | Visual plus text change; static equivalent |
| FR-16 | Completion result/Garden/saving | Full plant shown as saved only after one record persists |
| FR-17 | Give-up result/Garden History | Withered, no completion rewards, provisional A-4 location |
| FR-18 | Deferred P2 | No strict-focus/tab-failure UI in MVP |
| FR-19 | Garden/empty/error/access denied | Owner-only completed plants with required details |
| FR-20, FR-21 | Deferred P1 | No MVP coins/shop UI |
| FR-22, FR-23 | Deferred P2 | No rare-plant/achievement UI |
| FR-24 | Tasks/editor/delete states | P0 create, edit, complete/reopen, delete, and validation |
| FR-25 | Focus setup/task card | Optional owned-task selection and explicit No task |
| FR-26 | Task card/completion result | Count/estimate progress; only completed linked focus increments |
| FR-27, FR-28, FR-29 | Stats (P1) | Totals/streaks/charts with accessible text/table alternatives |
| FR-30, FR-31, FR-32, FR-33, FR-34 | Deferred P2 | No ambient, dark theme, social, room, or admin UI in MVP |
| FR-35 | Settings permission states | User-triggered request; denied/revoked/unsupported fallback |
| FR-36 | Settings/completion notifications | Independent sound and browser controls; generic copy; closed-browser caveat |
| FR-37 | Tasks/Stats (P1) | Categories and category totals added only after P0 |

### 11.2 Business and non-functional requirements

| PRD ID | Screen/state mapping | UX treatment |
|---|---|---|
| BR-1, BR-6 | Focus starting/restoring/result | One active session; duplicate actions/tabs resolve to one state/outcome |
| BR-2, BR-3, BR-4 | Completion, give-up, break | Explicit outcome-specific credit and result copy |
| BR-5 | Break offer | Correct long-break label; skipped-break reset awaits OQ-6 |
| BR-7 | Seed selection | MVP available plants only; no locked choices before rewards ship |
| BR-8, BR-10 | Stats P1 | Completed duration only; local-period copy awaits OQ-9 |
| BR-9 | All protected screens/access denied | Owner-only records and non-disclosing denied states |
| BR-11 | Task delete/Garden history | Delete copy promises historical sessions remain under A-8 |
| BR-12 | Setup/Settings locked | Snapshot duration; saved changes apply to future sessions only |
| BR-13 | Task complete/reopen | Completion is reversible and retains history |
| BR-14 | Completion/break alerts | At most one in-app alert, sound, and browser notification |
| NFR-1 | All core loading states | Lightweight initial hierarchy; loading placeholders do not block status visibility |
| NFR-2 | Active timer | Trustworthy timestamp-based visual timer; test result belongs in QA handoff |
| NFR-3, NFR-21 | All P0 responsive states | 320 CSS px+, no horizontal scroll, 44×44 targets, keyboard/safe-area support |
| NFR-4 | All P0 and notification states | Equivalent browser flows; unsupported notification API uses fallback |
| NFR-5, NFR-6 | All P0 components | WCAG 2.2 AA plan, keyboard, text alternatives, reduced motion, optional sensory feedback |
| NFR-7, NFR-11 | Restore/saving/retry/multiple tabs | No false success or duplicate outcome/credit UI |
| NFR-8 | Register/password help | Exact approved password rules and no plaintext exposure |
| NFR-9 | Register, Settings > Privacy | Explain needed data; no undisclosed tracking/task-title analytics |
| NFR-10 | Every error state | Safe message, next action, no sensitive/internal detail |
| NFR-12 | Expiry/logout/authenticated shell | Clear expired state and reauthentication path |
| NFR-13 | Protected lists/detail/access denied | Owner-only interface; generic denied/unavailable copy |
| NFR-14 | Task/auth/settings validation | Type/range/format validation and user text treated as text |
| NFR-15, NFR-16 | State-changing/error/auth flows | Generic rejected-action UX and HTTPS expectations reflected in handoff; exact controls are architectural |
| NFR-17 | Login throttled/invalid states | Non-enumerating throttle copy |
| NFR-19 | Release handoff | No UI security badge; security/dependency evidence required outside UI |
| NFR-20 | Notification/result states | Generic previews and deduplicated completion feedback |

### 11.3 Acceptance criteria

| PRD ID | Screen and UX states that demonstrate it |
|---|---|
| AC-1 | Register, invalid registration, authenticated Focus, logout, login |
| AC-2 | Focus setup, Starting, active initial timer with selected seed/task |
| AC-3 | Active/background timer display and QA timing annotation |
| AC-4 | Restoring active/paused session and recovered stage/task/time |
| AC-5 | Four text/visual growth stages and reduced-motion state |
| AC-6 | Saving completion, completion result, Garden entry, updated selected task; retry/tab dedupe |
| AC-7 | Give-up confirmation Cancel/Confirm, withered result, no-credit copy |
| AC-8 | Default Settings, fourth-session long-break offer, break active/result |
| AC-9 | Garden completed/empty/access-denied states |
| AC-10 | Keyboard/focus/labels/text-only/reduced sensory states across all P0 screens |
| AC-11 | Auth, Focus, Tasks, Garden, Settings responsive layouts from 320 CSS px |
| AC-12 | Protected-route session end and generic cross-user access-denied states; authorization verification is also backend QA |
| AC-13 | Browser test matrix; notification supported and unsupported/denied fallbacks |
| AC-14 | Usability script covers account, task, focus, task count, plant meaning, and Garden |
| AC-15 | Task create/edit/complete/reopen/delete confirmation and invalid editor states |
| AC-16 | No task/owned task setup, task increment, give-up/break no increment, deleted-task historical copy |
| AC-17 | Settings ranges, saved/error/locked states, logout/login persistence test |
| AC-18 | Paused/Resume pending, refresh, repeated action, and second-tab states |
| AC-19 | Focus and break in-app alerts plus independent sound on/off/failure states |
| AC-20 | Enable Notifications action; granted, denied, revoked, unsupported, generic preview, closed-browser copy |
| AC-21 | 320×568, 375×667, 390×844, and 844×390 navigation/timer/task/form/alert states |
| AC-22 | 44×44 target audit, 200% zoom, keyboard-open, safe-area, portrait/landscape states |
| AC-23 | Password help and no plaintext exposure |
| AC-24 | Logout/expired-session UI; cookie/token verification remains architecture QA |
| AC-25 | Boundary validation and safely rendered task-title test strings; CSRF rejection uses generic failed-action UX |
| AC-26 | Login throttling and safe errors; HTTPS/mixed-content verification remains deployment QA |
| AC-27 | Settings/privacy copy and release checklist; secret/data inventory/scan evidence remains project QA |

## 12. Empty, loading, error, offline, and permission state matrix

| Context | Empty/loading | Error/offline/denied | Recovery |
|---|---|---|---|
| Authentication | Submit progress in place | Generic invalid, throttled, or offline copy | Retry |
| Focus startup | Starting; no duplicate action | Existing session, invalid seed/duration, start failure | Restore existing session or retain setup and retry |
| Active session | Restoring before controls | Offline banner, plant asset failure, save failure | Continue timestamp display; textual plant fallback; retry persistence |
| Tasks | Empty guidance or skeletons | Load/save/offline/access-denied message | New task/start without task, retry, or log in |
| Task editor | Create/edit form | Field errors, save failure, expired session | Preserve valid input; correct/retry/re-authenticate |
| Garden | First-plant and no-History copy | Load/offline/access-denied error | Start focus or retry |
| Completion/give up | Saving outcome | Persistence conflict/failure | Reconcile or retry; never show both outcomes |
| Break | Break offer/active/result | Alert/audio/notification failure | In-app state continues; optional channel failure does not block |
| Settings | Loading current values | Invalid save, offline, locked during session | Correct values, retry, or wait until session ends |
| Notifications | Not yet requested | Denied, revoked, unsupported | Keep in-app fallback; browser settings guidance; no repeated prompt |
| Stats P1 | No completed sessions | Load/partial-range failure | Start focus or retry; do not replace unknown data with zero |

## 13. Handoff checklist

- [ ] Confirm all P0 frames: public/auth, Today/Focus, Tasks/list/editor/delete, setup, active/paused/restoring, completion/give-up/saving, break, Garden, and Settings.
- [ ] Include every state in Section 12 in annotated wireframes.
- [ ] Resolve OQ-5, OQ-6, OQ-10, OQ-13, OQ-17, OQ-18, and OQ-20 before affected copy/interactions are marked final.
- [ ] Approve 2 to 3 plants with all stage/withered assets and documented licenses.
- [ ] Test every final text/UI color and interaction state to WCAG 2.2 AA; do not rely only on the base-palette ratios.
- [ ] Annotate heading order, labels, focus order/return, live announcements, dialog behavior, and text alternatives.
- [ ] Test keyboard-only, screen reader, reduced motion, optional sound off, notifications denied/unsupported, and 200% zoom.
- [ ] Test AC-21 viewports, 44×44 CSS px targets, landscape, virtual keyboard, safe areas, long task titles, and no horizontal scrolling.
- [ ] Validate safe authentication/session-expiry and notification copy with the chosen architecture and threat model.
- [ ] Verify one visible state for retries/multiple tabs and no duplicate completion alert, plant, or task credit.
- [ ] Keep Stats/categories/rewards/shop/social/admin/PWA push out of the MVP design sign-off unless scope is explicitly changed.
- [ ] Carry the PRD IDs in Section 11 into design annotations, implementation tickets, and QA cases.

## 14. Open UX decisions

| PRD ID | Decision needed for design handoff | Current plan/default |
|---|---|---|
| OQ-5 | Closure, post-target return, active-session logout, and abandonment behavior | Refresh/background recover; do not invent post-close or logout outcome |
| OQ-6 | Counter behavior when a long break is skipped; whether any early break-end action is needed | Break starts on Start break; provisional reset when long break is offered; no unspecified break controls |
| OQ-7 | Approve 0/25/60/100 growth thresholds | Use A-6 in prototypes |
| OQ-9 | Time-zone and week-start explanation for Stats | Defer final Stats labels; provisional local time/Monday |
| OQ-10 | Account deletion, export, and retention | Reserve Settings > Privacy and data; ship no promise/control yet |
| OQ-13 | Withered result location and emotional treatment | Separate Garden History filter under A-4 |
| OQ-14 | Plant species, visual style, and asset sources | 2 to 3 complete, consistently licensed MVP plants |
| OQ-16 | Authentication/persistence approach and session lifetimes | Keep UX generic; align final password/session copy after architecture choice |
| OQ-17 | Confirmation or Undo for task deletion | Use confirmation baseline; if Undo is chosen, define duration and lifecycle first |
| OQ-18 | New-account sound default and approved notification copy | Sound default unresolved; proposed generic copy excludes task details |
| OQ-20 | Maximum task-title length and estimate | Do not invent limits; finalize counters/help after approval |

## 15. PRD reconciliation notes

- Both documents target WCAG **2.2 AA** for P0 screens and final component states.
- P0 navigation contains Focus, Tasks, Garden, and Settings. Stats and Shop/Plant Catalog appear only when their P1 features are implemented; Profile options remain P2.
- Today / Focus is the P0 authenticated landing screen. P1 totals, streaks, and charts belong to Stats.
- BR-5 and OQ-6 keep skipped-long-break reset behavior provisional: reset when the long break is offered until the product decision replaces that rule.
- Browser-notification controls follow permission state: show **Enable Notifications** before asking, an app preference after permission is granted, and status/browser-settings guidance when blocked, revoked, or unsupported.
- MVP Settings includes account/session actions without implying the P2 display-name or avatar editor in FR-4.
