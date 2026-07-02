document.addEventListener('DOMContentLoaded', () => {
    const subjectInput = document.getElementById('subject-input');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const subjectsList = document.getElementById('subjects-list');

    // Charger les matières depuis le LocalStorage
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    renderSubjects();

    // Écouter le clic sur le bouton "Ajouter une matière"
    addSubjectBtn.addEventListener('click', addSubject);

    // Écouter la touche Entrée
    subjectInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addSubject();
    });

    // Fonction pour ajouter une matière
    function addSubject() {
        const name = subjectInput.value.trim();

        if (name === '') {
            alert('Veuillez entrer un nom de matière.');
            return;
        }

        const newSubject = {
            id: Date.now(),
            name,
            grades: [],
            createdAt: new Date().toISOString()
        };

        subjects.push(newSubject);
        saveSubjects();
        renderSubjects();
        subjectInput.value = '';
    }

    // Fonction pour rendre les matières
    function renderSubjects() {
        subjectsList.innerHTML = '';

        if (subjects.length === 0) {
            subjectsList.innerHTML = '<p>Aucune matière pour le moment. Ajoutez-en une !</p>';
            return;
        }

        subjects.forEach(subject => {
            const subjectElement = document.createElement('div');
            subjectElement.className = 'subject-card';
            subjectElement.dataset.id = subject.id;

            // Calculer la moyenne
            const average = calculateAverage(subject.grades);

            subjectElement.innerHTML = `
                <div class="subject-title">${subject.name}</div>
                <div class="subject-average">
                    ${average !== null ? `Moyenne : ${average.toFixed(2)}/20` : 'Aucune note'}
                </div>
                <div class="grade-list">
                    ${subject.grades.map(grade => `
                        <div class="grade-item">
                            <span>${grade.value}/20</span>
                            <span class="grade-date">📅 ${formatDate(grade.date)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="subject-actions">
                    <button class="add-grade-btn" title="Ajouter une note">➕</button>
                    <button class="edit-subject-btn" title="Modifier">✏️</button>
                    <button class="delete-subject-btn" title="Supprimer">🗑️</button>
                </div>
            `;

            subjectsList.appendChild(subjectElement);

            // Écouter les boutons d'action
            const addGradeBtn = subjectElement.querySelector('.add-grade-btn');
            const editSubjectBtn = subjectElement.querySelector('.edit-subject-btn');
            const deleteSubjectBtn = subjectElement.querySelector('.delete-subject-btn');

            addGradeBtn.addEventListener('click', () => {
                const gradeValue = prompt('Quelle note avez-vous obtenue ? (ex: 15.5)');
                if (gradeValue !== null) {
                    const grade = parseFloat(gradeValue);
                    if (!isNaN(grade) && grade >= 0 && grade <= 20) {
                        addGrade(subject.id, grade);
                    } else {
                        alert('Veuillez entrer une note valide entre 0 et 20.');
                    }
                }
            });

            editSubjectBtn.addEventListener('click', () => {
                const newName = prompt('Nouveau nom :', subject.name);
                if (newName !== null) {
                    updateSubject(subject.id, { name: newName || subject.name });
                }
            });

            deleteSubjectBtn.addEventListener('click', () => {
                if (confirm(`Voulez-vous vraiment supprimer la matière "${subject.name}" ?`)) {
                    deleteSubject(subject.id);
                }
            });
        });
    }

    // Fonction pour ajouter une note
    function addGrade(subjectId, gradeValue) {
        subjects = subjects.map(subject => {
            if (subject.id === subjectId) {
                const newGrade = {
                    id: Date.now(),
                    value: gradeValue,
                    date: new Date().toISOString()
                };
                return { ...subject, grades: [...subject.grades, newGrade] };
            }
            return subject;
        });
        saveSubjects();
        renderSubjects();
    }

    // Fonction pour modifier une matière
    function updateSubject(subjectId, updates) {
        subjects = subjects.map(subject => {
            if (subject.id === subjectId) {
                return { ...subject, ...updates };
            }
            return subject;
        });
        saveSubjects();
        renderSubjects();
    }

    // Fonction pour supprimer une matière
    function deleteSubject(subjectId) {
        subjects = subjects.filter(subject => subject.id !== subjectId);
        saveSubjects();
        renderSubjects();
    }

    // Fonction pour sauvegarder les matières
    function saveSubjects() {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }

    // Fonction pour calculer la moyenne
    function calculateAverage(grades) {
        if (grades.length === 0) return null;
        const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
        return sum / grades.length;
    }

    // Fonction pour formater une date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
});