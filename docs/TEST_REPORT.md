# Testing and Quality Report

Rule: a test is marked **Passed** only if it was executed. Tests not yet executed are marked **Not run** and must be filled in by the team before submission.

## 1. Automated tests (executed)

| Item | Value |
|---|---|
| Command | `npm test` from the project root |
| Runner | Node.js built-in test runner (`node --test`) |
| Environment | Windows, Node.js v24.14.1, in-memory PGlite database, fake clock, fake AI |
| Date run | Run on the day this report was prepared. Re-run and update before submission. |

| Run | Tests | Pass | Fail |
|---|---|---|---|
| Existing suite before this report | 118 | 118 | 0 |
| New file `backend/tests/ai-client.test.js` (run alone) | 10 | 10 | 0 |

| Full `npm test` run with the new file included | 128 | 128 | 0 |

Output of the full run (last lines, duration 40.9 s):

```
ℹ tests 128
ℹ suites 0
ℹ pass 128
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Re-run before submission and update this section if the code changes.

### New tests added for the API and pattern requirements

| Test | Verifies |
|---|---|
| ai client is off (null) when no API key is set | App works without a key |
| sends the documented request and returns the answer text | URL, POST method, key in header and not in URL, body format, response parsing |
| maps the assistant role to Gemini "model" | Request format |
| 429 gives a friendly "busy" error (503) | Rate-limit handling |
| one 503 is retried, then the answer is returned | Retry logic |
| 503 twice gives the "busy" error | Failure after retry |
| other HTTP errors give "not available" (502) without leaking details | Error message does not expose the key |
| network error or timeout gives a 502 message | Network failure handling |
| empty answer gives a meaningful message | Empty-result handling |
| strategy: `createDb` returns a driver with the shared interface | Design pattern behavior |

These tests replace `fetch`, so they do not call Google and use no key.

## 2. Course test cases

| ID | Scenario | Expected | Method | Actual result | Status |
|---|---|---|---|---|---|
| TC-01 | Launch the application | Backend and frontend start, landing page loads | Manual: `npm run dev:backend`, `npm run dev:frontend`, open http://localhost:5173 | _fill in_ | Not run |
| TC-02 | Enter valid input | Register and add a task `Finish report`; the task appears | Manual, plus automated `tasks: create, list, update, delete` and `auth` tests | Automated part passed | Partly run |
| TC-03 | Enter invalid input | Short password, empty task, and 501-character chat message are rejected with a message | Automated: `bad values are refused with a message for the field`, `chat: rejects bad input` | Passed | Passed (automated) |
| TC-04 | Request external API data | Ask Rootie "How is my progress?" and see an answer from Gemini | Manual, needs a real `AI_API_KEY` in `backend/.env` | _fill in, add screenshot_ | Not run |
| TC-05 | Simulate an API failure | Meaningful message for 429, 503, timeout, empty, network error | Automated: the `ai client:` tests. Manual: remove the key, ask Rootie, expect "The assistant is not set up yet." | Automated passed. Manual _fill in_ | Partly run |
| TC-06 | Design-pattern-dependent feature | `createDb` returns a working driver; all routes work on it | Automated: `strategy:` test and the full suite | Passed | Passed (automated) |
| TC-07 | Follow the installation manual on a clean setup | Fresh clone, `npm install`, run, app works | Manual on another computer or a new folder | _fill in_ | Not run |
| TC-08 | Review the GitHub repository | Source, docs, history, branches, Issues, PRs, tag | Manual checklist in [`GITHUB_WORKFLOW.md`](GITHUB_WORKFLOW.md) | _fill in_ | Not run |

## 3. Requirement traceability

| Requirement | Covered by |
|---|---|
| FR-01 | `auth.test.js` |
| FR-02 | `tasks-settings.test.js`, `task-details.test.js` |
| FR-03, FR-04, FR-05 | `sessions.test.js`, `plan.test.js` |
| FR-06 | `shop.test.js` |
| FR-07 | `garden.test.js`, `task-details.test.js` |
| FR-08 | `friends.test.js` |
| FR-09, FR-10 | `chat.test.js`, `ai-client.test.js`, TC-04 and TC-05 manual |
| FR-11 | `tasks-settings.test.js` |

## 4. Known gaps

- The `pg` driver (Supabase) is not covered by automated tests, only by manual use of the deployed app.
- The real Gemini API is not called by automated tests. TC-04 is the live check.
- There are no automated frontend tests. Frontend behavior is checked manually.
- Push notifications need HTTPS and a browser, so they are tested manually.

## 5. Defects found

None recorded yet. Add each defect here with its fix and the commit hash.

## 6. Quality assessment

_Write after the final run: summary of pass/fail counts, open defects, and readiness._
