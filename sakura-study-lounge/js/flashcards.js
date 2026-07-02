document.addEventListener('DOMContentLoaded', () => {
    const flashcardPackInput = document.getElementById('flashcard-pack-input');
    const addPackBtn = document.getElementById('add-pack-btn');
    const flashcardPacksList = document.getElementById('flashcard-packs-list');
    const flashcardViewer = document.getElementById('flashcard-viewer');

    // Charger les paquets de flashcards depuis le LocalStorage
    let flashcardPacks = JSON.parse(localStorage.getItem('flashcardPacks')) || [];
    let currentPackId = null;
    let currentFlashcardIndex = 0;

    renderFlashcardPacks();
    renderFlashcardViewer();

    // Écouter le clic sur le bouton "Ajouter un paquet"
    addPackBtn.addEventListener('click', addFlashcardPack);

    // Écouter la touche Entrée
    flashcardPackInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFlashcardPack();
    });

    // Fonction pour ajouter un paquet de flashcards
    function addFlashcardPack() {
        const name = flashcardPackInput.value.trim();

        if (name === '') {
            alert('Veuillez entrer un nom de paquet.');
            return;
        }

        const newPack = {
            id: Date.now(),
            name,
            flashcards: [],
            createdAt: new Date().toISOString()
        };

        flashcardPacks.push(newPack);
        saveFlashcardPacks();
        renderFlashcardPacks();
        flashcardPackInput.value = '';
    }

    // Fonction pour rendre les paquets de flashcards
    function renderFlashcardPacks() {
        flashcardPacksList.innerHTML = '';

        flashcardPacks.forEach(pack => {
            const packElement = document.createElement('div');
            packElement.className = 'flashcard-pack';
            packElement.dataset.id = pack.id;
            packElement.textContent = `${pack.name} (${pack.flashcards.length} cartes)`;

            // Ajouter un bouton de suppression
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.className = 'delete-pack-btn';
            deleteBtn.title = 'Supprimer le paquet';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Voulez-vous vraiment supprimer le paquet "${pack.name}" ?`)) {
                    deleteFlashcardPack(pack.id);
                }
            });

            packElement.appendChild(deleteBtn);
            flashcardPacksList.appendChild(packElement);

            // Écouter le clic sur le paquet
            packElement.addEventListener('click', () => {
                currentPackId = pack.id;
                currentFlashcardIndex = 0;
                renderFlashcardViewer();
                // Mettre en évidence le paquet sélectionné
                document.querySelectorAll('.flashcard-pack').forEach(card => {
                    card.classList.remove('active');
                });
                packElement.classList.add('active');
            });
        });
    }

    // Fonction pour rendre le visualiseur de flashcards
    function renderFlashcardViewer() {
        if (currentPackId === null) {
            flashcardViewer.innerHTML = '<p>Sélectionnez un paquet pour commencer la révision.</p>';
            return;
        }

        const currentPack = flashcardPacks.find(pack => pack.id === currentPackId);
        if (!currentPack) {
            flashcardViewer.innerHTML = '<p>Paquet introuvable.</p>';
            return;
        }

        if (currentPack.flashcards.length === 0) {
            flashcardViewer.innerHTML = `
                <p>Aucune flashcard dans ce paquet. Ajoutez-en une !</p>
                <div class="add-flashcard-form">
                    <input type="text" id="flashcard-question-input" placeholder="Question (Face A)">
                    <input type="text" id="flashcard-answer-input" placeholder="Réponse (Face B)">
                    <button id="add-flashcard-btn">➕ Ajouter la flashcard</button>
                </div>
            `;

            // Écouter le clic sur le bouton "Ajouter la flashcard"
            document.getElementById('add-flashcard-btn').addEventListener('click', () => {
                const question = document.getElementById('flashcard-question-input').value.trim();
                const answer = document.getElementById('flashcard-answer-input').value.trim();

                if (question === '' || answer === '') {
                    alert('Veuillez remplir les deux faces de la flashcard.');
                    return;
                }

                const newFlashcard = {
                    id: Date.now(),
                    question,
                    answer
                };

                currentPack.flashcards.push(newFlashcard);
                saveFlashcardPacks();
                renderFlashcardViewer();
            });
        } else {
            const currentFlashcard = currentPack.flashcards[currentFlashcardIndex];
            flashcardViewer.innerHTML = `
                <div class="add-flashcard-form">
                    <input type="text" id="flashcard-question-input" placeholder="Question (Face A)">
                    <input type="text" id="flashcard-answer-input" placeholder="Réponse (Face B)">
                    <button id="add-flashcard-btn">➕ Ajouter la flashcard</button>
                </div>
                <div class="flashcard" id="current-flashcard">
                    <div class="flashcard-content">${currentFlashcard.question}</div>
                </div>
                <div class="flashcard-controls">
                    <button id="flip-flashcard-btn">🔄 Retourner</button>
                    <button id="prev-flashcard-btn">⬅️ Précédent</button>
                    <button id="next-flashcard-btn">➡️ Suivant</button>
                </div>
                <div class="flashcard-counter">
                    ${currentFlashcardIndex + 1} / ${currentPack.flashcards.length}
                </div>
            `;

            // Écouter le clic sur le bouton "Ajouter la flashcard"
            document.getElementById('add-flashcard-btn').addEventListener('click', () => {
                const question = document.getElementById('flashcard-question-input').value.trim();
                const answer = document.getElementById('flashcard-answer-input').value.trim();

                if (question === '' || answer === '') {
                    alert('Veuillez remplir les deux faces de la flashcard.');
                    return;
                }

                const newFlashcard = {
                    id: Date.now(),
                    question,
                    answer
                };

                currentPack.flashcards.push(newFlashcard);
                saveFlashcardPacks();
                renderFlashcardViewer();
            });

            // Écouter le clic sur le bouton "Retourner"
            const flashcard = document.getElementById('current-flashcard');
            const flipBtn = document.getElementById('flip-flashcard-btn');
            let isFlipped = false;

            flipBtn.addEventListener('click', () => {
                isFlipped = !isFlipped;
                if (isFlipped) {
                    flashcard.querySelector('.flashcard-content').textContent = currentFlashcard.answer;
                    flashcard.classList.add('flipped');
                } else {
                    flashcard.querySelector('.flashcard-content').textContent = currentFlashcard.question;
                    flashcard.classList.remove('flipped');
                }
            });

            // Écouter le clic sur le bouton "Précédent"
            document.getElementById('prev-flashcard-btn').addEventListener('click', () => {
                currentFlashcardIndex = (currentFlashcardIndex - 1 + currentPack.flashcards.length) % currentPack.flashcards.length;
                renderFlashcardViewer();
            });

            // Écouter le clic sur le bouton "Suivant"
            document.getElementById('next-flashcard-btn').addEventListener('click', () => {
                currentFlashcardIndex = (currentFlashcardIndex + 1) % currentPack.flashcards.length;
                renderFlashcardViewer();
            });
        }
    }

    // Fonction pour supprimer un paquet de flashcards
    function deleteFlashcardPack(packId) {
        flashcardPacks = flashcardPacks.filter(pack => pack.id !== packId);
        saveFlashcardPacks();
        renderFlashcardPacks();

        // Réinitialiser le paquet courant
        currentPackId = null;
        currentFlashcardIndex = 0;
        renderFlashcardViewer();
    }

    // Fonction pour sauvegarder les paquets de flashcards
    function saveFlashcardPacks() {
        localStorage.setItem('flashcardPacks', JSON.stringify(flashcardPacks));
    }
});