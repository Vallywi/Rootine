# Software Requirements Specification (SRS)

**Project:** Rootine
**Course:** CS0053 Programming Tools and Techniques
**Version:** 1.0
**Status:** Draft for instructor approval

The longer product description is in [`product/PRD.md`](product/PRD.md). This SRS is the course-format summary.

## 1. Abstract

Rootine is a Pomodoro focus web app. While the user focuses, a plant grows. Finishing the session lets the user collect the plant into a garden. Giving up makes it wither. The app also tracks tasks, streaks, badges, friends, a coin shop, and has an AI assistant ("Rootie") that answers questions about the user's own progress using the Google Gemini API.

## 2. Problem statement

Students lose focus while studying and have no simple feedback that rewards uninterrupted work. Plain timers show numbers only. Rootine ties a visible reward (a growing plant) to finishing a focus session, so staying on task feels worthwhile.

## 3. Objectives

1. Let a user run focus and break sessions with common Pomodoro rhythms.
2. Reward completed sessions with collectable plants and coins.
3. Track tasks, daily goals, streaks, and badges.
4. Answer progress questions through an external AI API.
5. Keep user data private and secrets out of the repository.

## 4. Scope

**Intended users:** students and other people who study or work in focused blocks, on phones or computers.

| Included | Excluded |
|---|---|
| Account registration, login, logout, profile | Native iOS/Android apps (the web app installs as a PWA) |
| Focus/break timer with presets and a custom rhythm | Team or classroom management |
| Task list with kind, urgency, status, due date, notes | Payment or real-money purchases |
| Garden, yard, coin shop, badges | Offline data sync |
| Friends and leaderboard | Languages other than English |
| Web Push notifications (optional) | |
| AI assistant "Rootie" (Google Gemini API) | |

**External services:** Google Gemini API (required for the chat feature), Supabase PostgreSQL (production database), Vercel (hosting), Web Push service (optional).

**Limitations:** the Gemini free tier has rate limits and can answer 429 or 503 during high demand. Browser notifications and install need HTTPS.

## 5. Functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-01 | Register and log in | A user can create an account with email, password (8 to 128 characters), and display name. Bad input shows a message for the field. Five failed logins lock the account for 15 minutes. |
| FR-02 | Manage tasks | The user can add, view, edit, and delete tasks (title up to 120 characters, up to 200 tasks). |
| FR-03 | Run a focus session | The user starts a focus session (15 to 90 minutes), can pause or give up, and a finished session produces a plant. |
| FR-04 | Run breaks | Short breaks follow focus sessions. A long break follows every fourth session. |
| FR-05 | Collect and name plants | A finished plant waits until collected. Collecting twice changes nothing. |
| FR-06 | Earn and spend coins | Coins come from collected plants. A purchase fails if there are not enough coins. |
| FR-07 | Statistics and badges | The app shows today, week, and month focus time, streaks, and badges with progress. |
| FR-08 | Friends and leaderboard | The user can send, accept, and decline friend requests and see a leaderboard. |
| FR-09 | **Retrieve API data** | The user types a question to Rootie. The server calls the Gemini API and the answer is shown in the chat drawer. |
| FR-10 | **Handle API errors** | If the API is busy, slow, unavailable, or returns nothing, the user sees a clear message and the app keeps working. |
| FR-11 | Settings | Timer lengths, daily goal, and theme persist across devices. Timer lengths are locked during a session. |

## 6. Non-functional requirements

| Category | Requirement |
|---|---|
| Usability | Consistent cute design, a first-visit tour, works on phone and desktop. |
| Performance | Normal API calls respond quickly on a local database. The AI request times out after 15 seconds. |
| Reliability | Errors return a JSON message and never crash the server. One 503 from Gemini is retried once. |
| Security | Passwords hashed, sessions in cookies, CSRF header on writes, `helmet` headers, rate limits, input validation with `zod`. `AI_API_KEY` and `DATABASE_URL` are never committed. |
| Maintainability | Backend split into routes, `db.js`, `ai.js`, `config.js`. Public behavior is covered by automated tests. |
| Portability | Node.js 20 or newer. Tested on Windows. Works in current Chrome, Edge, Firefox, and Safari. |
| Testability | `npm test` runs the backend tests with an in-memory database and a fake clock. No internet needed. |
| Privacy | The AI receives only the signed-in user's own data. Email, password data, and friends' progress are never sent. |

## 7. Software and hardware requirements

| Item | Requirement |
|---|---|
| OS | Windows 10/11, macOS, or Linux |
| Runtime | Node.js 20+, npm 10+ |
| Editor | Visual Studio Code |
| Hardware | Any computer that runs Node.js and a modern browser, about 1 GB free RAM |
| Network | Internet for the Gemini API and package install |

## 8. Constraints

- Only free tiers of Gemini, Supabase, and Vercel.
- The Gemini API key must stay on the server.

## 9. Chosen technologies

| Part | Choice |
|---|---|
| Frontend | React 19, Vite 7, PWA plugin |
| Backend | Express 5, `zod`, `helmet`, `pg` |
| Database | PostgreSQL (Supabase), PGlite for local use and tests |
| External API | Google Gemini `generateContent` |
| Design pattern | Strategy (interchangeable database drivers). See [`DESIGN_PATTERNS.md`](DESIGN_PATTERNS.md). |
