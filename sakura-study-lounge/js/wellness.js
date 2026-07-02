document.addEventListener('DOMContentLoaded', () => {
    const moodButtons = document.querySelectorAll('.mood-btn');
    const kindnessBtn = document.getElementById('kindness-btn');
    const kindnessMessage = document.getElementById('kindness-message');
    const sakuraTree = document.getElementById('sakura-tree');

    // Charger les pétales depuis le LocalStorage
    let petals = JSON.parse(localStorage.getItem('petals')) || [];
    renderPetals();

    // Écouter les boutons du Mood Tracker
    moodButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mood = button.getAttribute('data-mood');
            localStorage.setItem('lastMood', mood);
            alert(`Votre humeur "${getMoodText(mood)}" a été enregistrée !`);
        });
    });

    // Écouter le bouton de la Boîte à Douceur
    kindnessBtn.addEventListener('click', () => {
        const messages = [
            "Tu es incroyable, continue comme ça ! 🌸",
            "N'oublie pas de prendre soin de toi. ✨",
            "Chaque petit effort compte. 💪",
            "Tu mérites le meilleur. 😊",
            "La vie est belle, et toi aussi. 🌈",
            "Un sourire peut changer ta journée. 😃",
            "Croire en toi, c'est déjà gagner. 🏆",
            "Respire, tout va bien se passer. 🌬️",
            "Tu es plus fort que tu ne le penses. 💖",
            "Aie confiance en ton parcours. 🌟"
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        kindnessMessage.textContent = randomMessage;
        kindnessMessage.style.display = 'block';
    });

    // Fonction pour ajouter un pétale
    window.addPetal = function() {
        const newPetal = {
            id: Date.now(),
            x: Math.random() * 100,
            y: Math.random() * 100
        };
        petals.push(newPetal);
        savePetals();
        renderPetals();
    };

    // Fonction pour rendre les pétales
    function renderPetals() {
        sakuraTree.innerHTML = '';

        petals.forEach(petal => {
            const petalElement = document.createElement('div');
            petalElement.className = 'petal';
            petalElement.style.left = `${petal.x}%`;
            petalElement.style.top = `${petal.y}%`;
            sakuraTree.appendChild(petalElement);
        });
    }

    // Fonction pour sauvegarder les pétales
    function savePetals() {
        localStorage.setItem('petals', JSON.stringify(petals));
    }

    // Fonction pour obtenir le texte de l'humeur
    function getMoodText(mood) {
        const moodTexts = {
            'happy': 'Heureux',
            'calm': 'Calme',
            'tired': 'Fatigué',
            'stressed': 'Stressé'
        };
        return moodTexts[mood] || mood;
    }
});