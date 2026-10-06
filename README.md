# QuickNotes

QuickNotes is a lightweight, responsive note-taking web application designed to help users quickly capture, categorize, and organize everyday thoughts, tasks, and ideas with real-time feedback and seamless local persistence. Built entirely with vanilla HTML5, CSS3, and JavaScript, the app prioritizes accessibility, safety against cross-site scripting (XSS), and a clean card-based interface that works flawlessly across desktops and mobile devices.

## Features

- **Semantic HTML5 Architecture:** Clean document outline built with semantic tags (`<header>`, `<main>`, `<section>`, `<footer>`, `<form>`, `<label>`, `<select>`) and accessible ARIA attributes.
- **Card-Based Categorization:** Visual distinction for each note category with custom color accents:
  - **Personal:** Teal border and badge
  - **Work:** Dark red border and badge
  - **Study:** Blue border and badge
- **Real-Time Validation:** Immediate feedback preventing empty notes or notes exceeding the 200-character limit, with designated error messages.
- **Dynamic Note Counter:** Clear, reactive count indicator accurately reporting zero, single, or multiple notes (`You have no notes yet.`, `You have 1 note.`, or `You have N notes.`).
- **Live Search Filtering:** Real-time, case-insensitive keyword search with an informative fallback state (`No notes match your search.`) when no matching notes exist.
- **Persistent Storage:** All notes are automatically serialized and saved to `localStorage`, preserving your notes across browser refreshes and sessions.
- **Responsive Flexbox Design:** Adaptive layout with an automated media query breakpoint at 600px, stacking form inputs vertically on mobile screens.
- **Bonus Feature - Bulk Reset:** A "Clear all" button with native browser confirmation (`confirm("Delete all notes?")`) to safely wipe all notes in a single click.

## How to Run the Project Locally

No frameworks, compilers, or build tools are required. You can run the application directly in any modern browser:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mayriah/quicknotes-app.git
   cd quicknotes-app
   ```

2. **Open the project:**
   - Double-click `index.html` in your file explorer to open it directly in your default browser, **OR**
   - Serve the directory using the VS Code Live Server extension, **OR**
   - Serve via Python's built-in HTTP server:
     ```bash
     python -m http.server 8000
     ```
     Then navigate to `http://localhost:8000` in your web browser.

## What I Learned

1. **Safe DOM Manipulation without `innerHTML`:** Creating dynamic list items strictly using `document.createElement()` and `textContent` ensures complete immunity against script injection and XSS vulnerabilities when displaying untrusted user input.
2. **Synchronizing State with `localStorage`:** Implementing consistent serializing and parsing routines with `JSON.stringify` and `JSON.parse` alongside event-driven state updates to maintain parity between memory and disk.
3. **Responsive Mobile-First Form Workflows:** Leveraging CSS Flexbox along with media queries (`@media (max-width: 600px)`) to provide accessible and clean UI transitions from desktop multi-column inputs to mobile stacked touch controls.
