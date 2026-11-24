# AI chat assistant (Rootie)

A chat button at the bottom right opens "Rootie". It answers questions about your own progress, plants, streaks, tasks and badges, using Google Gemini.

## Turn it on

1. Create a free key at https://aistudio.google.com/apikey.
2. Local: put it in `backend/.env` and restart the backend.
   ```
   AI_API_KEY=your-key
   AI_MODEL=gemini-flash-lite-latest
   ```
3. Vercel: add `AI_API_KEY` (and optionally `AI_MODEL`) under Settings, Environment Variables, then redeploy.

Without a key the app works as before, and the chat replies "The assistant is not set up yet."

## How it works

- `POST /api/chat` with `{ messages: [{ role, content }], tzOffset }`. It needs login and the CSRF header.
- The server builds a snapshot of the signed-in user's data (focus minutes, last 7 days, streaks, plants, open tasks, badges) and sends it to Gemini with the conversation. The browser never sees the key and cannot add facts.
- Limits: 500 characters per message, last 10 messages, 30 questions per hour per person.
- Not shared with the AI: email, password data, other users, friends' progress.
- Task titles are user-written, so the prompt tells the model to treat them as data and never as instructions.

## Files

| File | Role |
|---|---|
| `backend/src/ai.js` | Gemini client. Replace this file to change provider. |
| `backend/src/routes/chat.js` | Route, snapshot builder, system prompt. |
| `frontend/src/components/ChatDrawer.jsx` | Chat panel. |
| `backend/tests/chat.test.js` | Tests with a fake AI. |
