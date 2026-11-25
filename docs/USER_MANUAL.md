# User Manual

Screenshots are in `screenshots/` and were captured from the running app (see [TEST_REPORT.md](TEST_REPORT.md) for how). The demo account "Mia" has sample history, so the numbers you see on your own account will differ.

## Install and launch

1. Install Node.js 20 or newer from https://nodejs.org.
2. Clone the repository and open the folder in VS Code.
3. In the terminal run `npm install`.
4. Copy `backend/.env.example` to `backend/.env`. Add `AI_API_KEY` if you want the chat assistant (see [`AI-CHAT-SETUP.md`](AI-CHAT-SETUP.md)).
5. Terminal 1: `npm run dev:backend`. Terminal 2: `npm run dev:frontend`.
6. Open http://localhost:5173.

For a quick try without waiting, set `DEMO_MODE=1` in `backend/.env` and restart the backend.

---

## Feature: Create an account and log in

- **Purpose:** keep your tasks and garden private.
- **Prerequisites:** the app is running.
- **Procedure:**
  1. Open the app and choose **Sign up**.
  2. Enter email, password (at least 8 characters), display name, full name, age, and gender.
  3. Submit.
- **Expected result:** you land in the app and a short tour starts.
- **Screenshot:**

  ![Register, step 1](../screenshots/02-register-step1.png)
  ![Register, a password that is too short is rejected](../screenshots/03-register-invalid-password.png)
  ![Log in](../screenshots/01-login-form.png)
- **Troubleshooting:** a red message under a field says what to fix. After 5 wrong passwords the account is locked for 15 minutes.

## Feature: Manage tasks

- **Purpose:** list what you want to study or work on.
- **Prerequisites:** logged in.
- **Procedure:**
  1. Open **Tasks**.
  2. Type a title and add it. Optionally set kind, urgency, due date, and notes.
  3. Edit or delete a task from its row.
- **Expected result:** the task appears in the list and survives a page refresh.
- **Screenshot:**

  ![Tasks](../screenshots/05-tasks.png)
- **Troubleshooting:** "limit of 200 tasks" means delete finished tasks. Titles over 120 characters are refused.

## Feature: Focus session and growing a plant

- **Purpose:** focus without distraction while a plant grows.
- **Prerequisites:** logged in. Optional: pick a task.
- **Procedure:**
  1. Open **Focus** and choose a rhythm (for example 25/5).
  2. Choose a plant. Trees need a longer session.
  3. Press start. The countdown 3-2-1-GO runs.
  4. Wait until the timer ends, then press **Collect plant**. Optionally name it.
- **Expected result:** the plant is added to your garden and you earn coins.
- **Screenshot:**

  ![Choose a rhythm](../screenshots/04-focus-rhythms.png)
  ![A running timer](../screenshots/08-timer-running.png)
  ![A finished session waiting to be collected](../screenshots/06-session-finished-collect.png)
  ![After collecting: plant added, +30 coins, long break starts](../screenshots/07-plant-collected.png)
- **Troubleshooting:** giving up makes the plant wither. Timer lengths cannot change during a session. Notifications need HTTPS.

## Feature: Garden, Yard, and Shop

- **Purpose:** see your plants, place them outside, and buy houses, fences, decorations, and pets with coins.
- **Prerequisites:** at least one collected plant.
- **Procedure:** open **Garden** to view plants. Open **Yard** to place them. Open **Shop** and buy an item.
- **Expected result:** the balance drops by the item price and the item shows in the Yard.
- **Screenshot:**

  ![Garden](../screenshots/09-garden.png)
  ![Yard](../screenshots/10-yard.png)
  ![Shop](../screenshots/11-shop.png)
- **Troubleshooting:** "not enough coins" means finish more sessions.

## Feature: Ask Rootie (external API)

- **Purpose:** get a short answer about your own progress, powered by Google Gemini.
- **Prerequisites:** logged in. The server has `AI_API_KEY` set.
- **Procedure:**
  1. Click the chat button at the bottom right.
  2. Type a question such as "How is my progress?" (up to 500 characters).
  3. Send.
- **Expected result:** a short reply that quotes your real numbers.
- **Screenshot:**

  ![Rootie answers with the user's own numbers](../screenshots/13-chat-gemini-reply.png)
  ![Error shown when the server has no API key](../screenshots/14-chat-error-no-key.png)
- **Troubleshooting:**

| Message | Meaning and fix |
|---|---|
| The assistant is not set up yet. | No `AI_API_KEY` on the server. Add it and restart. |
| The assistant is busy right now. | Gemini limit or high demand. Wait a minute. |
| The assistant did not answer in time. | Network problem or slow API. Try again. |
| You have asked a lot of questions. | The 30 per hour limit. Wait. |

## Feature: Friends and leaderboard

- **Purpose:** compare progress with friends.
- **Procedure:** open **Friends**, share your friend code, send or accept a request, and open the leaderboard.
- **Expected result:** accepted friends appear with their ranking.
- **Screenshot:**

  ![Friends](../screenshots/12-friends.png)
- **Troubleshooting:** friend requests need the other person's code.

## On a phone

![Garden on a phone](../screenshots/15-phone-garden.png)

## General troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Check Node.js is version 20 or newer (`node --version`). |
| Port 4000 or 5173 in use | Close the other program or change `PORT` in `backend/.env`. |
| Blank page | Make sure the backend is running on port 4000. |
| Want a fresh database | Stop the backend and delete the `backend/.data` folder. |
