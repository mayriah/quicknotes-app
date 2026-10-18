# QuickNotes: System Design & REST API Client

A production-grade system design specification and working front-end REST API client designed to transition **QuickNotes** from a browser-only prototype into a scalable online cloud service supporting 1,000,000 active users.

---

## Project Overview

QuickNotes is transitioning from a standalone browser application to an enterprise-grade cloud service. This project delivers two critical engineering components:
1. **Interactive REST API Client:** A resilient front-end client built with semantic HTML5, CSS3, and vanilla JavaScript that interacts with a REST API (using [JSONPlaceholder](https://jsonplaceholder.typicode.com/) for mock CRUD verification). It features asynchronous lifecycle state handling (`loading`, `success`, `error`, and `empty` states), input validation, and XSS prevention.
2. **System Design & Architecture Documentation:** Complete architectural and database specifications ready for backend engineering teams to construct the production service, covering REST API design, normalized relational data modeling, capacity planning, and high-availability architecture.

---

## Repository Structure

```
quicknotes-app/
│
├── index.html              # HTML5 skeleton with form, buttons, and status box
├── style.css               # Modern design system with distinct state styling
├── api.js                  # Asynchronous REST client (GET, POST, DELETE)
│
├── docs/                   # System Design Specifications
│   ├── api-design.md       # REST API endpoint specifications & RFC 7807 errors
│   ├── data-model.md       # Relational schema (3NF), DDL, queries, & indexes
│   └── architecture.md     # 1M user load estimates, architecture diagram, & SPOFs
│
└── README.md               # Project documentation and learning summary
```

---

## How to Run the API Client

The API client runs in any modern web browser without requiring external build tools or runtime compilers.

### Option 1: Direct Browser Launch
Open `index.html` directly in your browser:
- On Windows: Double-click `index.html` or open PowerShell and run:
  ```powershell
  Start-Process index.html
  ```

### Option 2: Local HTTP Server (Recommended)
Running through a local web server avoids browser file-origin restrictions:
- Using Python:
  ```bash
  python -m http.server 8000
  ```
- Using Node.js:
  ```bash
  npx serve .
  ```
- Using VS Code: Right-click `index.html` and click **"Open with Live Server"**.

Visit `http://localhost:8000` to interact with the API client.

### Using the Client Features:
- **Load Notes (GET):** Click **"Load Notes"** to fetch 10 notes from `https://jsonplaceholder.typicode.com/posts?_limit=10`. The status message updates to `"Loading notes..."` with buttons disabled, then confirms `"Loaded 10 notes from the server."`
- **Create Note (POST):** Fill in the title (mandatory, maximum 100 characters) and optional body, then click **"Add Note"**. The client validates your input, sends a POST request, adds the new note to the top of the feed, resets the form, and displays the status code and assigned note ID (`"Note created (status 201, id 101)"`).
- **Delete Note (DELETE):** Click the **"Delete"** button on any note card. An animated removal occurs upon receiving a successful delete status response. If all notes are removed, a friendly empty-state placeholder appears.

---

## System Design Documentation Links

The system design for the backend production platform is detailed in three comprehensive documents:

1. 📄 **[API Design Specification](docs/api-design.md):**  
   Details 8 production REST endpoints (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `AUTH`), query parameters for pagination and tag filtering, request/response JSON payloads, and RFC 7807-compliant error structures for `400`, `401`, `403`, `404`, and `500`.

2. 🗄️ **[Database Data Model Specification](docs/data-model.md):**  
   Defines the normalized relational schema across `users`, `notes`, `tags`, and `note_tags`. Includes PostgreSQL DDL statements with foreign key cascading, cardinality diagrams (1:N, M:N), complex analytical queries with `JOIN` operations, B-tree performance indexing justifications, and an architectural justification for choosing SQL over NoSQL.

3. 🏗️ **[System Architecture Specification](docs/architecture.md):**  
   Outlines functional and non-functional requirements, rigorous capacity planning calculations for 1,000,000 users (read/write throughput and annual storage), high-level component diagrams, step-by-step request flow walks for `GET /notes` and `POST /notes`, and trade-off analyses with single-point-of-failure (SPOF) elimination strategies.

---

## What I Learned

1. **Robust Asynchronous State Management and Client Defensive Design:**  
   Building the API client emphasized the necessity of managing UI states across the entire lifecycle of an HTTP request. By implementing explicit `loading`, `success`, `error`, and `empty` states and disabling interactive buttons while promises resolve, we prevent accidental duplicate submissions and race conditions. Furthermore, strictly utilizing `textContent` rather than `innerHTML` for dynamic user content guarantees immunity from Cross-Site Scripting (XSS) vectors.

2. **Relational Data Modeling vs. NoSQL Trade-offs at Scale:**  
   Designing the schema for 1 million users demonstrated why relational databases (PostgreSQL) excel for structured, tag-driven applications. Modeling tags via an associative join table (`note_tags`) eliminates data duplication and enables instantaneous tag renames in $O(1)$ time, whereas document databases would demand sweeping updates across millions of nested documents. Composite indexing (`idx_notes_user_created`) optimizes the primary read path to $O(\log N)$ seeks without memory-heavy sorts.

3. **High-Availability System Architecture and Decoupling:**  
   Architecting for high availability requires decoupling stateless compute from stateful persistence. By placing stateless application nodes behind a load balancer and separating read traffic to PostgreSQL replicas while caching hot user data in a Redis cluster, we shield the primary write database from overload. Incorporating an asynchronous message queue allows heavy computational tasks (like search indexing and notifications) to run out-of-band, preserving sub-50ms API response times.
