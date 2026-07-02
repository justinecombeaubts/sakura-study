/**
 * Module Espace Cours & Fiches de Notes
 * Gère la création, l'édition et la personnalisation des notes.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === Éléments du DOM ===
    const folderInput = document.getElementById('folder-input');
    const addFolderBtn = document.getElementById('add-folder-btn');
    const foldersList = document.getElementById('folders-list');
    const notesContainer = document.getElementById('notes-container');
    const noteToolbar = document.getElementById('note-toolbar');

    // Éléments de la barre d'outils
    const fontSelector = document.getElementById('font-selector');
    const fontSizeSelector = document.getElementById('font-size-selector');
    const textColorPicker = document.getElementById('text-color-picker');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const underlineBtn = document.getElementById('underline-btn');
    const alignLeftBtn = document.getElementById('align-left-btn');
    const alignCenterBtn = document.getElementById('align-center-btn');
    const alignRightBtn = document.getElementById('align-right-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');

    // === Variables globales ===
    let folders = JSON.parse(localStorage.getItem('folders')) || [];
    let currentFolderId = null;
    let currentNoteId = null;
    let currentNoteElement = null;

    // === Initialisation ===
    renderFolders();
    renderNotes();

    // === Écouteurs d'événements ===
    addFolderBtn.addEventListener('click', addFolder);
    folderInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFolder();
    });

    // Écouteurs de la barre d'outils
    fontSelector.addEventListener('change', () => applyStyleToNote('fontFamily', fontSelector.value));
    fontSizeSelector.addEventListener('change', () => applyStyleToNote('fontSize', fontSizeSelector.value));
    textColorPicker.addEventListener('input', () => applyStyleToNote('color', textColorPicker.value));
    bgColorPicker.addEventListener('input', () => applyStyleToNote('backgroundColor', bgColorPicker.value));

    boldBtn.addEventListener('click', () => toggleTextStyle('bold'));
    italicBtn.addEventListener('click', () => toggleTextStyle('italic'));
    underlineBtn.addEventListener('click', () => toggleTextStyle('underline'));

    alignLeftBtn.addEventListener('click', () => applyAlignment('left'));
    alignCenterBtn.addEventListener('click', () => applyAlignment('center'));
    alignRightBtn.addEventListener('click', () => applyAlignment('right'));

    saveNoteBtn.addEventListener('click', saveCurrentNote);

    // === Fonctions ===

    /**
     * Ajoute un nouveau dossier.
     */
    function addFolder() {
        const name = folderInput.value.trim();
        if (!name) {
            alert('Veuillez entrer un nom de dossier.');
            return;
        }

        const newFolder = {
            id: Date.now(),
            name,
            createdAt: new Date().toISOString()
        };

        folders.push(newFolder);
        saveFolders();
        renderFolders();
        folderInput.value = '';
        currentFolderId = newFolder.id;
        renderNotes();
    }

    /**
     * Rend les dossiers dans la liste.
     */
    function renderFolders() {
        foldersList.innerHTML = '';
        folders.forEach(folder => {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder-card';
            folderElement.dataset.id = folder.id;
            folderElement.textContent = folder.name;

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.className = 'delete-folder-btn';
            deleteBtn.title = 'Supprimer le dossier';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Voulez-vous vraiment supprimer le dossier "${folder.name}" ?`)) {
                    deleteFolder(folder.id);
                }
            });

            folderElement.appendChild(deleteBtn);
            foldersList.appendChild(folderElement);

            folderElement.addEventListener('click', () => {
                currentFolderId = folder.id;
                currentNoteId = null;
                currentNoteElement = null;
                renderNotes();
                updateToolbarVisibility();
                document.querySelectorAll('.folder-card').forEach(card => card.classList.remove('active'));
                folderElement.classList.add('active');
            });
        });
    }

    /**
     * Rend les notes dans le conteneur.
     */
    function renderNotes() {
        notesContainer.innerHTML = '';

        if (!currentFolderId) {
            notesContainer.innerHTML = '<p>Sélectionnez un dossier pour voir ses notes.</p>';
            noteToolbar.style.display = 'none';
            return;
        }

        const currentFolder = folders.find(folder => folder.id === currentFolderId);
        if (!currentFolder) {
            notesContainer.innerHTML = '<p>Dossier introuvable.</p>';
            noteToolbar.style.display = 'none';
            return;
        }

        const folderNotes = JSON.parse(localStorage.getItem(`notes-${currentFolderId}`)) || [];

        // Ajouter le formulaire pour une nouvelle note
        notesContainer.innerHTML = `
            <div class="add-note-form">
                <input type="text" id="note-title-input" placeholder="Titre de la note">
                <button id="add-note-btn">➕ Ajouter la note</button>
            </div>
            <div class="notes-grid"></div>
        `;

        const notesGrid = notesContainer.querySelector('.notes-grid');
        const addNoteBtn = document.getElementById('add-note-btn');
        const noteTitleInput = document.getElementById('note-title-input');

        addNoteBtn.addEventListener('click', () => {
            const title = noteTitleInput.value.trim();
            if (!title) {
                alert('Veuillez entrer un titre pour la note.');
                return;
            }

            const newNote = {
                id: Date.now(),
                title,
                content: '',
                styles: {
                    fontFamily: 'Comfortaa',
                    fontSize: '16px',
                    color: '#3a3a3a',
                    backgroundColor: '#ffffff',
                    textAlign: 'left',
                    isBold: false,
                    isItalic: false,
                    isUnderline: false
                },
                createdAt: new Date().toISOString()
            };

            folderNotes.push(newNote);
            saveNotes(currentFolderId, folderNotes);
            currentNoteId = newNote.id;
            renderNotes();
            selectNote(newNote.id);
        });

        noteTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNoteBtn.click();
        });

        // Rendre les notes existantes
        if (folderNotes.length === 0) {
            notesContainer.querySelector('.notes-grid').innerHTML = '<p>Aucune note dans ce dossier.</p>';
        } else {
            folderNotes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-card';
                noteElement.dataset.id = note.id;

                // Appliquer les styles
                noteElement.style.fontFamily = note.styles.fontFamily;
                noteElement.style.fontSize = note.styles.fontSize;
                noteElement.style.color = note.styles.color;
                noteElement.style.backgroundColor = note.styles.backgroundColor;
                noteElement.style.textAlign = note.styles.textAlign;

                if (note.styles.isBold) noteElement.classList.add('bold');
                if (note.styles.isItalic) noteElement.classList.add('italic');
                if (note.styles.isUnderline) noteElement.classList.add('underline');

                noteElement.innerHTML = `
                    <div class="note-title" contenteditable="true" style="
                        font-family: ${note.styles.fontFamily};
                        font-size: ${note.styles.fontSize};
                        color: ${note.styles.color};
                        text-align: ${note.styles.textAlign};
                        ${note.styles.isBold ? 'font-weight: bold;' : ''}
                        ${note.styles.isItalic ? 'font-style: italic;' : ''}
                        ${note.styles.isUnderline ? 'text-decoration: underline;' : ''}
                    ">${note.title}</div>
                    <div class="note-content" contenteditable="true" style="
                        font-family: ${note.styles.fontFamily};
                        font-size: ${note.styles.fontSize};
                        color: ${note.styles.color};
                        background-color: ${note.styles.backgroundColor};
                        text-align: ${note.styles.textAlign};
                        ${note.styles.isBold ? 'font-weight: bold;' : ''}
                        ${note.styles.isItalic ? 'font-style: italic;' : ''}
                        ${note.styles.isUnderline ? 'text-decoration: underline;' : ''}
                    ">${note.content}</div>
                    <div class="note-meta">📅 ${formatDate(note.createdAt)}</div>
                    <div class="note-actions">
                        <button class="delete-note-btn" title="Supprimer">🗑️</button>
                    </div>
                `;

                notesGrid.appendChild(noteElement);

                // Écouter le clic sur la note
                noteElement.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-note-btn')) return;
                    selectNote(note.id);
                });

                // Écouter les modifications du titre et du contenu
                const titleEditable = noteElement.querySelector('.note-title');
                const contentEditable = noteElement.querySelector('.note-content');

                titleEditable.addEventListener('input', () => {
                    updateNoteField(currentFolderId, note.id, 'title', titleEditable.innerHTML);
                });

                contentEditable.addEventListener('input', () => {
                    updateNoteField(currentFolderId, note.id, 'content', contentEditable.innerHTML);
                });

                // Écouter le bouton de suppression
                noteElement.querySelector('.delete-note-btn').addEventListener('click', () => {
                    if (confirm('Voulez-vous vraiment supprimer cette note ?')) {
                        deleteNote(currentFolderId, note.id);
                    }
                });
            });
        }
    }

    /**
     * Sélectionne une note et met à jour la barre d'outils.
     * @param {number} noteId - L'ID de la note à sélectionner.
     */
    function selectNote(noteId) {
        if (!currentFolderId) return;

        currentNoteId = noteId;
        const folderNotes = JSON.parse(localStorage.getItem(`notes-${currentFolderId}`)) || [];
        const selectedNote = folderNotes.find(note => note.id === noteId);
        if (!selectedNote) return;

        currentNoteElement = document.querySelector(`.note-card[data-id="${noteId}"]`);

        // Mettre à jour la barre d'outils
        fontSelector.value = selectedNote.styles.fontFamily;
        fontSizeSelector.value = selectedNote.styles.fontSize;
        textColorPicker.value = selectedNote.styles.color;
        bgColorPicker.value = selectedNote.styles.backgroundColor;

        // Mettre à jour les boutons de style
        boldBtn.classList.toggle('active', selectedNote.styles.isBold);
        italicBtn.classList.toggle('active', selectedNote.styles.isItalic);
        underlineBtn.classList.toggle('active', selectedNote.styles.isUnderline);

        // Mettre à jour les boutons d'alignement
        alignLeftBtn.classList.toggle('active', selectedNote.styles.textAlign === 'left');
        alignCenterBtn.classList.toggle('active', selectedNote.styles.textAlign === 'center');
        alignRightBtn.classList.toggle('active', selectedNote.styles.textAlign === 'right');

        // Mettre en évidence la note sélectionnée
        document.querySelectorAll('.note-card').forEach(card => card.classList.remove('selected'));
        currentNoteElement.classList.add('selected');

        // Afficher la barre d'outils
        noteToolbar.style.display = 'flex';
    }

    /**
     * Met à jour la visibilité de la barre d'outils.
     */
    function updateToolbarVisibility() {
        if (!currentNoteId) {
            noteToolbar.style.display = 'none';
        }
    }

    /**
     * Applique un style à la note sélectionnée.
     * @param {string} property - La propriété CSS à appliquer.
     * @param {string} value - La valeur à appliquer.
     */
    function applyStyleToNote(property, value) {
        if (!currentNoteId || !currentFolderId) return;

        const folderNotes = JSON.parse(localStorage.getItem(`notes-${currentFolderId}`)) || [];
        const updatedNotes = folderNotes.map(note => {
            if (note.id === currentNoteId) {
                const newStyles = { ...note.styles, [property]: value };
                return { ...note, styles: newStyles };
            }
            return note;
        });

        saveNotes(currentFolderId, updatedNotes);
        renderNotes();
        selectNote(currentNoteId);
    }

    /**
     * Bascule un style de texte (gras, italique, souligné).
     * @param {string} style - Le style à basculer ('bold', 'italic', 'underline').
     */
    function toggleTextStyle(style) {
        if (!currentNoteId || !currentFolderId) return;

        const folderNotes = JSON.parse(localStorage.getItem(`notes-${currentFolderId}`)) || [];
        const updatedNotes = folderNotes.map(note => {
            if (note.id === currentNoteId) {
                const newStyles = { ...note.styles };
                newStyles[`is${style.charAt(0).toUpperCase() + style.slice(1)}`] = !newStyles[`is${style.charAt(0).toUpperCase() + style.slice(1)}`];
                return { ...note, styles: newStyles };
            }
            return note;
        });

        saveNotes(currentFolderId, updatedNotes);
        renderNotes();
        selectNote(currentNoteId);
    }

    /**
     * Applique un alignement à la note sélectionnée.
     * @param {string} align - L'alignement ('left', 'center', 'right').
     */
    function applyAlignment(align) {
        applyStyleToNote('textAlign', align);
    }

    /**
     * Sauvegarde la note actuelle (bouton "Enregistrer").
     */
    function saveCurrentNote() {
        if (!currentNoteId || !currentFolderId) return;

        const noteElement = currentNoteElement;
        if (!noteElement) return;

        const title = noteElement.querySelector('.note-title').innerHTML;
        const content = noteElement.querySelector('.note-content').innerHTML;

        const folderNotes = JSON.parse(localStorage.getItem(`notes-${currentFolderId}`)) || [];
        const updatedNotes = folderNotes.map(note => {
            if (note.id === currentNoteId) {
                return { ...note, title, content };
            }
            return note;
        });

        saveNotes(currentFolderId, updatedNotes);
        alert('Note enregistrée avec succès ! ✨');
    }

    /**
     * Met à jour un champ spécifique d'une note.
     * @param {number} folderId - L'ID du dossier.
     * @param {number} noteId - L'ID de la note.
     * @param {string} field - Le champ à mettre à jour ('title' ou 'content').
     * @param {string} value - La nouvelle valeur.
     */
    function updateNoteField(folderId, noteId, field, value) {
        const folderNotes = JSON.parse(localStorage.getItem(`notes-${folderId}`)) || [];
        const updatedNotes = folderNotes.map(note => {
            if (note.id === noteId) {
                return { ...note, [field]: value };
            }
            return note;
        });
        saveNotes(folderId, updatedNotes);
    }

    /**
     * Supprime un dossier.
     * @param {number} folderId - L'ID du dossier à supprimer.
     */
    function deleteFolder(folderId) {
        localStorage.removeItem(`notes-${folderId}`);
        folders = folders.filter(folder => folder.id !== folderId);
        saveFolders();
        renderFolders();

        if (currentFolderId === folderId) {
            currentFolderId = null;
            currentNoteId = null;
            renderNotes();
            noteToolbar.style.display = 'none';
        }
    }

    /**
     * Supprime une note.
     * @param {number} folderId - L'ID du dossier.
     * @param {number} noteId - L'ID de la note à supprimer.
     */
    function deleteNote(folderId, noteId) {
        const folderNotes = JSON.parse(localStorage.getItem(`notes-${folderId}`)) || [];
        const updatedNotes = folderNotes.filter(note => note.id !== noteId);
        saveNotes(folderId, updatedNotes);
        renderNotes();

        if (currentNoteId === noteId) {
            currentNoteId = null;
            currentNoteElement = null;
            noteToolbar.style.display = 'none';
        }
    }

    /**
     * Sauvegarde les dossiers dans LocalStorage.
     */
    function saveFolders() {
        localStorage.setItem('folders', JSON.stringify(folders));
    }

    /**
     * Sauvegarde les notes d'un dossier dans LocalStorage.
     * @param {number} folderId - L'ID du dossier.
     * @param {Array} notes - Les notes à sauvegarder.
     */
    function saveNotes(folderId, notes) {
        localStorage.setItem(`notes-${folderId}`, JSON.stringify(notes));
    }

    /**
     * Formate une date en "jj/mm/aaaa".
     * @param {string} dateString - La date à formater.
     * @returns {string} La date formatée.
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
});