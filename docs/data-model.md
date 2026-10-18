# QuickNotes Database Data Model Specification

**Target Database Management System:** PostgreSQL 15+ / SQLite 3 compatible  
**Design Normalization Form:** Third Normal Form (3NF) / Boyce-Codd Normal Form (BCNF)  
**Schema Version:** 1.0.0

---

## 1. Entity Definitions & Attribute Catalog

The QuickNotes relational database consists of four core tables: **`users`**, **`notes`**, **`tags`**, and the junction table **`note_tags`**.

### 1.1 `users` Table
Stores authenticated account holders and profile credentials.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique autoincrementing 64-bit integer identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Display name of the user |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Unique email address used for login |
| `password_hash`| `VARCHAR(255)` | `NOT NULL` | Secure salted Argon2id/bcrypt password hash |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Profile last update timestamp |

---

### 1.2 `notes` Table
Stores individual note items authored by users.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique note identifier |
| `user_id` | `BIGINT` | `NOT NULL, FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE` | Owner user identifier |
| `title` | `VARCHAR(100)` | `NOT NULL, CHECK (length(trim(title)) > 0)` | Note headline (max 100 characters) |
| `body` | `TEXT` | `NULL` | Free-form note markdown/plain text body |
| `is_pinned` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Flag to pin note to top of user's feed |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Note creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Note last modified timestamp |

---

### 1.3 `tags` Table
Stores normalized taxonomy labels used to categorize notes across the system.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique tag identifier |
| `name` | `VARCHAR(50)` | `NOT NULL, UNIQUE, CHECK (length(trim(name)) > 0)` | Case-insensitive tag keyword (e.g. `urgent`, `work`) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Tag initial creation timestamp |

---

### 1.4 `note_tags` Table (Junction / Association Table)
Resolves the many-to-many relationship between notes and tags.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `note_id` | `BIGINT` | `NOT NULL, FOREIGN KEY REFERENCES notes(id) ON DELETE CASCADE` | Associated note reference |
| `tag_id` | `BIGINT` | `NOT NULL, FOREIGN KEY REFERENCES tags(id) ON DELETE CASCADE` | Associated tag reference |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT CURRENT_TIMESTAMP` | Association timestamp |
| **Primary Key** | `(note_id, tag_id)` | `PRIMARY KEY (note_id, tag_id)` | Composite key preventing duplicate tag pairings |

---

## 2. Entity-Relationship Model & Cardinality

```
+----------------+          1 : N          +----------------+
|     users      | -----------------------> |     notes      |
+----------------+                          +----------------+
| PK  id         |                          | PK  id         |
|     name       |                          | FK  user_id    |
|     email      |                          |     title      |
|     created_at |                          |     body       |
+----------------+                          +----------------+
                                                    |
                                                    | 1 : N
                                                    v
                                            +----------------+
                                            |   note_tags    |
                                            +----------------+
                                            | PK,FK  note_id |
                                            | PK,FK  tag_id  |
                                            +----------------+
                                                    ^
                                                    | N : 1
                                                    |
                                            +----------------+
                                            |      tags      |
                                            +----------------+
                                            | PK  id         |
                                            |     name       |
                                            +----------------+
```

### Explanation of Relationships:

1. **One-to-Many (`1:N`) between `users` and `notes`:**
   - **Semantics:** A single user can create zero, one, or thousands of notes over time. However, every single note record is owned by exactly one user, enforced through the foreign key `notes.user_id` referencing `users(id)`.
   - **Referential Integrity:** With `ON DELETE CASCADE`, if a user deletes their account, all notes belonging to that user are cleanly pruned, preventing orphan records.

2. **Many-to-Many (`M:N`) between `notes` and `tags` via `note_tags`:**
   - **Semantics:** A single note can have multiple tags attached to it (e.g., `#urgent`, `#work`, `#project2`). Conversely, a single tag (e.g., `#urgent`) can categorize hundreds of thousands of notes created by different users.
   - **Why a Join Table is Required:** Relational database normalization forbids multi-valued attributes (like an un-indexed comma-separated string `tags = "work,urgent"` in the `notes` table), which violates First Normal Form (1NF) and makes indexing, tag updates, and cross-tag queries slow and error-prone. The `note_tags` join table models this relationship with a composite primary key `PRIMARY KEY (note_id, tag_id)`, ensuring a note cannot be tagged with the exact same tag twice.

---

## 3. SQL Data Definition Language (DDL)

The following `CREATE TABLE` statements define the complete schema:

```sql
-- 1. Users Table
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Notes Table
CREATE TABLE notes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  title       VARCHAR(100) NOT NULL CHECK (length(trim(title)) > 0),
  body        TEXT,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tags Table
CREATE TABLE tags (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Note Tags Join Table (Composite Primary Key)
CREATE TABLE note_tags (
  note_id    BIGINT NOT NULL,
  tag_id     BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (note_id, tag_id),
  CONSTRAINT fk_notetags_note
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  CONSTRAINT fk_notetags_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

---

## 4. Example SQL Queries

### Query 1: Retrieve All of a User's Notes, Newest First
Fetches all notes owned by user "Amina" (or user ID `104`), ordered chronologically with the newest notes first.

```sql
SELECT 
  id,
  title,
  body,
  is_pinned,
  created_at,
  updated_at
FROM notes
WHERE user_id = 104
ORDER BY created_at DESC;
```

---

### Query 2: Retrieve All Notes Tagged "urgent" (Two JOINs)
Finds all note titles and bodies that have been labeled with the tag `'urgent'`. Demonstrates traversing the many-to-many relationship via the junction table.

```sql
SELECT 
  notes.id,
  notes.title,
  notes.body,
  users.name AS author_name,
  tags.name  AS tag_name
FROM notes
JOIN note_tags ON note_tags.note_id = notes.id
JOIN tags      ON tags.id = note_tags.tag_id
JOIN users     ON users.id = notes.user_id
WHERE tags.name = 'urgent'
ORDER BY notes.created_at DESC;
```

---

### Query 3: Count How Many Notes Each User Has (LEFT JOIN & GROUP BY)
Calculates total note count per user, preserving users who currently have 0 notes.

```sql
SELECT 
  users.id,
  users.name,
  users.email,
  COUNT(notes.id) AS note_count
FROM users
LEFT JOIN notes ON notes.user_id = users.id
GROUP BY users.id, users.name, users.email
ORDER BY note_count DESC;
```

---

### Query 4 (Bonus): Fetch a Note Along with All Its Associated Tags (Aggregated)
Retrieves a note and constructs a comma-delimited list of its tags in a single efficient query.

```sql
SELECT 
  notes.id,
  notes.title,
  notes.body,
  notes.created_at,
  COALESCE(STRING_AGG(tags.name, ', ' ORDER BY tags.name), 'None') AS tag_list
FROM notes
LEFT JOIN note_tags ON note_tags.note_id = notes.id
LEFT JOIN tags      ON tags.id = note_tags.tag_id
WHERE notes.id = 4821
GROUP BY notes.id, notes.title, notes.body, notes.created_at;
```

---

## 5. Performance Indexes & Justifications

To achieve sustained sub-10ms query execution across 1,000,000 users and tens of millions of note rows, the following indexes are deployed:

### Index 1: Composite Index on `notes(user_id, created_at DESC)`
```sql
CREATE INDEX idx_notes_user_created ON notes(user_id, created_at DESC);
```
- **Reason:** In QuickNotes, the single most frequent query executed by the client is `GET /api/v1/notes`, which looks up notes by `user_id` and sorts them chronologically (`ORDER BY created_at DESC`). Without an index, the database must perform an expensive full sequential table scan across all rows and an in-memory sort. With this composite B-tree index, the database performs an $O(\log N)$ index seek to the specific user and reads rows in pre-sorted order, eliminating in-memory sorting completely.

### Index 2: Secondary Index on `note_tags(tag_id)`
```sql
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);
```
- **Reason:** The composite primary key `PRIMARY KEY (note_id, tag_id)` automatically creates a B-tree index where `note_id` is the leading key column. While this quickly resolves "find all tags for a note", finding "all notes with a given tag" requires filtering on `tag_id`. A dedicated B-tree index on `tag_id` allows instant lookups for tag-based filtering without table scans.

### Index 3: Case-Insensitive Unique Index on `tags(LOWER(name))`
```sql
CREATE UNIQUE INDEX idx_tags_lower_name ON tags(LOWER(name));
```
- **Reason:** Ensures canonical tag naming (e.g., preventing duplicate creation of `"Work"`, `"work"`, and `"WORK"`) while speeding up tag search autocomplete lookups.

---

## 6. SQL vs. NoSQL Architectural Justification

For QuickNotes, a **Relational SQL Database (such as PostgreSQL)** is the unequivocally superior choice over a NoSQL document or key-value store (such as MongoDB or DynamoDB). 

1. **Relational Integrity & Foreign Key Guarantees:** QuickNotes relies on strict relationships: notes belong to users, and notes share tags via a many-to-many relationship. In a NoSQL document database, tag relationships are either denormalized (stored as embedded arrays in note documents) or simulated in application logic. If tags are embedded, renaming a tag or querying tag statistics across 1 million users requires scanning and mutating millions of individual documents. In SQL, renaming a tag requires updating exactly one row in the `tags` table in constant $O(1)$ time.
2. **ACID Transactions & Data Consistency:** Note editing, account deletions, and concurrent operations demand strict serializability and atomic updates. Cascading foreign keys (`ON DELETE CASCADE`) guarantee that when an account or note is removed, orphan rows in `note_tags` and `notes` are purged atomically. NoSQL stores lack cross-collection atomic cascades out of the box, introducing data anomalies and orphan leakage.
3. **Structured Schema & Predictable Workloads:** The data model of QuickNotes is compact, highly structured, and fixed. Because each note row averages under 1 KB, 100 million notes occupy only ~100 GB of storage—easily managed within a single PostgreSQL primary instance with read replicas and connection pooling (PgBouncer). Therefore, the perceived horizontal sharding advantages of NoSQL are unneeded, while SQL's joins, relational constraints, and index optimizations provide superior performance, safety, and operational simplicity.
