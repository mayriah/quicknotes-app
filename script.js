// ==========================================================================
// QuickNotes - Main Application Logic
// ==========================================================================

// DOM Elements Selection using querySelector
const noteForm = document.querySelector('#note-form');
const noteInput = document.querySelector('#note-input');
const noteCategory = document.querySelector('#note-category');
const notesList = document.querySelector('#notes-list');
const errorMessage = document.querySelector('#error-message');
const noteCount = document.querySelector('#note-count');

// In-memory notes state
let notes = [];

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
    render();
}

/**
 * Render notes list using DOM methods (createElement and textContent)
 * Strictly avoids innerHTML for user text to ensure security
 */
function render(notesToRender = notes) {
    // Clear list safely
    while (notesList.firstChild) {
        notesList.removeChild(notesList.firstChild);
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
    render();

    // Clear input after adding
    noteInput.value = '';
    noteInput.focus();
}

// Clear error message when user starts typing again
noteInput.addEventListener('input', () => {
    if (errorMessage.textContent) {
        errorMessage.textContent = '';
    }
});

// Event Listeners
noteForm.addEventListener('submit', handleAddNote);

// Initial render & count update
render();
