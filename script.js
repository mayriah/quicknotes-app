// ==========================================================================
// QuickNotes - Main Application Logic
// ==========================================================================

// Storage Key
const STORAGE_KEY = 'quicknotes_notes';

// DOM Elements Selection using querySelector
const noteForm = document.querySelector('#note-form');
const noteInput = document.querySelector('#note-input');
const noteCategory = document.querySelector('#note-category');
const notesList = document.querySelector('#notes-list');
const errorMessage = document.querySelector('#error-message');
const noteCount = document.querySelector('#note-count');
const searchInput = document.querySelector('#search-input');
const clearAllBtn = document.querySelector('#clear-all-btn');

/**
 * Load notes from localStorage
 */
function loadNotesFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading notes from localStorage:', error);
        return [];
    }
}

/**
 * Save notes to localStorage
 */
function saveNotesToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
        console.error('Error saving notes to localStorage:', error);
    }
}

// In-memory notes state initialized from localStorage
let notes = loadNotesFromStorage();

/**
 * Format timestamp into human-readable date and time string
 */
function getFormattedDate() {
    const now = new Date();
    return now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

/**
 * Update the note count message according to rules:
 * - 0 notes: "You have no notes yet."
 * - 1 note: "You have 1 note."
 * - N notes: "You have N notes."
 */
function updateNoteCount(count = notes.length) {
    if (count === 0) {
        noteCount.textContent = 'You have no notes yet.';
    } else if (count === 1) {
        noteCount.textContent = 'You have 1 note.';
    } else {
        noteCount.textContent = `You have ${count} notes.`;
    }
}

/**
 * Delete a specific note by ID
 */
function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotesToStorage();
    renderFiltered();
}

/**
 * Render notes list using DOM methods (createElement and textContent)
 * Strictly avoids innerHTML for user text to ensure security
 */
function render(notesToRender = notes, isSearching = false) {
    // Clear list safely
    while (notesList.firstChild) {
        notesList.removeChild(notesList.firstChild);
    }

    // If searching and no results found
    if (isSearching && notesToRender.length === 0) {
        const noResultsItem = document.createElement('li');
        noResultsItem.className = 'no-results-msg';
        noResultsItem.textContent = 'No notes match your search.';
        notesList.appendChild(noResultsItem);
        updateNoteCount(notes.length);
        return;
    }

    notesToRender.forEach(note => {
        // Create note card container (li)
        const li = document.createElement('li');
        li.className = `note-card category-${note.category.toLowerCase()}`;
        li.dataset.id = note.id;

        // Card header (category badge + delete button)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'note-header';

        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'category-badge';
        categoryBadge.textContent = note.category;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete note: ${note.text.slice(0, 20)}`);
        deleteBtn.addEventListener('click', () => deleteNote(note.id));

        headerDiv.appendChild(categoryBadge);
        headerDiv.appendChild(deleteBtn);

        // Note content paragraph
        const textP = document.createElement('p');
        textP.className = 'note-text';
        textP.textContent = note.text;

        // Note created date
        const dateP = document.createElement('p');
        dateP.className = 'note-date';
        dateP.textContent = note.createdAt;

        // Assemble card
        li.appendChild(headerDiv);
        li.appendChild(textP);
        li.appendChild(dateP);

        notesList.appendChild(li);
    });

    updateNoteCount(notes.length);
}

/**
 * Filter and render notes based on current search input
 */
function renderFiltered() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (query === '') {
        render(notes, false);
    } else {
        const filtered = notes.filter(note => note.text.toLowerCase().includes(query));
        render(filtered, true);
    }
}

/**
 * Handle form submission with input validation
 */
function handleAddNote(event) {
    event.preventDefault();

    const rawText = noteInput.value;
    const trimmedText = rawText.trim();

    // Validation: Empty or only spaces
    if (trimmedText === '') {
        errorMessage.textContent = 'Please type a note first.';
        noteInput.focus();
        return;
    }

    // Validation: Over 200 characters
    if (trimmedText.length > 200) {
        errorMessage.textContent = 'Notes must be 200 characters or fewer.';
        noteInput.focus();
        return;
    }

    // Clear error message on valid input
    errorMessage.textContent = '';

    const newNote = {
        id: Date.now().toString(),
        text: trimmedText,
        category: noteCategory.value,
        createdAt: getFormattedDate()
    };

    notes.push(newNote);
    saveNotesToStorage();

    // Clear search filter so the newly added note is visible
    if (searchInput) {
        searchInput.value = '';
    }

    render(notes, false);

    // Clear input after adding
    noteInput.value = '';
    noteInput.focus();
}

/**
 * Bonus: Clear all notes with confirmation prompt
 */
function handleClearAll() {
    if (notes.length === 0) {
        return;
    }

    if (confirm('Delete all notes?')) {
        notes = [];
        saveNotesToStorage();
        if (searchInput) {
            searchInput.value = '';
        }
        render(notes, false);
    }
}

// Clear error message when user starts typing again
noteInput.addEventListener('input', () => {
    if (errorMessage.textContent) {
        errorMessage.textContent = '';
    }
});

// Search input event listener
if (searchInput) {
    searchInput.addEventListener('input', renderFiltered);
}

// Clear all button event listener (Bonus)
if (clearAllBtn) {
    clearAllBtn.addEventListener('click', handleClearAll);
}

// Form submit event listener
noteForm.addEventListener('submit', handleAddNote);

// Initial render from localStorage on page load
renderFiltered();
