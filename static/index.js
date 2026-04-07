document.addEventListener("DOMContentLoaded", () => {
    const fetchForm = document.getElementById('fetchForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const fetchBtn = document.getElementById('fetchBtn');
    const loader = document.getElementById('loader');
    const previewCard = document.getElementById('previewCard');
    const errorAlert = document.getElementById('errorAlert');
    const errorText = document.getElementById('errorText');

    fetchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = videoUrlInput.value.trim();
        if (!url) return;

        // Reset UI
        errorAlert.classList.add('d-none');
        previewCard.classList.add('d-none');
        loader.classList.remove('d-none');
        fetchBtn.disabled = true;

        try {
            const response = await fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch video information.');
            }

            populatePreview(data);

            loader.classList.add('d-none');
            previewCard.classList.remove('d-none');
            
        } catch (error) {
            loader.classList.add('d-none');
            errorText.textContent = error.message;
            errorAlert.classList.remove('d-none');
        } finally {
            fetchBtn.disabled = false;
        }
    });

    function formatDuration(seconds) {
        if (!seconds) return '';
        // Convert to Number
        seconds = Number(seconds);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function formatSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    function populatePreview(data) {
        document.getElementById('videoThumbnail').src = data.thumbnail;
        document.getElementById('videoTitle').textContent = data.title;
        document.getElementById('videoUploader').textContent = data.uploader || 'Unknown';
        document.getElementById('videoDuration').textContent = formatDuration(data.duration);

        const videoContainer = document.getElementById('videoOptions');
        const audioContainer = document.getElementById('audioOptions');
        
        videoContainer.innerHTML = '';
        audioContainer.innerHTML = '';

        if (data.videos && data.videos.length > 0) {
            data.videos.forEach(v => {
                videoContainer.appendChild(createDownloadOption(v, 'video'));
            });
        } else {
            videoContainer.innerHTML = '<p class="text-muted text-center py-3">No video formats found.</p>';
        }

        if (data.audios && data.audios.length > 0) {
            data.audios.forEach(a => {
                audioContainer.appendChild(createDownloadOption(a, 'audio'));
            });
        } else {
            audioContainer.innerHTML = '<p class="text-muted text-center py-3">No audio formats found.</p>';
        }
    }

    function createDownloadOption(item, type) {
        const div = document.createElement('div');
        div.className = 'dl-option';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'd-flex flex-column';
        
        const qualitySpan = document.createElement('span');
        qualitySpan.className = 'fw-bold';
        
        // Sometimes format note has the resolution, fallback to something else
        let qText = type === 'video' ? `Resolution: ${item.quality || 'Auto'}` : `Quality: ${item.quality || 'Standard'}`;
        qText += ` (${item.ext})`;
        qualitySpan.textContent = qText;
        
        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'text-muted small';
        sizeSpan.textContent = formatSize(item.filesize);

        infoDiv.appendChild(qualitySpan);
        infoDiv.appendChild(sizeSpan);

        const dlBtn = document.createElement('button');
        dlBtn.className = 'dl-btn';
        dlBtn.innerHTML = `<i class="bi bi-download dl-icon"></i> <span>Download</span>`;
        
        dlBtn.addEventListener('click', () => {
            triggerDownloadAnimation(dlBtn, item.url);
        });

        div.appendChild(infoDiv);
        div.appendChild(dlBtn);

        return div;
    }

    function triggerDownloadAnimation(button, url) {
        if (button.classList.contains('downloading')) return;
        
        const originalText = button.querySelector('span').textContent;
        const icon = button.querySelector('i');
        
        button.classList.add('downloading');
        button.querySelector('span').textContent = 'Starting...';
        icon.className = 'bi bi-arrow-down-circle-fill dl-icon text-white';

        // Fake loading effect for the "cool animation" before downloading
        setTimeout(() => {
            // Open url in new tab to trigger download
            window.location.href = url;
            
            // Revert state
            button.classList.remove('downloading');
            button.querySelector('span').textContent = originalText;
            icon.className = 'bi bi-check-circle-fill dl-icon text-success';
            
            setTimeout(() => {
                icon.className = 'bi bi-download dl-icon';
            }, 3000);
        }, 1200); 
    }
});
