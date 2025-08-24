# Hell — Plumb Field Tracker

Dark, fast, and simple jobsite boards with draggable/resizable cards:
- **Boards:** Jobs, Forms, Media, Notes, Measurements
- **Realtime:** Live Firestore updates via `onSnapshot`
- **Layout persistence:** Saves `x/y/w/h` on drag/resize
- **Uploads:** Images/PDFs → Firebase Storage; links appear on the card
- **Geotag:** One-click “Use Current Location” fills `lat,lng`

## Quick Start

### 1) Firebase setup
- Create a Firebase project (or use the existing one).
- Enable:
  - **Firestore** (native mode)
  - **Storage**
- In **Project settings → General → Your apps (Web)** grab your config.

**Option A (recommended):** Put your config in a small file and load it before `app.js`:

```html
<script>
  window.FIREBASE_CONFIG = {
    apiKey: "…",
    authDomain: "…",
    projectId: "…",
    storageBucket: "…",
    messagingSenderId: "…",
    appId: "…"
  };
</script>
<script type="module" src="app.js"></script>
