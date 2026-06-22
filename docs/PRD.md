# NetGraph — Product Requirements Document (PRD)

## 1. Overview

NetGraph is a private, single-user tool for **mapping the people in your personal
and professional network**. It turns a mental model of "who I know, what I want
from them, and who introduced whom" into a visual, searchable, editable graph that
lives entirely on the user's own machine.

It is the kind of tool a founder, job-seeker, community organiser, or networker
keeps open in the background to remember context about people and the paths between
them.

## 2. Problem

People meet far more contacts than they can keep meaningful track of. Existing
tools fall short:

- **Phone contacts / CRMs** store flat lists, not the *relationships between*
  people, and they're built for companies, not individuals.
- **Note apps** capture context but can't show the shape of a network or who
  connects to whom.
- **Cloud CRMs** put sensitive personal notes ("avoid — overpromises") on someone
  else's servers.

There is no lightweight, private, visual way to answer questions like *"who do I
know that could introduce me to X?"* or *"what was my ask with this person again?"*

## 3. Goals

1. Let a user capture each person with the context that matters: status, their
   "ask", background, how they met, and contact channels.
2. Make **relationships between people** first-class — drawn as a graph of arrows.
3. Make the network **navigable**: search to jump to anyone, and highlight a
   person's immediate connections.
4. Offer both a **spatial** view (graph) and a **tabular** view of the same data.
5. Keep everything **private and local** — no cloud, no third parties, gated by a
   password.
6. Feel **calm and considered** — a quiet, dark, "constellation" aesthetic rather
   than a busy dashboard.

## 4. Target user

A single individual managing their own network on their own computer. Technical
enough to run a local dev server and set an environment file. Not a team; not a
business with multiple seats.

## 5. Key terms

| Term            | Meaning                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| **Person**      | A node in the graph — someone the user knows or wants to know.           |
| **Status**      | The user's stance toward a person: Known, To contact, Avoid, Friend.    |
| **Ask**         | What the user wants from this person (shown under their node).           |
| **Channel**     | A way to reach a person (WhatsApp, email, LinkedIn, …), with a handle.   |
| **Relationship**| A directional link between two people (e.g. "A introduced me to B").     |

## 6. Functional requirements

### 6.1 Authentication
- A single account, credentials defined in environment variables.
- Login screen; the rest of the app is inaccessible until signed in.
- Log out from within the app.

### 6.2 People
- Create a person by clicking empty canvas; edit via a detail popup.
- Fields: name (required), status, ask, background, how-we-met, position.
- Background / ask / how-we-met support **markdown**.
- Delete a person (which also removes their channels and connections).

### 6.3 Channels
- Add, edit, and remove multiple contact channels per person.
- Each channel has a type, a handle, and an optional "primary" flag.

### 6.4 Relationships
- Draw a connection by dragging from one person to another.
- Connections show as directional arrows.
- Delete a connection by selecting it.
- No self-connections; no duplicate connections.

### 6.5 Graph view
- Nodes are status-coloured glowing dots, draggable to reposition (persisted).
- Selecting a person highlights them + direct neighbours and dims the rest.
- A search box jumps the view to the first matching person.

### 6.6 Table view
- All people in a spreadsheet, with inline editing of each field.
- Editing in the table is reflected in the graph and vice versa.

### 6.7 Persistence
- All data stored in a local SQLite file, surviving restarts.
- Node positions persist.

## 7. Non-functional requirements

- **Privacy:** all data on-device; nothing sent to third parties.
- **Performance:** smooth dragging and interaction for a personal-scale network
  (hundreds of people).
- **Accessibility:** respect `prefers-reduced-motion`; keyboard Escape to clear
  focus and close dialogs.
- **Resilience:** safe to restart; schema auto-created; corrupt/empty inputs
  rejected with clear errors.

## 8. Out of scope (non-goals)

- Multi-user accounts, registration, roles, or sharing.
- Cloud sync or hosted multi-tenant deployment.
- Mobile-first / native apps.
- Importing from external address books or social networks.
- **Sample/seed data** — the app intentionally starts empty.
- Automated reminders, messaging, or outreach.

## 9. Success criteria

- A user can, in one sitting: log in, add several people with notes and channels,
  connect them, reposition them, search to one, edit one in the table, and log out
  — with all of it still present after a restart.
- No personal data is ever transmitted off the machine.
- The interface feels quiet and legible, not cluttered.

## 10. Future possibilities (not committed)

- Tags/groups and filtering by them.
- Relationship labels surfaced on the edges.
- Export/import of the database from within the UI.
- Timeline / "last contacted" tracking.
