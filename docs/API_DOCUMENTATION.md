# API Documentation

Rootine uses one external API (Google Gemini) and exposes its own REST API to the browser.

## 1. External API: Google Gemini

| Item | Value |
|---|---|
| Provider | Google (Generative Language API, Gemini) |
| Why selected | Free tier, simple JSON over HTTPS, no SDK needed, good at short natural-language answers. |
| Documentation read | https://ai.google.dev/api/generate-content |
| Key | Free key from https://aistudio.google.com/apikey |
| Endpoint | `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |
| Default model | `gemini-flash-lite-latest` (set with `AI_MODEL`) |
| Authentication | Header `x-goog-api-key: <AI_API_KEY>` (never in the URL) |
| Code | `backend/src/ai.js`, called from `backend/src/routes/chat.js` |

### Sample request (key removed)

```http
POST /v1beta/models/gemini-flash-lite-latest:generateContent HTTP/1.1
Host: generativelanguage.googleapis.com
Content-Type: application/json
x-goog-api-key: <YOUR_KEY>

{
  "systemInstruction": { "parts": [{ "text": "You are Rootie ... DATA: {...}" }] },
  "contents": [{ "role": "user", "parts": [{ "text": "How is my progress?" }] }],
  "generationConfig": { "maxOutputTokens": 600, "temperature": 0.5 }
}
```

### Sample response (shortened)

```json
{
  "candidates": [
    { "content": { "role": "model", "parts": [{ "text": "You focused for 50 minutes today across 2 sessions." }] } }
  ]
}
```

The app reads `candidates[0].content.parts[*].text` and joins it.

### Error handling

| Situation | What Gemini returns | What the user sees |
|---|---|---|
| No key configured | (no request sent) | 503 "The assistant is not set up yet." |
| Rate limit | 429 | 503 "The assistant is busy right now. Please try again in a minute." |
| High demand | 503 | One retry after 0.8 s, then the same "busy" message |
| Bad key or other error | 4xx/5xx | 502 "The assistant is not available right now." (provider details are not shown) |
| Network error or no answer within 15 s | (exception) | 502 "The assistant did not answer in time." |
| Empty answer | 200 with no text | 502 "The assistant had no answer for that." |

### Input validation before the request

`POST /api/chat` accepts only: 1 to 10 messages, each with role `user` or `assistant`, text 1 to 500 characters, unknown fields refused, last message must be from the user, `tzOffset` integer within 840 minutes. 30 questions per hour per user.

### Security and terms

- The key is read from the `AI_API_KEY` environment variable and used only on the server.
- Only the signed-in user's own data goes into the prompt. Task titles are marked as untrusted text.
- Use stays within Google's free-tier limits and terms: https://ai.google.dev/gemini-api/terms. Answers are labelled as coming from the Rootie assistant.

## 2. Rootine REST API (internal)

Base path `/api`. All write requests need the `X-Rootine-CSRF` header and a session cookie. Full contract: [`backend/API-SPEC.md`](backend/API-SPEC.md).

| Group | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`, `PATCH /auth/profile`, `PUT/DELETE /auth/avatar`, `DELETE /auth/account` |
| Settings | `GET /settings`, `PUT /settings` |
| Tasks | `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` |
| Sessions | `GET /sessions/current`, `POST /sessions`, `POST /sessions/:id/{pause,resume,complete,give-up,collect}`, `POST /sessions/collect-all` |
| Garden | `GET /garden`, `PATCH /garden/plants/:id`, `PUT/DELETE /garden/plants/:id/position` |
| Shop | `GET /shop`, `GET /shop/balance`, `POST /shop/buy`, `POST /shop/equip`, `PUT/DELETE /shop/items/:itemId/position` |
| Friends | `GET /friends`, `GET /friends/leaderboard`, `POST /friends/requests`, `POST /friends/requests/:id/{accept,decline}`, `DELETE /friends/requests/:id`, `DELETE /friends/:userId` |
| Users | `GET /users/:id/avatar` |
| Push | `GET /push/key`, `POST /push/subscribe`, `POST /push/unsubscribe`, `GET /push/dispatch` |
| **Chat** | `POST /chat` (calls Gemini) |

### Sample: `POST /api/chat`

Request:

```json
{ "messages": [{ "role": "user", "content": "How is my progress?" }], "tzOffset": 480 }
```

Response `200`:

```json
{ "reply": "You focused for 50 minutes today across 2 sessions. Nice work!" }
```

Error `400`: `{ "error": "Use at most 500 characters." }`

## 3. Trying the API in VS Code

Open [`rootine.http`](rootine.http) with the REST Client extension and click **Send Request**.
