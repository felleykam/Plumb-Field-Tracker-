# Plumbing Board App Scaffold

This directory contains a basic scaffold for your custom **Plumbing Board** web
application. The goal is to provide a Trello‑style experience that you can
self‑host (e.g. with GitHub Pages, Netlify, Vercel or another static hosting
service) without paying subscription fees. It leverages
[GridStack.js](https://gridstackjs.com) for drag‑and‑drop, resizable cards and
[Firebase](https://firebase.google.com) for realtime data storage and sync. The
structure is modular so you can easily extend it with additional boards,
features or plugins.

## Features

- **Multiple boards**: Five boards are defined out of the box – Jobs, Forms,
  Media, Notes and Measurements. Switching boards is as simple as clicking the
  corresponding entry in the sidebar.
- **Drag‑and‑drop cards**: Each board uses GridStack.js, which provides a
  responsive 12‑column grid layout with drag and resize support. Cards snap
  into place on the grid.
- **Realtime persistence**: Cards are stored in separate Firestore
  collections (`jobs`, `forms`, `media`, `notes` and `measurements`). Changes
  in position and size are automatically persisted so your layouts stay the
  same across devices.
- **Color coding**: When adding a card you can choose a color. The card
  background reflects the selected color, making it easy to visually classify
  items.
- **Optional geolocation**: On the Jobs board you can record GPS
  coordinates using the browser’s Geolocation API. A “Use Current
  Location” button captures the latitude and longitude and stores them with
  the card.
- **Modular architecture**: It’s straightforward to add new boards or
  additional fields on cards – simply create a new entry in the `boards`
  object and a matching collection in Firestore.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Defines the page structure, sidebar navigation, card dialog and includes the GridStack and Firebase scripts. |
| `style.css` | Provides basic styling for the sidebar, toolbar, boards, cards and modal dialog. Feel free to customize colours and layout. |
| `app.js` | Handles Firebase initialization, GridStack setup, loading existing cards, saving new cards and syncing card positions. Replace the placeholder Firebase config with your project settings. |
| `README.md` | This documentation. |

## Getting started

1. **Set up Firebase** – You’ve already created a Firebase project and added
   collections for `jobs`, `forms` and `media`. Make sure you also create
   `notes` and `measurements` collections in your Cloud Firestore. For each
   collection you don’t need to define a schema ahead of time.
2. **Add your Firebase config** – Open `app.js` and replace the values in
   the `firebaseConfig` object with the credentials from your Firebase
   console (Project settings → General → Your apps → Firebase SDK snippet). Do
   **not** commit your API keys to a public repository.
3. **Deploy** – You can serve the contents of `plumbing_board_app` as a
   static site. For development you can run a simple local HTTP server
   (e.g. `npx http-server plumbing_board_app`) so the ES modules load
   correctly. For production, upload the folder to GitHub Pages, Netlify or
   Vercel. Firebase’s CDN scripts require an HTTP(s) context and will not
   run when opened directly from the file system.
4. **Customize** – This scaffold is intentionally minimal. Here are some
   ideas for extending it:
   - Add additional fields to the modal form (e.g. priority, tags, due
     date) and display them on the card.
   - Implement file uploads to Firebase Storage on the Media board so
     photos and PDFs are persisted instead of stored only locally.
   - Allow cards to be dragged between boards (e.g. move a job card to
     “Done” or “Archived” boards).
   - Integrate search, filtering and sorting.
   - Create different views (table, calendar or gallery) using GridStack’s
     responsive features.

## Drawing inspiration

During research for this project we reviewed several open‑source Trello
alternatives to better understand common features and design patterns:

- **Focalboard** – It offers multiple views (Kanban, table, gallery and
  calendar) to organize and visualize work. Filters help focus on high
  priority items and pre‑built templates accelerate setup【378826478641828†L84-L99】. Real‑time collaboration
  features allow commenting and @mentions so teams stay aligned【378826478641828†L84-L99】.
- **WeKan** – A Meteor‑based open‑source kanban board. Boards can be
  customized with columns (lists) and cards with titles, descriptions,
  due dates and comments【378826478641828†L39-L60】. WeKan emphasises privacy, security and self‑hosting【378826478641828†L46-L64】.
- **Kanboard** – A minimalist kanban tool with customizable columns,
  query language for finding tasks quickly and automation rules to reduce
  repetitive work【378826478641828†L119-L128】.
- **Planka** – A React/Redux‑based kanban board that supports real‑time
  collaboration and is built with modern technologies【378826478641828†L146-L158】.

Grid layouts were considered for the “vector page” concept. We discovered
GridStack.js, a TypeScript library for creating draggable, resizable and
responsive components. It uses a 12‑column grid system similar to
Bootstrap and supports frameworks like React, Angular, Vue and others【891017423359994†L143-L170】. Its features include mobile‑friendly
layout, drag‑and‑drop interaction, resizable components and the ability to
persist custom layouts【891017423359994†L177-L206】, making it an excellent choice for building your
board interface.

Feel free to draw on these ideas as you develop the Plumbing Board to suit
your exact workflow.