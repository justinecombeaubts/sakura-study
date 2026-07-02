// ===== Navigation entre les modules =====
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const modules = document.querySelectorAll('.module');

    // Charger le module par défaut (Agenda)
    showModule('agenda');

    // Écouter les clics sur les boutons de navigation
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const moduleId = button.getAttribute('data-module');
            showModule(moduleId);

            // Mettre à jour le bouton actif
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Fonction pour afficher un module
    function showModule(moduleId) {
        modules.forEach(module => {
            module.classList.remove('active');
        });
        document.getElementById(`${moduleId}-module`).classList.add('active');
    }

    // Initialiser les mots flottants
    initFloatingWords();
});

// ===== Mots d'encouragement flottants =====
function initFloatingWords() {
    const floatingWordsContainer = document.getElementById('floating-words');
    const words = [
        "Tu peux le faire !", "Respire...", "Un pas à la fois 🌸",
        "Croire en toi, c'est déjà réussir.", "La persévérance paie.",
        "Tu es plus fort que tu ne le penses.", "🌸", "✨", "💪", "😊"
    ];

    // Créer 5 mots flottants
    for (let i = 0; i < 5; i++) {
        createFloatingWord(floatingWordsContainer, words);
    }

    // Ajouter un nouveau mot toutes les 10 secondes
    setInterval(() => {
        createFloatingWord(floatingWordsContainer, words);
    }, 10000);
}

function createFloatingWord(container, words) {
    const word = words[Math.floor(Math.random() * words.length)];
    const wordElement = document.createElement('div');
    wordElement.className = 'floating-word';
    wordElement.textContent = word;

    // Position aléatoire
    wordElement.style.left = `${Math.random() * 100}%`;
    wordElement.style.animationDuration = `${15 + Math.random() * 10}s`;
    wordElement.style.animationDelay = `${Math.random() * 5}s`;

    container.appendChild(wordElement);

    // Supprimer le mot après l'animation
    setTimeout(() => {
        wordElement.remove();
    }, 20000);
}