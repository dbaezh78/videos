document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Selección de elementos del DOM ---
    const videoPlayer = document.getElementById('videoPlayer');
    const videoList = document.getElementById('videoList');
    const toggleListBtn = document.getElementById('toggleListBtn');
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    const videoListContainer = document.querySelector('.video-list-container');
    const searchInput = document.getElementById('searchInput');
    const clearIcon = document.querySelector('.clear-icon');
    const body = document.body;

    let allVideoItems = [];
    const LENG_ICON_URL = 'src/lenglish.png';

    // --- 2. URL de la API de GitHub para la carpeta de videos ---
    const apiUrl = 'https://api.github.com/repos/dbaezh78/videos/contents/videos';
    
    // --- 3. Funciones de ayuda ---
    function showErrorMessage(message) {
        if (videoList) {
            videoList.innerHTML = `<li class="error-message">${message}</li>`;
        }
    }
    
    function updateActiveVideo(url) {
        allVideoItems.forEach(item => {
            item.classList.remove('active-video');
        });

        const currentItem = allVideoItems.find(item => item.dataset.videoUrl === url);
        if (currentItem) {
            currentItem.classList.add('active-video');
        }
    }

    function saveVideoProgress(url, time) {
        localStorage.setItem(`videoProgress_${url}`, time);
    }

    function getVideoProgress(url) {
        return parseFloat(localStorage.getItem(`videoProgress_${url}`)) || 0;
    }

    function markVideoAsPlayed(url) {
        localStorage.setItem(`videoPlayed_${url}`, 'true');
        const item = allVideoItems.find(item => item.dataset.videoUrl === url);
        if (item) {
            item.classList.add('video-played');
        }
    }

    function isVideoPlayed(url) {
        return localStorage.getItem(`videoPlayed_${url}`) === 'true';
    }

    // --- 4. Lógica para mostrar/ocultar la lista ---
    if (toggleListBtn && videoListContainer) {
        toggleListBtn.addEventListener('click', () => {
            videoListContainer.classList.toggle('video-list-hidden');
            toggleListBtn.textContent = videoListContainer.classList.contains('video-list-hidden') ? 'Mostrar lista' : 'Ocultar lista';
        });
    }

    // --- 5. Lógica del buscador ---
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            if (clearIcon) {
                clearIcon.style.display = searchTerm.length > 0 ? 'block' : 'none';
            }
            allVideoItems.forEach(item => {
                const videoTitle = item.querySelector('h4').textContent.toLowerCase();
                if (videoTitle.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    if (clearIcon) {
        clearIcon.addEventListener('click', () => {
            searchInput.value = '';
            clearIcon.style.display = 'none';
            allVideoItems.forEach(item => {
                item.style.display = 'flex';
            });
        });
    }

    // --- 6. Lógica de cambio de tema ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.classList.add(savedTheme + '-theme');
    toggleThemeBtn.textContent = (savedTheme === 'dark') ? 'Tema Claro' : 'Tema Oscuro';

    toggleThemeBtn.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            toggleThemeBtn.textContent = 'Tema Oscuro';
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            toggleThemeBtn.textContent = 'Tema Claro';
        }
    });

    // --- 7. Función principal para cargar videos desde la API de GitHub ---
    async function loadVideosFromGitHub() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Error al obtener la lista de videos: ${response.statusText}`);
            }
            const data = await response.json();
            
            const videoFiles = data.filter(file => {
                const extension = file.name.split('.').pop().toLowerCase();
                return ['mp4', 'mov', 'avi', 'mkv', 'mp3'].includes(extension);
            });

            if (videoFiles.length === 0) {
                showErrorMessage('No se encontraron videos en el repositorio de GitHub.');
                return;
            }

            videoList.innerHTML = '';
            allVideoItems = [];
            let loadedCount = 0;

            for (const file of videoFiles) {
                const videoUrl = `https://raw.githubusercontent.com/dbaezh78/videos/main/videos/${encodeURIComponent(file.name)}`;
                
                const li = document.createElement('li');
                li.classList.add('video-item');
                li.dataset.videoUrl = videoUrl;

                const videoNumberDiv = document.createElement('div');
                videoNumberDiv.classList.add('video-number');
                videoNumberDiv.textContent = `${loadedCount + 1}`;
                
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.classList.add('video-thumbnail');
                thumbnailDiv.innerHTML = `<img src="${LENG_ICON_URL}" alt="Video Icon">`;

                const videoInfoDiv = document.createElement('div');
                videoInfoDiv.classList.add('video-info');
                const videoTitle = file.name.replace(/\.(mp4|mov|avi|mkv|mp3)$/i, '');
                videoInfoDiv.innerHTML = `<h4>${videoTitle}</h4>`;
                
                li.appendChild(videoNumberDiv);
                li.appendChild(thumbnailDiv);
                li.appendChild(videoInfoDiv);
                
                li.addEventListener('click', () => {
                    videoPlayer.src = videoUrl;
                    videoPlayer.currentTime = getVideoProgress(videoUrl);
                    videoPlayer.play();
                    updateActiveVideo(videoUrl);
                });
                
                if (isVideoPlayed(videoUrl)) {
                    li.classList.add('video-played');
                }

                videoList.appendChild(li);
                allVideoItems.push(li);

                loadedCount++;
            }
            
            if (allVideoItems.length > 0) {
                allVideoItems[0].click();
            }

        } catch (error) {
            showErrorMessage(`Error al cargar la lista de videos: ${error.message}.`);
            console.error('Error al cargar la lista de videos:', error);
        }
    }

    // --- 8. Eventos del reproductor de video ---
    videoPlayer.addEventListener('timeupdate', () => {
        saveVideoProgress(videoPlayer.src, videoPlayer.currentTime);
        if (videoPlayer.duration && videoPlayer.currentTime / videoPlayer.duration > 0.9) {
            markVideoAsPlayed(videoPlayer.src);
        }
    });

    videoPlayer.addEventListener('ended', () => {
        markVideoAsPlayed(videoPlayer.src);
        const currentVideoUrl = videoPlayer.src;
        const currentIndex = allVideoItems.findIndex(item => item.dataset.videoUrl === currentVideoUrl);
        
        if (currentIndex !== -1 && currentIndex < allVideoItems.length - 1) {
            const nextVideoItem = allVideoItems[currentIndex + 1];
            const nextVideoUrl = nextVideoItem.dataset.videoUrl;
            videoPlayer.src = nextVideoUrl;
            videoPlayer.currentTime = getVideoProgress(nextVideoUrl);
            videoPlayer.play();
            updateActiveVideo(nextVideoUrl);
        }
    });

    videoPlayer.addEventListener('playing', () => {
        updateActiveVideo(videoPlayer.src);
    });

    loadVideosFromGitHub();
});