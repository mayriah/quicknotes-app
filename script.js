// ==========================================================================
// QuickNotes - Main Application Logic
// ==========================================================================

// DOM Elements Selection using querySelector
const noteForm = document.querySelector('#note-form');
const noteInput = document.querySelector('#note-input');
const noteCategory = document.querySelector('#note-category');
const notesList = document.querySelector('#notes-list');

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
}

/**
 * Handle form submission to add a note
 */
function handleAddNote(event) {
    event.preventDefault();

    const text = noteInput.value.trim();
    const category = noteCategory.value;

    const newNote = {
        id: Date.now().toString(),
        text: text,
        category: category,
        createdAt: getFormattedDate()
    };

    notes.push(newNote);
    render();

    // Clear input after adding
    noteInput.value = '';
    noteInput.focus();
}

// Event Listeners
noteForm.addEventListener('submit', handleAddNote);

// Initial render
render();
