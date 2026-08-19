document.addEventListener('DOMContentLoaded', () => {
    const mediaImages = document.querySelectorAll('.project-media img');
    if (!mediaImages.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    function open(src, alt) {
        overlayImg.src = src;
        overlayImg.alt = alt || '';
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    mediaImages.forEach(img => {
        img.addEventListener('click', () => open(img.src, img.alt));
    });

    overlay.addEventListener('click', e => {
        if (e.target === overlay) close();
    });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
});
