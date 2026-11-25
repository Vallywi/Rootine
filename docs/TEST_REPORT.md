# Testing and Quality Report

Rule used in this report: a test is marked **Passed** only if it was executed, and the evidence is listed. Anything not executed is marked **Not run**.

## 1. Test environment

| Item | Value |
|---|---|
| Date | 2026-11-25 |
| OS | Windows 11 Home |
| Node.js | v24.14.1 |
| Browser used for manual tests | Microsoft Edge (headless, driven by a script that clicks and types like a user) |
| Database | PGlite (local PostgreSQL), driver `pglite` |
| AI | Real Google Gemini API, model `gemini-flash-lite-latest`, key from `backend/.env` |

How the manual evidence was produced: the real app (`createApp` plus the built frontend in `frontend/dist`) was started on a local port, a demo account "Mia" was created, and Edge was driven through the real screens. Past sessions for Mia (streaks, weekly totals) and the "finished session" in TC-02 were created through the real API with a shifted server clock, because a real 25-minute session would take too long. The login form, the registration form, collecting a plant, the chat, and all error messages were exercised through the real screens and code.

## 2. Automated tests (executed)

| Item | Value |
|---|---|
| Command | `npm test` from the project root |
| Runner | Node.js built-in test runner |
| Result | **129 tests, 129 passed, 0 failed** (47 s) |

```
ℹ tests 129
ℹ suites 0
ℹ pass 129
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Breakdown: 118 existing tests, 10 new tests in `backend/tests/ai-client.test.js` (Gemini client and Strategy), and 1 regression test in `backend/tests/db-fresh-folder.test.js` (defect D-1 below).

## 3. Course test cases

| ID | Scenario | Expected | Actual result | Evidence | Status |
|---|---|---|---|---|---|
| TC-01 | Launch the application | App starts and the landing page loads | Server started. `GET /api/health` returned `{"ok":true}`. Page title "Rootine". Landing page rendered. | `screenshots/00-landing.png` | **Passed** |
| TC-02 | Enter valid input | Valid input is processed | Logged in through the real login form with valid credentials and reached the app. Finishing a session and tapping **Collect plant** showed "Plant added to your garden! +30 coins. Time to rest." Task creation and update are covered by the automated tests; creating a task through the form was not clicked manually. | `01-login-form.png`, `06-session-finished-collect.png`, `07-plant-collected.png` | **Passed** (task form not clicked manually) |
| TC-03 | Enter invalid input | Input is rejected with a message | Registration with the 3-character password `abc` was rejected: the field turned red and showed "Use at least 8 characters." Chat input over 500 characters, empty lists, and wrong roles are rejected in the automated tests. | `03-register-invalid-password.png`, `chat: rejects bad input` | **Passed** |
| TC-04 | Request external API data | Data from the API is shown | Asked Rootie "How is my progress this week?" The server called the real Gemini API and the answer appeared in about 11 seconds: "Hi Mia! You are doing wonderfully this week. You have focused for a total of 175 minutes so far ... You are also on a lovely 3-day focus streak ... try breaking your open tasks, like your urgent CS0053 project documentation, into small 25-minute Pomodoro sessions ..." The numbers match the demo account data. | `13-chat-gemini-reply.png` | **Passed** |
| TC-05 | Simulate an API failure | A meaningful error is shown | With no `AI_API_KEY` the chat showed "The assistant is not set up yet." in a red message and the rest of the app kept working. The 429, 503 (with retry), network error or timeout, empty answer, and bad key cases are covered by 9 automated tests with a replaced `fetch`. A real 429/503 from Google was not triggered. | `14-chat-error-no-key.png`, `ai client:` tests | **Passed** (429/503 simulated) |
| TC-06 | Design-pattern-dependent feature | Strategy works | `createDb` returned the `pglite` driver with `query`, `tx`, `migrate`, `close`. All 129 tests and the manual run used it through `ctx.db`. | `strategy:` test, full run | **Passed** (`pg` driver not tested) |
| TC-07 | Follow the installation manual on a clean setup | Fresh clone installs and runs | First attempt **failed** (defect D-1). After the fix, on a fresh clone of the fix branch: `npm install` took 50 s (429 packages), `npm run dev:backend` answered `/api/health` with `{"ok":true}` after 12 s on first start, and `npm run build` finished. The frontend dev server was not started in this check. | Terminal output, summarized here | **Passed** after fix |
| TC-08 | Review the GitHub repository | Source, docs, history, branches, Issues, PRs, tag | Checked on GitHub and locally: 41 commits on `main`; 5 branches merged by pull requests #5 to #9; Issues #1 to #4 closed; README and `.gitignore` present; `.env` not tracked; release tag `v1.0.0` created. All commits use one Git identity, so each member's contribution is not yet visible. | `git log`, GitHub Issues, Pull requests, and Releases pages | **Passed** (member contributions not yet shown) |

## 4. Requirement traceability

| Requirement | Covered by |
|---|---|
| FR-01 | `auth.test.js`, TC-02, TC-03 |
| FR-02 | `tasks-settings.test.js`, `task-details.test.js` |
| FR-03, FR-04, FR-05 | `sessions.test.js`, `plan.test.js`, TC-02 |
| FR-06 | `shop.test.js` |
| FR-07 | `garden.test.js`, `task-details.test.js` |
| FR-08 | `friends.test.js` |
| FR-09 | `chat.test.js`, `ai-client.test.js`, TC-04 |
| FR-10 | `ai-client.test.js`, TC-05 |
| FR-11 | `tasks-settings.test.js` |

## 5. Defects found

| ID | Found by | Description | Fix | Status |
|---|---|---|---|---|
| D-1 | TC-07 (clean clone) | On a fresh clone, `npm run dev:backend` crashed with `ENOENT: mkdir backend/.data/pglite`, because the local database does not create missing parent folders. The README says to delete `backend/.data` to start fresh, so this also hit anyone who followed that step. | `backend/src/db.js` now creates the folder with `mkdirSync(..., { recursive: true })`. Regression test `db-fresh-folder.test.js` fails without the fix and passes with it. Branch `fix/fresh-clone-database`. | Fixed |

## 6. Known gaps

- The `pg` driver (Supabase) is not covered by automated tests. It is only used by the deployed app.
- No automated frontend tests. Frontend behavior was checked by driving Edge with a script.
- A real 429 or 503 from Google was not triggered. Those cases are simulated.
- Push notifications and the install prompt need HTTPS and were not tested here.
- Creating a task through the form was not clicked in the manual run.

## 7. Quality assessment

All 129 automated tests pass. All eight course test cases were executed and passed. TC-08 passed for the repository, Issues, pull requests, and tag, but the history still shows only one author. One defect was found by the clean-setup test and fixed with a regression test. The Gemini integration worked against the real API and every failure path shows a readable message.
