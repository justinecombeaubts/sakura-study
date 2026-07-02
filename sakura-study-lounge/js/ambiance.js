document.addEventListener('DOMContentLoaded', () => {
    const toggleMusicBtn = document.getElementById('toggle-music');
    const toggleSunsetBtn = document.getElementById('toggle-sunset');
    const backgroundMusic = document.getElementById('background-music');
    const body = document.body;

    // Charger les préférences depuis le LocalStorage
    const isMusicOn = localStorage.getItem('isMusicOn') === 'true';
    const isSunsetMode = localStorage.getItem('isSunsetMode') === 'true';

    if (isMusicOn) {
        backgroundMusic.play();
        toggleMusicBtn.textContent = '🔇';
    }

    if (isSunsetMode) {
        body.classList.add('sunset-mode');
    }

    // Écouter le clic sur le bouton de musique
    toggleMusicBtn.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            toggleMusicBtn.textContent = '🔇';
            localStorage.setItem('isMusicOn', 'true');
        } else {
            backgroundMusic.pause();
            toggleMusicBtn.textContent = '🎵';
            localStorage.setItem('isMusicOn', 'false');
        }
    });

    // Écouter le clic sur le bouton de mode coucher de soleil
    toggleSunsetBtn.addEventListener('click', () => {
        body.classList.toggle('sunset-mode');
        const isSunset = body.classList.contains('sunset-mode');
        localStorage.setItem('isSunsetMode', isSunset);
    });
});