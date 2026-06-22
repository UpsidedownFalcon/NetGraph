# NetGraph — UI / UX Specification

## 1. Design philosophy

NetGraph is meant to feel like looking at a quiet **night sky of people** — calm,
dark, and focused. The interface stays out of the way: muted surfaces, a single
accent per person (their status colour), and gentle motion. Nothing blinks for
attention; the data is the star.

Principles:
- **Calm over busy.** Dark background, low-contrast chrome, one bright thing at a
  time (the selected person).
- **Direct manipulation.** You arrange people in space by dragging; you connect
  them by dragging between them. The canvas *is* the model.
- **One source of truth, two lenses.** Graph and Table show the same data.
- **Quiet motion, respectfully.** Subtle starfield + node pulse, fully disabled
  under `prefers-reduced-motion`.

## 2. Visual language (design tokens)

Defined as CSS custom properties in `src/app/globals.css`.

### Surfaces (dark → light)
- `--bg-deep` `#08090d` — app background
- `--bg-elevated` `#14161d` — bars, cards
- `--bg-elevated-2` `#1c1f28` — inputs, insets
- `--border-subtle` `#2a2e3a` — hairline borders

### Text
- `--text-primary` `#e8eaf0`
- `--text-secondary` `#9aa0b0`
- `--text-muted` `#5c6273`

### Status colours (the core semantic palette)
| Status       | Token              | Colour    | Meaning                         |
| ------------ | ------------------ | --------- | ------------------------------- |
| Known        | `--status-known`   | `#f2f5fb` | You know them                   |
| To contact   | `--status-contact` | `#f2c94c` | You intend to reach out         |
| Avoid        | `--status-avoid`   | `#eb6f72` | Steer clear                     |
| Friend       | `--status-friend`  | `#6fcf97` | Close / trusted                 |

Each has a matching translucent `--glow-*` used for the node halo. Edges use
`--edge-default` / `--edge-active`.

### Typography
- Sans: **Geist** (`--font-geist-sans`) for everything.
- Mono: **Geist Mono** (`.mono`) for small uppercase labels (e.g. `STATUS`).

## 3. Layout

```
┌───────────────────────────────────────────────┐
│  ● NetGraph   [ Graph ] [ Table ]    [Log out] │  ← top bar (52px, elevated)
├───────────────────────────────────────────────┤
│  [search…]                                      │
│                                                 │
│        ·  ✦  glowing person nodes  ✦  ·         │  ← body: Graph or Table
│                                                 │
│   (drifting starfield behind everything)        │
└───────────────────────────────────────────────┘
```

- **Top bar:** brand dot + name on the left, view tabs in the middle, **Log out**
  pushed to the far right.
- **Body:** fills remaining height (`flex: 1; min-height: 0`); hosts the Graph or
  Table.
- **Starfield:** a fixed full-viewport `<canvas>` at `z-index: 0`; all content sits
  above it at `z-index: 1+`.

## 4. Components & states

### Person node (`PersonNode`)
- An 18px **glowing dot** in the status colour with a soft halo.
- **Name** above, **ask** below (the ask renders markdown, kept compact).
- A small **drag grip** (`⠿`) above the name — the *only* place that moves the node.
- The whole dot is an invisible **connection handle** (drag out to connect).
- States: *default* (slow pulse), *selected* (brighter ring + halo), *dimmed*
  (faded to ~25% when another person is focused).

### Edge (`FloatingEdge`)
- A straight arrow from source dot to target dot, re-aiming as nodes move.
- *Active* (touches the selected person): brighter and thicker. *Dimmed* otherwise.
- When selected, shows a round **×** button at its midpoint to delete it.

### Detail popup (`DetailPopup`)
- Centered modal over a dimmed overlay; click outside or **Esc** to close.
- Name field, status swatches, three markdown note fields (Write/Preview), and a
  channels editor (type dropdown, handle, ★ primary toggle, × remove).
- Footer: Delete (edit mode), Cancel, Save.

### Table (`TableView`)
- Columns: Status, Name, My ask, Background, How we met, Channels, (delete).
- Editable cells look like real input fields, **brighten on hover** and **glow
  amber on focus**; empty cells show a "Click to edit…" hint. Saved on blur.
- Status is a dropdown saved immediately.

### Login (`LoginClient`)
- Centered card over the starfield: brand, username, password, error line, submit
  button with a loading state.

## 5. Interaction model

| Action                                   | Result                                            |
| ---------------------------------------- | ------------------------------------------------- |
| Click empty canvas                       | Open "create person" popup at that spot           |
| Click a node's **dot**                   | Open that person's edit popup (and focus them)    |
| Click/hold a node's **grip** (`⠿`)       | Focus + highlight them (no popup)                 |
| Drag the **grip**                        | Move the node (position persists)                 |
| Drag from a **dot** to another dot       | Create a connection (arrow)                       |
| Click an edge → **×** (or Delete key)    | Remove the connection                             |
| Select a node + **Delete/Backspace**     | Remove the person                                 |
| Type in search + **Enter**               | Fly to the first match and focus them             |
| **Esc**                                  | Clear focus/dim; close an open popup              |
| Tabs **Graph / Table**                   | Switch view (same underlying data)                |
| **Log out**                              | End session, return to login                      |

**Focus/dim model:** with someone selected, they and their *direct* neighbours stay
bright; everyone else dims. This answers "who is this person connected to?" at a
glance. Cleared with Esc or by clicking empty canvas.

## 6. Motion

- **Starfield:** small stars slowly drift and twinkle on a canvas; they wrap at the
  edges. Purely decorative, never interactive.
- **Node pulse:** a ~1.6s brightness "breathing" loop (`ng-pulse`).
- **Transitions:** opacity/box-shadow eased ~220ms for selection and dimming.

## 7. Accessibility

- **Reduced motion:** under `prefers-reduced-motion: reduce`, all animations and
  transitions are disabled and stars stop drifting.
- **Keyboard:** Escape closes dialogs and clears focus; Delete/Backspace removes a
  selected node/edge; the search field and form inputs are standard and
  tab-navigable. React Flow ignores Delete while typing in inputs.
- **Non-interactive decoration:** the starfield is `aria-hidden` and
  `pointer-events: none`.
- **Contrast:** primary text and status colours are chosen for legibility on the
  deep background; labels carry a text-shadow so they stay readable over nodes.

## 8. Empty & error states

- **Fresh database:** an empty canvas with the hint "Click anywhere to add your
  first person." (No seeded example people.)
- **Form errors:** inline messages in the accent-red `--status-avoid` (e.g. "Name
  is required", "Could not add channel").
- **Expired session:** the app redirects to the login screen.
