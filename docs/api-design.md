# QuickNotes REST API Design Specification

**Version:** 1.0.0  
**Target Environment:** Production Backend Service  
**Base URL:** `https://api.quicknotes.io/api/v1`  
**Authentication Scheme:** Bearer Token (JWT via `Authorization: Bearer <token>` header)  
**Content Negotiation:** `Content-Type: application/json`, `Accept: application/json`

---

## 1. Overview & Architecture Standards

This document specifies the official REST API design for the production **QuickNotes** backend service. Unlike mock prototyping services (such as JSONPlaceholder), this specification defines production-grade contracts built for high concurrency, strict relational data isolation, role-based authorization, and sub-100ms response latencies for over 1 million users.

### API Guiding Principles
- **RESTful Resource Modelling:** Nouns represent resources (`/notes`, `/tags`, `/users`); standard HTTP verbs define actions (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- **Stateless Authentication:** All secured endpoints require an industry-standard JSON Web Token (JWT) in the `Authorization` header.
- **Data Scoping:** Users are strictly isolated. Queries implicitly filter resources by the authenticated `user_id` extracted from the verified JWT claims.
- **Predictable HTTP Status Codes:** Standard HTTP semantic response codes represent operation outcomes.
- **RFC 7807 Compliant Errors:** Every error response follows a uniform JSON structure with detailed validation feedback.

---

## 2. Endpoint Summary Table

| HTTP Method | Path | Description | Success Status | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notes` | List notes for authenticated user with pagination, tag filtering, and search | `200 OK` | Yes |
| `POST` | `/api/v1/notes` | Create a new note with optional tags | `201 Created` | Yes |
| `GET` | `/api/v1/notes/{id}` | Retrieve a specific note by ID | `200 OK` | Yes |
| `PUT` | `/api/v1/notes/{id}` | Replace/update all fields of an existing note | `200 OK` | Yes |
| `PATCH` | `/api/v1/notes/{id}` | Partially update note attributes (e.g., title, body, pinned) | `200 OK` | Yes |
| `DELETE` | `/api/v1/notes/{id}` | Permanently delete a note and its tag associations | `204 No Content` | Yes |
| `GET` | `/api/v1/tags` | Retrieve all distinct tags used across the user's notes | `200 OK` | Yes |
| `POST` | `/api/v1/auth/login` | Authenticate credentials and issue JWT bearer token | `200 OK` | No |

---

## 3. Detailed Request & Response Examples

### 3.1 Creating a Note (`POST /api/v1/notes`)

Creates a new note owned by the currently authenticated user. Tags provided in the `tags` array will be linked automatically (and inserted into the database if they do not yet exist).

#### Request
- **Method & Path:** `POST /api/v1/notes`
- **Headers:**
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  Accept: application/json
  ```
- **Request Body (JSON):**
  ```json
  {
    "title": "System Architecture Review Notes",
    "body": "Finalized caching tier using Redis clusters and PostgreSQL read replicas. Queue worker handles thumbnail generation.",
    "tags": ["architecture", "scaling", "work"]
  }
  ```

#### Response
- **Status:** `201 Created`
- **Headers:**
  ```http
  Location: /api/v1/notes/4821
  Content-Type: application/json
  ```
- **Response Body (JSON):**
  ```json
  {
    "success": true,
    "data": {
      "id": 4821,
      "user_id": 104,
      "title": "System Architecture Review Notes",
      "body": "Finalized caching tier using Redis clusters and PostgreSQL read replicas. Queue worker handles thumbnail generation.",
      "tags": [
        { "id": 12, "name": "architecture" },
        { "id": 19, "name": "scaling" },
        { "id": 3, "name": "work" }
      ],
      "is_pinned": false,
      "created_at": "2026-10-18T10:15:30.000Z",
      "updated_at": "2026-10-18T10:15:30.000Z"
    }
  }
  ```

---

### 3.2 Listing Notes (`GET /api/v1/notes`)

Retrieves a paginated list of notes belonging to the authenticated user. Supports filtering by keyword search, specific tags, and sorting.

#### Query Parameters:
- `page` *(optional, integer, default: 1)*: Current page number.
- `limit` *(optional, integer, default: 10, max: 100)*: Number of records per page.
- `tag` *(optional, string)*: Filter by exact tag name (e.g. `?tag=architecture`).
- `search` *(optional, string)*: Case-insensitive search on title and body.
- `sort` *(optional, string, default: `-created_at`)*: Field to sort by (`-` prefix indicates descending order).

#### Request
- **Method & Path:** `GET /api/v1/notes?page=1&limit=2&tag=work&sort=-created_at`
- **Headers:**
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Accept: application/json
  ```

#### Response
- **Status:** `200 OK`
- **Response Body (JSON):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 4821,
        "user_id": 104,
        "title": "System Architecture Review Notes",
        "body": "Finalized caching tier using Redis clusters and PostgreSQL read replicas. Queue worker handles thumbnail generation.",
        "tags": [
          { "id": 12, "name": "architecture" },
          { "id": 19, "name": "scaling" },
          { "id": 3, "name": "work" }
        ],
        "is_pinned": false,
        "created_at": "2026-10-18T10:15:30.000Z",
        "updated_at": "2026-10-18T10:15:30.000Z"
      },
      {
        "id": 4810,
        "user_id": 104,
        "title": "Quarterly Sprint Retrospective",
        "body": "Action items: streamline continuous integration pipelines and improve unit test coverage across data access layers.",
        "tags": [
          { "id": 3, "name": "work" },
          { "id": 8, "name": "retrospective" }
        ],
        "is_pinned": true,
        "created_at": "2026-10-17T14:22:10.000Z",
        "updated_at": "2026-10-17T15:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 2,
      "total_records": 18,
      "total_pages": 9,
      "has_next_page": true,
      "has_prev_page": false
    }
  }
  ```

---

## 4. Error Status Codes & Response Body Specification

QuickNotes uses conventional HTTP status codes to communicate client and server side errors. All error responses conform to a unified schema providing structured diagnostic details.

### Error Status Codes Reference

| Status Code | Reason / Description | Common Triggers |
| :--- | :--- | :--- |
| **`400 Bad Request`** | The request was malformed or failed validation constraints | Missing title, title exceeds 100 characters, invalid JSON syntax, or unsupported query parameter |
| **`401 Unauthorized`** | Authentication credentials are missing, invalid, or expired | Missing `Authorization` header, invalid JWT signature, expired token |
| **`403 Forbidden`** | The authenticated user lacks permission to access or modify this resource | Attempting to access, edit, or delete another user's private note ID |
| **`404 Not Found`** | The requested resource could not be found | Note with requested ID does not exist in the database |
| **`500 Internal Server Error`** | An unexpected condition occurred on the server | Unhandled exception, database connection pool exhaustion, cache node timeout |

---

### Standard Error Body Schema

Error payloads follow a consistent schema featuring human-readable messages, unique error tracking identifiers, and field-level validation breakdowns:

```json
{
  "success": false,
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "The submitted payload failed validation constraints.",
  "timestamp": "2026-10-18T10:20:15.123Z",
  "path": "/api/v1/notes",
  "details": [
    {
      "field": "title",
      "message": "Title is required and must not be empty or whitespace."
    },
    {
      "field": "title",
      "message": "Title cannot exceed 100 characters in length."
    }
  ]
}
```

### Example: `401 Unauthorized` Response
```json
{
  "success": false,
  "status": 401,
  "error": "Unauthorized",
  "code": "TOKEN_EXPIRED",
  "message": "Your session has expired. Please log in again to renew your access token.",
  "timestamp": "2026-10-18T10:21:00.450Z",
  "path": "/api/v1/notes"
}
```

### Example: `403 Forbidden` Response
```json
{
  "success": false,
  "status": 403,
  "error": "Forbidden",
  "code": "ACCESS_DENIED",
  "message": "You do not have permission to view or manipulate note #4821.",
  "timestamp": "2026-10-18T10:21:45.789Z",
  "path": "/api/v1/notes/4821"
}
```

### Example: `404 Not Found` Response
```json
{
  "success": false,
  "status": 404,
  "error": "Not Found",
  "code": "NOTE_NOT_FOUND",
  "message": "No note exists with ID #99999.",
  "timestamp": "2026-10-18T10:22:10.012Z",
  "path": "/api/v1/notes/99999"
}
```

### Example: `500 Internal Server Error` Response
```json
{
  "success": false,
  "status": 500,
  "error": "Internal Server Error",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An internal error occurred while processing your request. Please try again later.",
  "timestamp": "2026-10-18T10:23:00.890Z",
  "path": "/api/v1/notes"
}
```
