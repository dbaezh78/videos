document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Element Selection ---
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

    // --- 2. Helper Functions ---
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

    // --- 3. Player Control Event Listeners ---
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

    // --- 4. Logic to Show/Hide Video List ---
    if (toggleListBtn && videoListContainer) {
        toggleListBtn.addEventListener('click', () => {
            videoListContainer.classList.toggle('video-list-hidden');
            toggleListBtn.textContent = videoListContainer.classList.contains('video-list-hidden') ? 'Mostrar' : 'Ocultar';
        });
    }

    // --- 5. Load and Display Videos from GitHub API ---
    async function loadVideos() {
        const apiUrl = 'https://api.github.com/repos/dbaezh78/videos/contents/videos';


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
    
            const thumbnailPromises = videoFiles.map(file => generateThumbnail(file));
            const videoItemsWithThumbnails = await Promise.all(thumbnailPromises);

            videoItemsWithThumbnails.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = 'video-item';
    
                const thumbnailContainer = document.createElement('div');
                thumbnailContainer.className = 'video-thumbnail';
                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = item.thumbnailUrl;
                thumbnailContainer.appendChild(thumbnailImg);
    
                const infoContainer = document.createElement('div');
                infoContainer.className = 'video-info';
                const videoTitle = document.createElement('h4');
                videoTitle.textContent = item.file.name.replace('.mp4', '');
                infoContainer.appendChild(videoTitle);
    
                listItem.appendChild(thumbnailContainer);
                listItem.appendChild(infoContainer);
    
                listItem.addEventListener('click', () => {
                    if (videoPlayer) {
                        videoPlayer.src = item.videoUrl;
                        videoPlayer.load();
                        videoPlayer.play();
                        playPauseBtn.textContent = 'Pausar';
                    }
                });
    
                videoList.appendChild(listItem);
            });
    
            if (videoItemsWithThumbnails.length > 0 && videoPlayer) {
                videoPlayer.src = videoItemsWithThumbnails[0].videoUrl;
            }
    
        } catch (error) {
            console.error('Error al cargar la lista de videos:', error);
            showErrorMessage(`No se pudo cargar la lista de videos. Posibles causas: ${error.message}.`);
        }
    }
    
    // --- 6. Function to Generate Thumbnails from the Video ---
    function generateThumbnail(file) {
        return new Promise((resolve) => {
            const videoUrl = `https://raw.githubusercontent.com/dbaezh78/videos/main/videos/${encodeURIComponent(file.name)}`;
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = "anonymous";
            video.preload = "metadata";

            video.addEventListener('loadedmetadata', () => {
                video.currentTime = 20; // Capture a frame at 20 seconds
            });

            video.addEventListener('seeked', () => {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 60;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnailUrl = canvas.toDataURL('image/jpeg');
                resolve({ file, thumbnailUrl, videoUrl });
                video.remove();
            });

            video.addEventListener('error', () => {
                const thumbnailUrl = 'https://placehold.co/100x60?text=Error';
                resolve({ file, thumbnailUrl, videoUrl });
                video.remove();
            });
        });
    }

    if (videoList) {
        loadVideos();
    }
});