document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Selección de elementos del DOM ---
    const videoPlayer = document.getElementById('videoPlayer');
    const videoList = document.getElementById('videoList');
    const toggleListBtn = document.getElementById('toggleListBtn');
    const videoListContainer = document.querySelector('.video-list-container');
    const searchInput = document.getElementById('searchInput');

    let allVideoItems = []; // Para guardar todos los videos cargados

    // --- 2. Funciones de ayuda ---
    function showErrorMessage(message) {
        if (videoList) {
            videoList.innerHTML = `<li class="error-message">${message}</li>`;
        }
    }

    // --- 3. Lógica para mostrar/ocultar la lista ---
    if (toggleListBtn && videoListContainer) {
        toggleListBtn.addEventListener('click', () => {
            videoListContainer.classList.toggle('video-list-hidden');
            toggleListBtn.textContent = videoListContainer.classList.contains('video-list-hidden') ? 'Mostrar lista' : 'Ocultar lista';
        });
    }

    // --- 4. Cargar y mostrar la lista de videos desde la API de GitHub ---
    async function loadVideos() {
        const apiUrl = 'https://api.github.com/repos/dbaezh78/videos/contents/videos';

        // Para evitar el límite de peticiones de GitHub, puedes usar un Personal Access Token (PAT).
        // 1. Ve a GitHub > Settings > Developer settings > Personal access tokens.
        // 2. Genera un nuevo token con permisos de 'repo'.
        // 3. Pega tu token en la variable de abajo.
        const githubToken = 'TU_TOKEN_AQUÍ'; // <--- REEMPLAZA ESTO CON TU TOKEN

        const headers = githubToken ? { 'Authorization': `token ${githubToken}` } : {};

        try {
            const response = await fetch(apiUrl, { headers: headers });
            
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
                listItem.dataset.videoUrl = item.videoUrl;
    
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
                        videoPlayer.play();
                    }
                });
    
                videoList.appendChild(listItem);
            });

            allVideoItems = Array.from(videoList.querySelectorAll('.video-item'));
    
            if (videoItemsWithThumbnails.length > 0 && videoPlayer) {
                videoPlayer.src = videoItemsWithThumbnails[0].videoUrl;
            }

            // --- Lógica para pasar al siguiente video automáticamente ---
            videoPlayer.addEventListener('ended', () => {
                const currentVideoUrl = videoPlayer.src;
                const currentIndex = allVideoItems.findIndex(item => item.dataset.videoUrl === currentVideoUrl);
                
                if (currentIndex !== -1 && currentIndex < allVideoItems.length - 1) {
                    const nextVideoItem = allVideoItems[currentIndex + 1];
                    const nextVideoUrl = nextVideoItem.dataset.videoUrl;
                    videoPlayer.src = nextVideoUrl;
                    videoPlayer.play();
                }
            });

            // --- Lógica del buscador ---
            if (searchInput) {
                searchInput.addEventListener('input', (event) => {
                    const searchTerm = event.target.value.toLowerCase();
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
    
        } catch (error) {
            console.error('Error al cargar la lista de videos:', error);
            showErrorMessage(`No se pudo cargar la lista de videos. Posibles causas: ${error.message}.`);
        }
    }
    
    // --- 5. Función para generar miniaturas desde el video ---
    function generateThumbnail(file) {
        return new Promise((resolve) => {
            const videoUrl = `https://raw.githubusercontent.com/dbaezh78/videos/main/videos/${encodeURIComponent(file.name)}`;
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = "anonymous";
            video.preload = "metadata";

            video.addEventListener('loadedmetadata', () => {
                video.currentTime = 15;
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