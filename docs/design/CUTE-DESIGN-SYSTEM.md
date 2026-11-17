# Rootine Cute Design System 🌱

| | |
|---|---|
| **Status** | DRAFT, for review and approval |
| **Purpose** | Define how Rootine looks, moves, and talks, so every screen feels like the same cozy little garden |
| **Works with** | `docs/design/UX-UI-PLAN.md` (screens, flows, accessibility rules). Where the two documents differ on **visual style**, this document wins. |
| **Used by** | `docs/frontend/FRONTEND-PLAN.md` |

---

## 1. Design idea

> **Rootine is a tiny, cozy garden that grows when you focus.**

Studying should feel gentle, not stressful. The app should feel like a soft sticker book: round shapes, warm colors, small happy faces, and plants that clearly care about you.

### Personality

| We are | We are not |
|---|---|
| Friendly and encouraging | Bossy or guilt-tripping |
| Calm and cozy | Loud, neon, or flashing |
| Playful in small doses | Childish or cluttered |
| Clear and readable | Cute at the cost of usability |

### The cute rule
Cute decoration may never hide information. Every screen must still be clear with the animations turned off and the colors seen in grayscale.

---

## 2. Mascot: Sprouty

A small round seedling with two leaves on its head, tiny dot eyes, and pink cheeks. Sprouty appears in places where the user needs warmth, not on every screen.

| Where | Pose | Example line |
|---|---|---|
| Login and register | Waving | "Welcome back! Your garden missed you." |
| Empty Tasks | Holding a tiny notepad | "No tasks yet. What shall we grow today?" |
| Empty Garden | Sitting next to a seed | "Your garden is waiting for its first plant." |
| Session success | Cheering with sparkles | "You did it! Look how it bloomed." |
| Session given up | Hugging a withered leaf | "It's okay. Every gardener loses a plant sometimes." |
| Break | Sipping tea | "Time to stretch and sip some water." |
| Error screen | Confused, head tilted | "Oops, something went wrong. Let's try again." |

**Asset needs:** one SVG mascot with 7 poses, drawn with the same flat shapes as the plants. **[TO CONFIRM]** who draws them. A free asset pack is fine if the license allows it.

---

## 3. Color palette

### 3.1 Core colors

| Role | Name | Hex | Use |
|---|---|---|---|
| Primary | Forest | `#2F5D50` | Buttons, headings, nav highlight |
| Primary dark | Deep forest | `#234A3F` | Button shadow edge |
| Plant | Leaf | `#6FA66F` | Plant art, decoration |
| Plant light | Soft leaf | `#8FC08A` | Plant art, progress bar end |
| Page background | Cream | `#F7F3E8` | Page |
| Card | Soft white | `#FFFFFF` | Cards, dialogs |
| Text | Ink | `#1F2D27` | Body text |
| Muted text | Moss gray | `#55655D` | Hints, labels |
| Soil | Earth | `#8B6F47` | Soil, small accents |
| Warning accent | Amber | `#D99A2B` | Focus ring, paused state |
| Error accent | Terracotta | `#B65F50` | Withered art, borders |
| Error text | Deep terracotta | `#9C4638` | Error text and danger buttons |

### 3.2 Cute pastels (backgrounds only)

| Name | Hex | Use |
|---|---|---|
| Mint | `#E3F1E2` | Selected chip, success tiles, progress track |
| Butter | `#FFF1C9` | Alerts, "today" stat tile |
| Blush | `#FDE7E9` | Errors, streak tile, give-up button background |
| Sky | `#E6EEFC` | "This month" stat tile |
| Lavender | `#EDE7F8` | Optional accent for badges later |
| Peach pot | `#F4A596` and `#EE8D7C` | Plant pots |

### 3.3 Contrast rules (approximate values, confirm with a contrast checker)

| Combination | Approx. ratio | Allowed use |
|---|---|---|
| White text on Forest | 7.5 to 1 | Buttons, all text sizes |
| Ink on Cream | 12.9 to 1 | Body text |
| Moss gray on White | 6.2 to 1 | Secondary text |
| Deep terracotta on White | 6.3 to 1 | Error text |
| Terracotta `#B65F50` on White | about 4.4 to 1 | **Not for small text.** Borders and art only. |
| Leaf green on White | about 2.9 to 1 | **Decoration only**, never text |
| Amber on White | about 2.4 to 1 | **Decoration and focus ring only**, never text |

Pastels are never used for text. They are backgrounds with dark text on top.

**State is never color only:** paused shows ⏸ and "Paused", errors show ⚠, success shows ✓.

### 3.4 Dark mode
Post-MVP (PRD FR-31). Plan for it by using color variables everywhere, so a dark set can be added later. Suggested feel: deep green night garden, with the same pastel plants.

---

## 4. Typography

| Item | Choice |
|---|---|
| Font | **Nunito** (rounded, friendly), self-hosted |
| Fallback | `ui-rounded`, `Segoe UI`, `system-ui`, `sans-serif` |
| Weights | 600 body emphasis, 800 buttons and labels, 900 headings and timer |
| Base size | 17 px on phones, 18 px on larger screens |

| Element | Size | Weight |
|---|---|---|
| Timer | 3.4 rem to 5.5 rem (scales with screen) | 900, tabular numbers |
| Page title (h1) | 1.8 rem | 900 |
| Section title (h2) | 1.25 rem | 800 |
| Body | 1 rem | 400 to 600 |
| Hint and small text | 0.85 rem | 600 |

Form inputs are at least 16 px so phones do not zoom in.

---

## 5. Shape, space, and depth

| Token | Value | Note |
|---|---|---|
| Card radius | 24 px | Soft and pillowy |
| Control radius | 16 px | Inputs, small cards |
| Buttons and chips | fully round (pill) | |
| Page padding | 16 px on phones | |
| Gap between cards | 16 px | |
| Card border | 2 px, warm sand `#EFE8D3` | Gives a sticker look |
| Shadow | soft green-tinted, `0 8px 24px` at 10% | Never harsh black |
| Primary button | has a "pressed" bottom edge in deep forest | Looks like a squishy button |
| Page background | cream with a faint dot pattern | Like a notebook |
| Minimum touch target | 44 by 44 px (this plan uses 48) | |

---

## 6. Plants (the star of the app)

### 6.1 Plant lineup

| Plant | Look | Bloom feature |
|---|---|---|
| **Sunflower** 🌻 | Green stem, two leaves | Yellow petals, brown center with a tiny smiling face |
| **Cactus** 🌵 | Round green body with two arms, light stripes | Pink five-petal flower on top |
| **Tulip** 🌷 | Slim stem, two long leaves | Pink cup flower with two dot eyes |
| **Sakura** 🌸 | Small brown trunk and branches | Fluffy pink canopy with a gentle smile and white petals |

All plants sit in the same **peach pot** with a face: two dot eyes with a highlight, rosy cheeks, and a small smile. The pot is the consistent mascot-like element across all plants.

### 6.2 Growth stages (PRD A-6)

| Stage | Progress | Look |
|---|---|---|
| 0. Seed | 0% | A small seed on the soil with two sparkles |
| 1. Sprout | 25% | Thin stem with two small leaves |
| 2. Small plant | 60% | The plant at about two-thirds size, with a closed bud instead of a bloom |
| 3. Full plant | Completed | Full size with the bloom, plus a small pop animation |
| Withered | Given up | Drooping brown-gray stem and leaves, pot face with X eyes and a flat mouth, one tiny water drop |

**Total art to produce:** 4 plants by 4 stages = 16 images, plus 1 withered version (shared shapes, small changes per plant), plus the pot. Build them as SVG components from shared shapes to save time.

### 6.3 Plant motion

| Motion | Details |
|---|---|
| Idle sway | Rotates about 1 degree left and right every 4 seconds |
| Stage change | "Pop": scale from 82% to 106% and back to 100% in 0.6 seconds |
| Completion | Confetti of small petals and sparkles floats up for about 3 seconds |
| Withered | No motion. It stays still, which feels quiet and gentle. |

---

## 7. Screen treatments

### 7.1 Auth screens
- Centered card on the dotted cream page.
- Small sunflower in a pot at the top of the card, then the Rootine logo and a short friendly title.
- Round, large inputs with 2 px sand borders. Focus ring in amber.

### 7.2 Focus screen
- A soft mint-to-white gradient at the top of the card, like morning light.
- Plant is large and centered. The timer sits under it in huge forest-green numbers.
- Plant picker shows four round chips with the plant names.
- Duration chips: 15, 25, 45, 60 and a custom box.
- **Start focusing** is a big squishy button with a sprout emoji.
- **Running:** a pill-shaped progress bar fills with a green gradient. Stage name sits below ("Sprout · 40% grown").
- **Paused:** timer color shifts to warm amber-brown, the label shows ⏸, and plant sway stops.
- **Break:** a soft yellow sun circle that "breathes" in and out slowly (6 seconds per cycle).

### 7.3 Tasks screen
- Each task is a rounded cream card with a large checkbox.
- Pomodoro progress shows tomatoes: "🍅 2 of 3 Pomodoros done".
- Completed tasks get a strike-through and fade.
- Action buttons are small ghost pills with icons: 🌱 Focus, ✏️ Edit, 🗑️ Delete.

### 7.4 Garden screen
- Four pastel stat tiles: Today (butter), This week (mint), This month (sky), Streak (blush).
- Plants appear in a grid, each in a mint-to-white card with its name and date.
- Withered plants are shown smaller, on a sandy background, with a caring message.
- Streak milestones can later add a small flame animation. **[TO CONFIRM]**

### 7.5 Settings screen
- Friendly section cards: "Pomodoro timer", "Alerts", "Account".
- Toggles are large and rounded. Disabled fields look soft gray with an explanation line.

### 7.6 Navigation
- **Phone:** bottom bar with four rounded tabs (⏱️ Focus, 📝 Tasks, 🪴 Garden, ⚙️ Settings). The active tab has a mint pill background. The bar has rounded top corners.
- **Desktop:** pill-shaped links in the top bar.
- A floating forest-green pill ("🌱 12:34 focusing") appears on other pages while a session runs.

---

## 8. Motion rules

| Rule | Detail |
|---|---|
| Speed | Small changes 150 ms, plant growth 600 ms, breathing 6 s |
| Feel | Ease-out, slight bounce on pop only |
| Hover and press | Buttons lift 2 px on hover and press down on click |
| Never | Flash faster than 3 times per second, auto-play loud sounds, or move things the user is trying to tap |
| Reduced motion | When the user's system asks for less motion, turn off sway, confetti, breathing, and button lifts. Keep all text and progress information. |

---

## 9. Sound

| Event | Sound |
|---|---|
| Focus or break ends | Soft two-note chime (about 0.6 seconds each, low volume) |
| Button taps | No sound |
| Ambient (post-MVP, FR-30) | Rain, lo-fi, nature, with separate controls |

Sound is optional, can be turned off in Settings, and never plays before the user has interacted with the page.

---

## 10. Microcopy (words matter)

Voice: warm, short, plain. One idea per message. No blame.

| Moment | Copy |
|---|---|
| Start button | 🌱 Start focusing |
| Paused label | Paused. Take your time. |
| Give-up dialog title | Give up this session? |
| Give-up dialog body | Your plant will wither and this session will not count toward your garden or stats. |
| Give-up buttons | Keep going / Yes, give up |
| Success title | Yay! Your Sunflower bloomed |
| Success body | 25 minutes of focus on "Review Chapter 4". It's now in your garden. |
| Withered title | Oh no, it withered |
| Withered body | That's okay. Try a shorter session next time. |
| Break prompt | ☕ Take a short break (5 min) |
| Break over | Break's over! Feeling refreshed? |
| Empty tasks | Nothing here yet. Add a task above to get started 🌿 |
| Empty garden | Your garden is waiting for its first plant. Finish a focus session to grow one! |
| Wrong login | Email or password is incorrect. |
| Network error | Cannot reach Rootine. Check your connection and try again. |
| Notifications blocked | Notifications are blocked for this site. Allow them in your browser's site settings. In-app alerts still work. |

**Language:** UI text in English. **[TO CONFIRM]** whether a Filipino version is wanted later.

---

## 11. Icons and emoji

- Use emoji sparingly as friendly icons: ⏱️ 📝 🪴 ⚙️ 🌱 ☕ 🔥 🍅.
- Emoji are decoration and always have a text label next to them, or a hidden label for screen readers.
- Do not rely on emoji looking the same on every device. Plant art is SVG so it looks identical everywhere.

---

## 12. Components checklist (what to design)

| Component | States to design |
|---|---|
| Primary button | default, hover, pressed, disabled, loading |
| Secondary, ghost, danger buttons | default, hover, focus, disabled |
| Chip (plant, duration) | default, selected, focus |
| Text input and select | default, focus, filled, error, disabled |
| Checkbox and switch | off, on, focus, disabled |
| Card | default, with header, with empty state |
| Stat tile | four pastel versions |
| Task row | open, done, editing |
| Progress bar | 0%, 40%, 100% |
| Dialog | confirm, danger |
| Banner | info, success |
| Bottom nav tab | default, active, focus |
| Mini timer pill | focusing, paused, break |
| Plant | 4 types by 5 stages |
| Mascot | 7 poses |

---

## 13. Accessibility guardrails for the cute style

1. Decorative art (confetti, sparkles) is hidden from screen readers.
2. Every plant image has a text label such as "Cactus: Sprout".
3. Text on pastel backgrounds uses Ink or Forest only.
4. Focus ring is always visible (3 px amber outline).
5. Animations respect the reduced-motion setting.
6. The cute look must not reduce touch target size or spacing.

---

## 14. Deliverables before coding

| # | Deliverable | Owner **[TO CONFIRM]** |
|---|---|---|
| D1 | Color and type tokens as a one-page sheet | Designer |
| D2 | Pot and four plants, all stages, as SVG | Designer or illustrator |
| D3 | Withered versions | Designer |
| D4 | Sprouty mascot, 7 poses | Designer |
| D5 | Low-fidelity wireframes of every screen on a phone | Designer and frontend |
| D6 | High-fidelity mockups of Focus, Tasks, Garden, Settings, Login | Designer |
| D7 | Review against the contrast rules in section 3.3 | Frontend |

**Approval:** the team reviews D1 to D6 before any frontend coding of styles begins.
