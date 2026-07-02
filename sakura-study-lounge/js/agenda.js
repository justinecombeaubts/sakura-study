/**
 * Module Agenda Intelligent
 * Gère les tâches, les cours et les pièces jointes dans un calendrier hebdomadaire.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === Éléments du DOM ===
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const weekStartDateEl = document.getElementById('week-start-date');
    const weekEndDateEl = document.getElementById('week-end-date');
    const calendarDaysEl = document.getElementById('calendar-days');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addCourseBtn = document.getElementById('add-course-btn');

    // Modales
    const taskModal = document.getElementById('task-modal');
    const courseModal = document.getElementById('course-modal');
    const taskForm = document.getElementById('task-form');
    const courseForm = document.getElementById('course-form');

    // === Variables globales ===
    let currentDate = new Date();
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let courses = JSON.parse(localStorage.getItem('courses')) || [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

    // === Initialisation ===
    renderWeeklyCalendar();
    updateWeekDisplay();

    // Écouter les boutons de navigation
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeeklyCalendar();
        updateWeekDisplay();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeeklyCalendar();
        updateWeekDisplay();
    });

    // Écouter les boutons pour ajouter une tâche ou un cours
    addTaskBtn.addEventListener('click', () => openTaskModal());
    addCourseBtn.addEventListener('click', () => openCourseModal());

    // Écouter la fermeture des modales
    taskModal.querySelector('.close-modal').addEventListener('click', () => {
        taskModal.style.display = 'none';
        clearTempAttachments();
    });

    courseModal.querySelector('.close-modal').addEventListener('click', () => {
        courseModal.style.display = 'none';
    });

    // Fermer les modales en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
            clearTempAttachments();
        }
        if (e.target === courseModal) {
            courseModal.style.display = 'none';
        }
    });

    // Écouter la soumission des formulaires
    taskForm.addEventListener('submit', handleTaskSubmit);
    courseForm.addEventListener('submit', handleCourseSubmit);

    // Écouter le changement de statut pour afficher/masquer les champs de note
    document.getElementById('task-status').addEventListener('change', toggleGradeFields);

    // === Fonctions ===

    /**
     * Met à jour l'affichage de la semaine en cours.
     */
    function updateWeekDisplay() {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        weekStartDateEl.textContent = formatDate(startOfWeek);
        weekEndDateEl.textContent = formatDate(endOfWeek);
    }

    /**
     * Obtient le début de la semaine (lundi).
     * @param {Date} date - La date de référence.
     * @returns {Date} Le début de la semaine (lundi).
     */
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustement pour commencer à lundi
        return new Date(d.setDate(diff));
    }

    /**
     * Formate une date en "jj/mm/aaaa".
     * @param {Date} date - La date à formater.
     * @returns {string} La date formatée.
     */
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Formate une date en "jjj d" (ex: Lun 1).
     * @param {Date} date - La date à formater.
     * @returns {string} La date formatée.
     */
    function formatShortDate(date) {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const dayName = days[date.getDay()];
        const day = date.getDate();
        return `${dayName} ${day}`;
    }

    /**
     * Formate une heure en "hh:mm".
     * @param {string} time - L'heure à formater (ex: "09:30").
     * @returns {string} L'heure formatée.
     */
    function formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }

    /**
     * Rend le calendrier hebdomadaire.
     */
    function renderWeeklyCalendar() {
        calendarDaysEl.innerHTML = '';
        const startOfWeek = getStartOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);

            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';

            // Vérifier si c'est aujourd'hui
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dayDateNoTime = new Date(dayDate);
            dayDateNoTime.setHours(0, 0, 0, 0);

            if (dayDateNoTime.getTime() === today.getTime()) {
                dayColumn.classList.add('day-today');
            }

            // Ajouter la date
            const dayDateEl = document.createElement('div');
            dayDateEl.className = 'day-date';
            dayDateEl.textContent = dayDate.getDate();
            dayDateEl.setAttribute('data-day-name', formatShortDate(dayDate));
            dayColumn.appendChild(dayDateEl);

            // Filtrer les tâches pour ce jour
            const dayTasks = tasks.filter(task => {
                const taskStartDate = new Date(task.startDate);
                const taskEndDate = new Date(task.endDate);
                taskStartDate.setHours(0, 0, 0, 0);
                taskEndDate.setHours(0, 0, 0, 0);
                return dayDateNoTime >= taskStartDate && dayDateNoTime <= taskEndDate;
            });

            // Filtrer les cours pour ce jour
            const dayCourses = courses.filter(course => course.day === i);

            // Trier les tâches et cours par heure
            const allItems = [...dayTasks, ...dayCourses].sort((a, b) => {
                let aTime = a.startTime || '00:00';
                let bTime = b.startTime || '00:00';

                if (a.type === 'task' && !a.startTime) {
                    aTime = new Date(a.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                }
                if (b.type === 'task' && !b.startTime) {
                    bTime = new Date(b.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                }

                return aTime.localeCompare(bTime);
            });

            // Ajouter chaque tâche/cours
            allItems.forEach(item => {
                const itemEl = document.createElement('div');

                if (item.type === 'task') {
                    itemEl.className = 'task-in-day';
                    const hasAttachments = item.attachments && item.attachments.length > 0;
                    itemEl.innerHTML = `
                        <div class="task-title-display">
                            ${item.title}
                            ${hasAttachments ? '<span class="attachment-indicator" title="Pièces jointes">📎</span>' : ''}
                        </div>
                        <div class="task-time-display">
                            ${item.time ? `⏳ ${item.time} min` : ''}
                            ${item.startDate && item.endDate ? ` | 📅 ${formatDate(new Date(item.startDate))} → ${formatDate(new Date(item.endDate))}` : ''}
                        </div>
                    `;
                    itemEl.dataset.id = item.id;
                    itemEl.dataset.type = 'task';
                } else {
                    itemEl.className = 'course-in-day';
                    itemEl.style.borderLeftColor = item.color || '#ffb366';
                    itemEl.innerHTML = `
                        <div class="course-title-display">${item.title}</div>
                        <div class="course-time-display">
                            ⏰ ${formatTime(item.startTime)} - ${formatTime(item.endTime)}
                            ${item.location ? ` | 📍 ${item.location}` : ''}
                        </div>
                    `;
                    itemEl.dataset.id = item.id;
                    itemEl.dataset.type = 'course';
                }

                // Écouter le clic pour modifier ou afficher les pièces jointes
                itemEl.addEventListener('click', (e) => {
                    if (e.target.classList.contains('attachment-indicator')) {
                        const task = tasks.find(t => t.id === parseInt(itemEl.dataset.id));
                        if (task?.attachments) showTaskAttachments(task);
                        return;
                    }

                    if (item.type === 'task') {
                        const task = tasks.find(t => t.id === parseInt(itemEl.dataset.id));
                        if (task) {
                            taskForm.dataset.editId = task.id;
                            openTaskModal(task);
                        }
                    } else {
                        const course = courses.find(c => c.id === parseInt(itemEl.dataset.id));
                        if (course) {
                            courseForm.dataset.editId = course.id;
                            openCourseModal(course);
                        }
                    }
                });

                dayColumn.appendChild(itemEl);
            });

            calendarDaysEl.appendChild(dayColumn);
        }
    }

    /**
     * Affiche les pièces jointes d'une tâche dans une modale.
     * @param {Object} task - La tâche contenant les pièces jointes.
     */
    function showTaskAttachments(task) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Pièces jointes pour : ${task.title}</h3>
                <div id="modal-attachments-preview" class="attachments-preview"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Fermer la modale
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Afficher chaque pièce jointe
        const attachmentsPreview = modal.querySelector('#modal-attachments-preview');
        task.attachments.forEach(attachment => {
            const attachmentItem = createAttachmentElement(attachment);
            attachmentsPreview.appendChild(attachmentItem);

            // Écouter les boutons
            attachmentItem.querySelector('.view-attachment-btn').addEventListener('click', () => viewAttachment(attachment));
            attachmentItem.querySelector('.download-attachment-btn').addEventListener('click', () => downloadAttachment(attachment));
        });
    }

    /**
     * Crée un élément DOM pour une pièce jointe.
     * @param {Object} attachment - La pièce jointe.
     * @returns {HTMLElement} L'élément DOM.
     */
    function createAttachmentElement(attachment) {
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'attachment-item';

        // Déterminer l'icône
        let iconClass = 'default';
        if (attachment.type.startsWith('image/')) iconClass = 'image';
        else if (attachment.type === 'application/pdf') iconClass = 'pdf';
        else if (attachment.type.includes('word') || attachment.name.endsWith('.doc') || attachment.name.endsWith('.docx')) iconClass = 'word';
        else if (attachment.type.includes('excel') || attachment.name.endsWith('.xls') || attachment.name.endsWith('.xlsx')) iconClass = 'excel';
        else if (attachment.type.includes('powerpoint') || attachment.name.endsWith('.ppt') || attachment.name.endsWith('.pptx')) iconClass = 'powerpoint';
        else if (attachment.type === 'text/plain' || attachment.name.endsWith('.txt')) iconClass = 'text';

        // Formater la taille
        const sizeInKb = (attachment.size / 1024).toFixed(2);
        const sizeInMb = (attachment.size / (1024 * 1024)).toFixed(2);
        const sizeDisplay = attachment.size < 1024 ? `${attachment.size} o` :
                           attachment.size < 1024 * 1024 ? `${sizeInKb} Ko` : `${sizeInMb} Mo`;

        attachmentItem.innerHTML = `
            <div class="attachment-icon ${iconClass}"></div>
            <div class="attachment-name">${attachment.name}</div>
            <div class="attachment-size">${sizeDisplay}</div>
            <div class="attachment-actions">
                <button class="view-attachment-btn" title="Visualiser" data-id="${attachment.id}">👁️</button>
                <button class="download-attachment-btn" title="Télécharger" data-id="${attachment.id}">⬇️</button>
            </div>
        `;

        return attachmentItem;
    }

    /**
     * Ouvre la modale de tâche.
     * @param {Object|null} task - La tâche à modifier (null pour une nouvelle tâche).
     */
    function openTaskModal(task = null) {
        const modalTitle = document.getElementById('modal-title');
        const taskTitleInput = document.getElementById('task-title');
        const taskDescriptionInput = document.getElementById('task-description');
        const taskStartDateInput = document.getElementById('task-start-date');
        const taskEndDateInput = document.getElementById('task-end-date');
        const taskTimeInput = document.getElementById('task-time');
        const taskStatusSelect = document.getElementById('task-status');
        const taskGradeInput = document.getElementById('task-grade');
        const taskFeedbackInput = document.getElementById('task-feedback');
        const gradeFields = document.getElementById('grade-fields');
        const attachmentsInput = document.getElementById('task-attachments');
        const attachmentsPreview = document.getElementById('attachments-preview');

        // Réinitialiser
        attachmentsPreview.innerHTML = '';
        clearTempAttachments();
        taskForm.reset();

        if (task) {
            modalTitle.textContent = 'Modifier la tâche';
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description || '';
            taskStartDateInput.value = new Date(task.startDate).toISOString().split('T')[0];
            taskEndDateInput.value = new Date(task.endDate).toISOString().split('T')[0];
            taskTimeInput.value = task.time || '';
            taskStatusSelect.value = task.status || 'todo';
            taskGradeInput.value = task.grade || '';
            taskFeedbackInput.value = task.feedback || '';
            taskForm.dataset.editId = task.id;

            if (task.status === 'graded') gradeFields.style.display = 'block';
            else gradeFields.style.display = 'none';

            if (task.attachments && task.attachments.length > 0) {
                task.attachments.forEach(attachment => {
                    displayAttachment(attachment);
                    saveTempAttachment(attachment);
                });
            }
        } else {
            modalTitle.textContent = 'Ajouter une tâche';
            gradeFields.style.display = 'none';
            delete taskForm.dataset.editId;
        }

        // Réattacher les écouteurs
        attachmentsInput.addEventListener('change', handleFileSelection);

        // Afficher la modale
        taskModal.style.display = 'block';
    }

    /**
     * Ouvre la modale de cours.
     * @param {Object|null} course - Le cours à modifier (null pour un nouveau cours).
     */
    function openCourseModal(course = null) {
        const modalTitle = document.getElementById('course-modal-title');
        const courseTitleInput = document.getElementById('course-title');
        const courseDescriptionInput = document.getElementById('course-description');
        const courseDaySelect = document.getElementById('course-day');
        const courseStartTimeInput = document.getElementById('course-start-time');
        const courseEndTimeInput = document.getElementById('course-end-time');
        const courseLocationInput = document.getElementById('course-location');
        const courseColorInput = document.getElementById('course-color');

        if (course) {
            modalTitle.textContent = 'Modifier le cours';
            courseTitleInput.value = course.title;
            courseDescriptionInput.value = course.description || '';
            courseDaySelect.value = course.day;
            courseStartTimeInput.value = course.startTime;
            courseEndTimeInput.value = course.endTime;
            courseLocationInput.value = course.location || '';
            courseColorInput.value = course.color || '#ffb366';
            courseForm.dataset.editId = course.id;
        } else {
            modalTitle.textContent = 'Ajouter un cours';
            courseTitleInput.value = '';
            courseDescriptionInput.value = '';
            courseDaySelect.value = new Date().getDay();
            courseStartTimeInput.value = '08:00';
            courseEndTimeInput.value = '10:00';
            courseLocationInput.value = '';
            courseColorInput.value = '#ffb366';
            delete courseForm.dataset.editId;
        }

        // Afficher la modale
        courseModal.style.display = 'block';
    }

    /**
     * Bascule l'affichage des champs de note.
     */
    function toggleGradeFields(e) {
        const gradeFields = document.getElementById('grade-fields');
        gradeFields.style.display = e.target.value === 'graded' ? 'block' : 'none';
    }

    /**
     * Gère la sélection de fichiers.
     * @param {Event} e - L'événement de changement de fichier.
     */
    function handleFileSelection(e) {
        const files = Array.from(e.target.files);
        const attachmentsPreview = document.getElementById('attachments-preview');

        files.forEach(file => {
            if (file.size > MAX_FILE_SIZE) {
                alert(`Le fichier "${file.name}" est trop volumineux (max ${MAX_FILE_SIZE / (1024 * 1024)} Mo).`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const attachment = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: event.target.result,
                    lastModified: file.lastModified
                };

                displayAttachment(attachment);
                saveTempAttachment(attachment);
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    }

    /**
     * Affiche une pièce jointe dans l'aperçu.
     * @param {Object} attachment - La pièce jointe à afficher.
     */
    function displayAttachment(attachment) {
        const attachmentsPreview = document.getElementById('attachments-preview');
        const attachmentItem = createAttachmentElement(attachment);

        // Ajouter le bouton de suppression
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-attachment-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTempAttachment(attachment.id);
            attachmentItem.remove();
        });

        attachmentItem.querySelector('.attachment-actions').appendChild(deleteBtn);
        attachmentsPreview.appendChild(attachmentItem);
    }

    /**
     * Sauvegarde temporairement une pièce jointe.
     * @param {Object} attachment - La pièce jointe à sauvegarder.
     */
    function saveTempAttachment(attachment) {
        let tempAttachments = JSON.parse(sessionStorage.getItem('tempAttachments')) || [];
        tempAttachments.push(attachment);
        sessionStorage.setItem('tempAttachments', JSON.stringify(tempAttachments));
    }

    /**
     * Supprime une pièce jointe temporaire.
     * @param {string} attachmentId - L'ID de la pièce jointe à supprimer.
     */
    function deleteTempAttachment(attachmentId) {
        let tempAttachments = JSON.parse(sessionStorage.getItem('tempAttachments')) || [];
        tempAttachments = tempAttachments.filter(att => att.id !== attachmentId);
        sessionStorage.setItem('tempAttachments', JSON.stringify(tempAttachments));
    }

    /**
     * Récupère les pièces jointes temporaires.
     * @returns {Array} Les pièces jointes temporaires.
     */
    function getTempAttachments() {
        return JSON.parse(sessionStorage.getItem('tempAttachments')) || [];
    }

    /**
     * Nettoie les pièces jointes temporaires.
     */
    function clearTempAttachments() {
        sessionStorage.removeItem('tempAttachments');
    }

    /**
     * Visualise une pièce jointe.
     * @param {Object} attachment - La pièce jointe à visualiser.
     */
    function viewAttachment(attachment) {
        if (attachment.type.startsWith('image/')) {
            const imgWindow = window.open('', '_blank');
            imgWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${attachment.name}</title>
                    <style>
                        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }
                        img { max-width: 90%; max-height: 90%; }
                    </style>
                </head>
                <body>
                    <img src="${attachment.content}" alt="${attachment.name}">
                </body>
                </html>
            `);
            imgWindow.document.close();
        } else if (attachment.type === 'application/pdf') {
            const pdfWindow = window.open('', '_blank');
            pdfWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${attachment.name}</title>
                    <style>
                        body { margin: 0; }
                        embed { width: 100%; height: 100vh; }
                    </style>
                </head>
                <body>
                    <embed src="${attachment.content}" type="application/pdf">
                </body>
                </html>
            `);
            pdfWindow.document.close();
        } else {
            downloadAttachment(attachment);
        }
    }

    /**
     * Télécharge une pièce jointe.
     * @param {Object} attachment - La pièce jointe à télécharger.
     */
    function downloadAttachment(attachment) {
        const link = document.createElement('a');
        link.href = attachment.content;
        link.download = attachment.name;
        link.click();
    }

    /**
     * Gère la soumission du formulaire de tâche.
     * @param {Event} e - L'événement de soumission.
     */
    function handleTaskSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const startDate = document.getElementById('task-start-date').value;
        const endDate = document.getElementById('task-end-date').value;
        const time = document.getElementById('task-time').value;
        const status = document.getElementById('task-status').value;
        const grade = document.getElementById('task-grade').value;
        const feedback = document.getElementById('task-feedback').value;

        if (!title || !startDate || !endDate) {
            alert('Veuillez remplir les champs obligatoires (titre, date de début, date de fin).');
            return;
        }

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (startDateObj > endDateObj) {
            alert('La date de début doit être antérieure ou égale à la date de fin.');
            return;
        }

        const tempAttachments = getTempAttachments();
        const newTask = {
            id: Date.now(),
            title,
            description,
            startDate,
            endDate,
            time: time ? parseInt(time) : null,
            status,
            grade: status === 'graded' ? (grade ? parseFloat(grade) : null) : null,
            feedback: status === 'graded' ? feedback : null,
            attachments: tempAttachments.length > 0 ? tempAttachments : null,
            type: 'task',
            createdAt: new Date().toISOString()
        };

        const existingTaskId = taskForm.dataset.editId;
        if (existingTaskId) {
            const existingTask = tasks.find(t => t.id === parseInt(existingTaskId));
            if (tempAttachments.length === 0 && existingTask?.attachments) {
                newTask.attachments = existingTask.attachments;
            }
            tasks = tasks.map(t => t.id === parseInt(existingTaskId) ? newTask : t);
        } else {
            tasks.push(newTask);
        }

        saveTasks();
        renderWeeklyCalendar();
        taskModal.style.display = 'none';
        clearTempAttachments();
        taskForm.reset();
    }

    /**
     * Gère la soumission du formulaire de cours.
     * @param {Event} e - L'événement de soumission.
     */
    function handleCourseSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('course-title').value.trim();
        const description = document.getElementById('course-description').value.trim();
        const day = document.getElementById('course-day').value;
        const startTime = document.getElementById('course-start-time').value;
        const endTime = document.getElementById('course-end-time').value;
        const location = document.getElementById('course-location').value.trim();
        const color = document.getElementById('course-color').value;

        if (!title || !day || !startTime || !endTime) {
            alert('Veuillez remplir les champs obligatoires (matière, jour, heure de début, heure de fin).');
            return;
        }

        const newCourse = {
            id: Date.now(),
            title,
            description,
            day: parseInt(day),
            startTime,
            endTime,
            location,
            color,
            type: 'course',
            createdAt: new Date().toISOString()
        };

        const existingCourseId = courseForm.dataset.editId;
        if (existingCourseId) {
            courses = courses.map(c => c.id === parseInt(existingCourseId) ? newCourse : c);
        } else {
            courses.push(newCourse);
        }

        saveCourses();
        renderWeeklyCalendar();
        courseModal.style.display = 'none';
        courseForm.reset();
    }

    /**
     * Sauvegarde les tâches dans LocalStorage.
     */
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    /**
     * Sauvegarde les cours dans LocalStorage.
     */
    function saveCourses() {
        localStorage.setItem('courses', JSON.stringify(courses));
    }

    /**
     * Supprime une tâche.
     * @param {number} taskId - L'ID de la tâche à supprimer.
     */
    function deleteTask(taskId) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderWeeklyCalendar();
    }

    /**
     * Supprime un cours.
     * @param {number} courseId - L'ID du cours à supprimer.
     */
    function deleteCourse(courseId) {
        courses = courses.filter(c => c.id !== courseId);
        saveCourses();
        renderWeeklyCalendar();
    }

    // === Boutons de suppression dans les modales ===
    const deleteTaskBtn = document.createElement('button');
    deleteTaskBtn.type = 'button';
    deleteTaskBtn.textContent = '🗑️ Supprimer';
    deleteTaskBtn.className = 'submit-btn';
    deleteTaskBtn.style.background = '#ff6b6b';
    deleteTaskBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
            const taskId = taskForm.dataset.editId;
            if (taskId) {
                deleteTask(parseInt(taskId));
                taskModal.style.display = 'none';
                clearTempAttachments();
            }
        }
    });
    taskForm.appendChild(deleteTaskBtn);

    const deleteCourseBtn = document.createElement('button');
    deleteCourseBtn.type = 'button';
    deleteCourseBtn.textContent = '🗑️ Supprimer';
    deleteCourseBtn.className = 'submit-btn';
    deleteCourseBtn.style.background = '#ff6b6b';
    deleteCourseBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment supprimer ce cours ?')) {
            const courseId = courseForm.dataset.editId;
            if (courseId) {
                deleteCourse(parseInt(courseId));
                courseModal.style.display = 'none';
            }
        }
    });
    courseForm.appendChild(deleteCourseBtn);
});