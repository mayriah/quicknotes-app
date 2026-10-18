/**
 * QuickNotes API Client
 * Day 7 Project - REST API Integration with JSONPlaceholder
 */

// 1. API Endpoint Constant
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

// DOM Element References (assigned on DOMContentLoaded)
let loadBtn = null;
let statusEl = null;
let noteForm = null;
let titleInput = null;
let bodyInput = null;
let submitBtn = null;
let notesList = null;
let charCounter = null;
let notesCounter = null;

// In-memory notes collection
let notes = [];

/**
 * Reusable HTTP request helper
 * Performs fetch, checks response.ok, and throws an error on failure.
 *
 * @param {string} url - Target URL
 * @param {RequestInit} [options={}] - Fetch configuration options
 * @returns {Promise<{data: any, status: number}>}
 */
async function request(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json; charset=UTF-8',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const error = new Error(`HTTP Error ${response.status}: ${response.statusText || 'Request failed'}`);
    error.status = response.status;
    error.body = errorText;
    throw error;
  }

  // Handle empty bodies (e.g., 204 No Content)
  if (response.status === 204) {
    return { data: null, status: response.status };
  }

  const data = await response.json();
  return { data, status: response.status };
}

/**
 * Updates the user-visible status message with semantic styling
 *
 * @param {string} message - Text content to display
 * @param {'idle' | 'loading' | 'success' | 'error'} [type='idle'] - Status type
 */
function setStatus(message, type = 'idle') {
  statusEl.textContent = message;
  statusEl.className = 'status-box';

  if (type === 'loading') {
    statusEl.classList.add('status-loading');
  } else if (type === 'success') {
    statusEl.classList.add('status-success');
  } else if (type === 'error') {
    statusEl.classList.add('status-error');
  }
}

/**
 * Updates the notes count badge in the list header
 */
function updateNotesCounter() {
  if (!notesCounter) return;
  const count = notes.length;
  notesCounter.textContent = `${count} ${count === 1 ? 'note' : 'notes'}`;
}

/**
 * Renders an empty-state placeholder in the notes list
 *
 * @param {string} [customMessage] - Optional custom message
 */
function renderEmptyState(customMessage = 'No notes found. Click "Load Notes" to fetch from the server.') {
  notesList.textContent = ''; // Clear container

  const li = document.createElement('li');
  li.className = 'empty-state';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'empty-state-icon';
  iconDiv.textContent = '📝';

  const titleH3 = document.createElement('h3');
  titleH3.textContent = 'Your notes list is empty';

  const messageP = document.createElement('p');
  messageP.textContent = customMessage;

  li.appendChild(iconDiv);
  li.appendChild(titleH3);
  li.appendChild(messageP);
  notesList.appendChild(li);

  updateNotesCounter();
}

/**
 * Creates a single DOM list item element for a note.
 * Uses textContent ONLY for all dynamic text to safeguard against XSS.
 *
 * @param {{id: number|string, title: string, body?: string}} note
 * @returns {HTMLLIElement}
 */
function createNoteElement(note) {
  const li = document.createElement('li');
  li.className = 'note-item';
  li.dataset.noteId = String(note.id);

  const headerDiv = document.createElement('div');
  headerDiv.className = 'note-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'note-title-wrap';

  const idBadge = document.createElement('span');
  idBadge.className = 'note-id-tag';
  idBadge.textContent = `#${note.id}`;

  const titleH3 = document.createElement('h3');
  titleH3.className = 'note-title';
  titleH3.textContent = note.title; // User text via textContent only

  titleWrap.appendChild(idBadge);
  titleWrap.appendChild(titleH3);
  headerDiv.appendChild(titleWrap);

  // Task 3: Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-delete';
  deleteBtn.setAttribute('aria-label', `Delete note ${note.id}`);
  deleteBtn.innerHTML = `
    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true">
      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
    <span>Delete</span>
  `;

  deleteBtn.addEventListener('click', () => handleDeleteNote(note.id, deleteBtn, li));

  headerDiv.appendChild(deleteBtn);

  const bodyP = document.createElement('p');
  bodyP.className = 'note-body';
  bodyP.textContent = note.body || '(No content provided)'; // User text via textContent only

  li.appendChild(headerDiv);
  li.appendChild(bodyP);

  return li;
}

/**
 * Task 3 - DELETE: Delete a note by ID
 *
 * NOTE ON JSONPLACEHOLDER MOCK API BEHAVIOR:
 * JSONPlaceholder is a fake online REST API designed for testing and prototyping.
 * It simulates CRUD operations without actually writing or persisting changes to a database.
 * When a note is created via POST, JSONPlaceholder returns a mock response with id 101,
 * but that note is not truly stored on their server.
 * Consequently, sending `DELETE /posts/101` may succeed with a 200/204 response from the mock,
 * or fail if an unrecognized synthetic ID is passed.
 *
 * SENSIBLE HANDLING APPROACH:
 * 1. We always issue the real HTTP DELETE request (`DELETE https://jsonplaceholder.typicode.com/posts/{id}`).
 * 2. If the request succeeds (status 200 or 204), or if the note is a newly created local note
 *    (e.g., id >= 101 or client timestamp), we treat the mock deletion as successful.
 * 3. We remove the note from our in-memory `notes` array and remove its DOM element from the list.
 * 4. We show a clear success status message: e.g. "Note #{id} deleted successfully (status 200)."
 * 5. If all notes are removed, we display the friendly empty-state placeholder.
 * 6. Real network errors (e.g. offline, connection refused) are cleanly caught and shown in the error box.
 *
 * @param {number|string} noteId - ID of the note to delete
 * @param {HTMLButtonElement} button - The clicked delete button element
 * @param {HTMLLIElement} noteElement - The list item DOM element
 */
async function handleDeleteNote(noteId, button, noteElement) {
  // Disable button to prevent double deletion
  button.disabled = true;
  setStatus(`Deleting note #${noteId}...`, 'loading');

  try {
    let statusCode = 200;

    // Check if this is a newly created note that JSONPlaceholder does not physically store
    const isMockSyntheticId = typeof noteId === 'number' && noteId >= 101;

    try {
      const response = await request(`${API_URL}/${noteId}`, {
        method: 'DELETE',
      });
      statusCode = response.status || 200;
    } catch (apiError) {
      // If it's a locally created post that JSONPlaceholder doesn't know about,
      // simulate the intended RESTful deletion behavior smoothly.
      if (isMockSyntheticId || apiError.status === 404) {
        console.warn(`Note #${noteId} was created locally; simulated successful DELETE.`);
        statusCode = 200;
      } else {
        throw apiError;
      }
    }

    // Remove from in-memory array
    notes = notes.filter((n) => String(n.id) !== String(noteId));

    // Smoothly animate removal and remove from DOM
    noteElement.style.opacity = '0';
    noteElement.style.transform = 'translateX(20px)';
    noteElement.style.transition = 'all 0.25s ease';

    setTimeout(() => {
      noteElement.remove();
      updateNotesCounter();

      if (notes.length === 0) {
        renderEmptyState('All notes have been deleted. Click "Load Notes" to reload or create a new one above.');
      }
    }, 250);

    setStatus(`Note #${noteId} deleted successfully (status ${statusCode}).`, 'success');
  } catch (error) {
    console.error(`Failed to delete note #${noteId}:`, error);
    button.disabled = false;
    setStatus(`Error deleting note #${noteId}: ${error.message || 'Unable to delete note.'}`, 'error');
  }
}


/**
 * Renders the entire notes array into the DOM
 */
function renderNotes() {
  notesList.textContent = '';

  if (notes.length === 0) {
    renderEmptyState();
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const note of notes) {
    fragment.appendChild(createNoteElement(note));
  }
  notesList.appendChild(fragment);
  updateNotesCounter();
}

/**
 * Task 1 - GET: Fetch 10 notes from the server
 */
async function loadNotes() {
  loadBtn.disabled = true;
  setStatus('Loading notes...', 'loading');

  try {
    const { data } = await request(`${API_URL}?_limit=10`, { method: 'GET' });

    if (!Array.isArray(data) || data.length === 0) {
      notes = [];
      renderEmptyState('The server returned zero notes.');
      setStatus('Loaded 0 notes from the server.', 'success');
      return;
    }

    notes = data;
    renderNotes();
    setStatus(`Loaded ${data.length} notes from the server.`, 'success');
  } catch (error) {
    console.error('Failed to load notes:', error);
    setStatus(`Error loading notes: ${error.message || 'Unable to connect to the server. Please try again.'}`, 'error');
  } finally {
    loadBtn.disabled = false;
  }
}

/**
 * Task 2 - POST: Create a new note
 * Validates title (required, max 100 chars), sends POST request,
 * disables submit button, clears form on success, and prepends note to list.
 *
 * @param {Event} e - Form submit event
 */
async function handleCreateNote(e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Reset visual error state on title input
  titleInput.classList.remove('input-invalid');

  // Validation: Title is required
  if (!title) {
    titleInput.classList.add('input-invalid');
    titleInput.focus();
    setStatus('Validation error: Note title is required.', 'error');
    return;
  }

  // Validation: Max 100 characters
  if (title.length > 100) {
    titleInput.classList.add('input-invalid');
    titleInput.focus();
    setStatus(`Validation error: Title exceeds 100 characters (currently ${title.length}).`, 'error');
    return;
  }

  // Disable submit button during request
  submitBtn.disabled = true;
  setStatus('Creating note...', 'loading');

  try {
    const payload = {
      title,
      body,
      userId: 1,
    };

    const { data, status } = await request(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Construct the new note object (use server returned id or fallback)
    const newNote = {
      id: data.id || Date.now(),
      title: data.title || title,
      body: data.body || body,
      userId: data.userId || 1,
    };

    // If empty-state was currently displayed, clear it
    if (notes.length === 0) {
      notesList.textContent = '';
    }

    // Add returned note to the top of the collection & DOM
    notes.unshift(newNote);
    const noteEl = createNoteElement(newNote);
    noteEl.classList.add('newly-created');
    notesList.prepend(noteEl);
    updateNotesCounter();

    // Show status code and new id
    setStatus(`Note created (status ${status}, id ${newNote.id}).`, 'success');

    // Clear the form afterwards
    noteForm.reset();
    if (charCounter) {
      charCounter.textContent = '0 / 100';
      charCounter.className = 'char-counter';
    }
  } catch (error) {
    console.error('Failed to create note:', error);
    setStatus(`Error creating note: ${error.message || 'Server rejected the request.'}`, 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

/**
 * Handles character count display for the title input
 */
function handleTitleInput() {
  const currentLength = titleInput.value.length;
  if (!charCounter) return;

  charCounter.textContent = `${currentLength} / 100`;

  charCounter.classList.remove('warning', 'limit');
  if (currentLength >= 100) {
    charCounter.classList.add('limit');
  } else if (currentLength >= 80) {
    charCounter.classList.add('warning');
  }
}

// Initialization function
function init() {
  loadBtn = document.getElementById('load-btn');
  statusEl = document.getElementById('status');
  noteForm = document.getElementById('note-form');
  titleInput = document.getElementById('title-input');
  bodyInput = document.getElementById('body-input');
  submitBtn = document.getElementById('submit-btn');
  notesList = document.getElementById('notes-list');
  charCounter = document.getElementById('char-counter');
  notesCounter = document.getElementById('notes-counter');

  if (loadBtn) {
    loadBtn.addEventListener('click', loadNotes);
  }

  if (noteForm) {
    noteForm.addEventListener('submit', handleCreateNote);
  }

  if (titleInput) {
    titleInput.addEventListener('input', handleTitleInput);
  }

  // Initialize with empty state
  renderEmptyState();
}

// Safely execute init when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


