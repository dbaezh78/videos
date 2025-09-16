document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Selección de elementos del DOM ---
    const videoPlayer = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressBar = document.getElementById('progressBar');
    const currentTimeSpan = document.getElementById('currentTime');
    const durationSpan = document.getElementById('duration');
    const muteUnmuteBtn = document.getElementById('muteUnmuteBtn');
    const volumeBar = document.getElementById('volumeBar');
    const videoList = document.getElementById('videoList');
    const toggleListBtn = document.getElementById('toggleListBtn');
    const videoListContainer = document.querySelector('.video-list-container');

    // --- 2. Funciones de ayuda ---
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return "0:00";
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    function showErrorMessage(message) {
        if (videoList) {
            videoList.innerHTML = `<li class="error-message">${message}</li>`;
        }
    }

    // --- 3. Event Listeners para los controles del reproductor ---
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (videoPlayer && videoPlayer.paused) {
                videoPlayer.play();
                playPauseBtn.textContent = 'Pausar';
            } else if (videoPlayer) {
                videoPlayer.pause();
                playPauseBtn.textContent = 'Reproducir';
            }
        });
    }

    if (videoPlayer) {
        videoPlayer.addEventListener('timeupdate', () => {
            if (progressBar && !isNaN(videoPlayer.duration)) {
                const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
                progressBar.value = progress;
            }
            if (currentTimeSpan) {
                currentTimeSpan.textContent = formatTime(videoPlayer.currentTime);
            }
        });

        videoPlayer.addEventListener('loadedmetadata', () => {
            if (durationSpan && !isNaN(videoPlayer.duration)) {
                durationSpan.textContent = formatTime(videoPlayer.duration);
            }
        });

        // Manejo de errores de reproducción
        videoPlayer.addEventListener('error', (e) => {
            console.error('Error de reproducción:', e.message);
            alert('Error al reproducir el video. El archivo podría estar corrupto o no es compatible.');
        });
    }

    if (progressBar) {
        progressBar.addEventListener('input', () => {
            if (videoPlayer && !isNaN(videoPlayer.duration)) {
                const time = (progressBar.value / 100) * videoPlayer.duration;
                videoPlayer.currentTime = time;
            }
        });
    }

    if (muteUnmuteBtn) {
        muteUnmuteBtn.addEventListener('click', () => {
            if (videoPlayer) {
                videoPlayer.muted = !videoPlayer.muted;
                muteUnmuteBtn.textContent = videoPlayer.muted ? 'Desmutear' : 'Silenciar';
            }
        });
    }

    if (volumeBar) {
        volumeBar.addEventListener('input', () => {
            if (videoPlayer) {
                videoPlayer.volume = volumeBar.value / 100;
            }
        });
    }

    // --- 4. Lógica para mostrar/ocultar la lista ---
    if (toggleListBtn && videoListContainer) {
        toggleListBtn.addEventListener('click', () => {
            videoListContainer.classList.toggle('video-list-hidden');
            toggleListBtn.textContent = videoListContainer.classList.contains('video-list-hidden') ? 'Mostrar' : 'Ocultar';
        });
    }

    // --- 5. Cargar y mostrar la lista de videos desde la API de GitHub ---
    async function loadVideos() {
        // La URL de la API para tu repositorio 'videos'
        const apiUrl = 'https://api.github.com/repos/dbaezh78/videos/contents/';
    
        try {
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error en la API de GitHub: ${response.status} - ${errorData.message}`);
            }
    
            const data = await response.json();
    
            const videoFiles = data.filter(file => file.name.endsWith('.mp4'));
    
            if (videoFiles.length === 0) {
                showErrorMessage('No se encontraron videos en el repositorio.');
                return;
            }
    
            videoFiles.forEach(file => {
                const listItem = document.createElement('li');
                listItem.className = 'video-item';
    
                const thumbnailContainer = document.createElement('div');
                thumbnailContainer.className = 'video-thumbnail';
                const thumbnailImg = document.createElement('img');
                
                // URL para la miniatura, se busca un archivo .jpg con el mismo nombre
                const thumbnailName = file.name.replace('.mp4', '.jpg');
                thumbnailImg.src = `https://raw.githubusercontent.com/dbaezh78/videos/main/${encodeURIComponent(thumbnailName)}`;
                
                // Si la miniatura no se carga, usamos un placeholder
                thumbnailImg.onerror = () => {
                    thumbnailImg.src = 'https://via.placeholder.com/100x60.png?text=Sin+imagen'; 
                };
    
                thumbnailContainer.appendChild(thumbnailImg);
    
                const infoContainer = document.createElement('div');
                infoContainer.className = 'video-info';
                const videoTitle = document.createElement('h4');
                videoTitle.textContent = file.name.replace('.mp4', '');
                infoContainer.appendChild(videoTitle);
    
                listItem.appendChild(thumbnailContainer);
                listItem.appendChild(infoContainer);
    
                const videoUrl = `https://raw.githubusercontent.com/dbaezh78/videos/main/${encodeURIComponent(file.name)}`;
    
                listItem.addEventListener('click', () => {
                    if (videoPlayer) {
                        videoPlayer.src = videoUrl;
                        videoPlayer.load();
                        videoPlayer.play();
                        playPauseBtn.textContent = 'Pausar';
                    }
                });
    
                videoList.appendChild(listItem);
            });
    
            if (videoFiles.length > 0 && videoPlayer) {
                videoPlayer.src = `https://raw.githubusercontent.com/dbaezh78/videos/main/${encodeURIComponent(videoFiles[0].name)}`;
            }
    
        } catch (error) {
            console.error('Error al cargar la lista de videos:', error);
            showErrorMessage(`No se pudo cargar la lista de videos. Posibles causas: ${error.message}.`);
        }
    }
    
    // Iniciar la carga de videos si el contenedor de la lista existe
    if (videoList) {
        loadVideos();
    }
});