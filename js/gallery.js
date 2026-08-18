document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('galleryViewport');
    const world = document.getElementById('galleryWorld');
    if (!viewport || !world) return;

    // Placeholder photos - swap these for real project/work photos. Each entry's
    // targetId is the project section a click on that photo scrolls down to.
    const IMAGES = [
        { src: 'assets/images/engineering/eng-01.jpg', targetId: 'project-1' },
        { src: 'assets/images/engineering/eng-02.png', targetId: 'project-2' },
        { src: 'assets/images/engineering/eng-03.jpg', targetId: 'project-3' },
        { src: 'assets/images/engineering/eng-04.png', targetId: 'project-4' },
        { src: 'assets/images/engineering/eng-05.jpg', targetId: 'project-5' },
        { src: 'assets/images/engineering/eng-06.jpg', targetId: 'project-6' },
        { src: 'assets/images/engineering/eng-07.jpg', targetId: 'project-7' },
        { src: 'assets/images/engineering/eng-08.jpg', targetId: 'project-8' },
    ];
    const PATTERN_COLS = 4, PATTERN_ROWS = 2; // one repeating tile = one of each image
    // The tile is rendered 3x3 times (REPEATS) so that no matter where the wrapped
    // drag offset lands within a tile, a full tile of buffer surrounds the viewport
    // on every side - that's what makes the pan feel endless with a fixed-size DOM
    // instead of growing images forever.
    const REPEATS = 3;
    const TILE_SCALE = 1.3; // each tile is this many viewport-widths/heights, so a single tile alone already overflows the screen
    const CLICK_MAX_MOVE = 6; // px - a pointer session under this is a click/tap, not a drag

    const state = { rawX: 0, rawY: 0, tileW: 0, tileH: 0 };

    function build() {
        const vw = viewport.clientWidth, vh = viewport.clientHeight;
        const tileW = vw * TILE_SCALE, tileH = vh * TILE_SCALE;
        const cellW = tileW / PATTERN_COLS, cellH = tileH / PATTERN_ROWS;
        const cols = PATTERN_COLS * REPEATS, rows = PATTERN_ROWS * REPEATS;

        world.style.width = (cellW * cols) + 'px';
        world.style.height = (cellH * rows) + 'px';
        world.style.gridTemplateColumns = `repeat(${cols}, ${cellW}px)`;
        world.style.gridTemplateRows = `repeat(${rows}, ${cellH}px)`;

        world.innerHTML = '';
        const frag = document.createDocumentFragment();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = (r % PATTERN_ROWS) * PATTERN_COLS + (c % PATTERN_COLS);
                const img = document.createElement('img');
                img.src = IMAGES[idx].src;
                img.alt = '';
                img.draggable = false;
                img.loading = 'lazy';
                img.dataset.index = idx;
                frag.appendChild(img);
            }
        }
        world.appendChild(frag);

        state.tileW = tileW;
        state.tileH = tileH;
        applyTransform();
    }

    // Wraps v into [-m, 0) - the offset the world is actually translated by. Keeping
    // this bounded (instead of letting the raw drag distance grow forever) is what
    // makes the pan infinite without the DOM/CSS values ever growing unbounded.
    function wrap(v, m) {
        if (m <= 0) return 0;
        return (((v % m) + m) % m) - m;
    }

    function applyTransform() {
        const dx = wrap(state.rawX, state.tileW);
        const dy = wrap(state.rawY, state.tileH);
        world.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
    }

    let dragging = false, startX = 0, startY = 0, startRawX = 0, startRawY = 0;
    let downImg = null, moveDist = 0;

    viewport.addEventListener('pointerdown', e => {
        dragging = true;
        moveDist = 0;
        downImg = e.target.closest('img');
        viewport.setPointerCapture(e.pointerId);
        startX = e.clientX; startY = e.clientY;
        startRawX = state.rawX; startRawY = state.rawY;
        viewport.classList.add('dragging');
    });
    viewport.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        moveDist = Math.max(moveDist, Math.hypot(dx, dy));
        state.rawX = startRawX + dx;
        state.rawY = startRawY + dy;
        applyTransform();
    });
    function endDrag() {
        if (dragging && moveDist < CLICK_MAX_MOVE && downImg) {
            const entry = IMAGES[Number(downImg.dataset.index)];
            const target = entry && document.getElementById(entry.targetId);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        dragging = false;
        downImg = null;
        viewport.classList.remove('dragging');
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', () => { dragging = false; downImg = null; viewport.classList.remove('dragging'); });
    viewport.addEventListener('pointerleave', () => { dragging = false; downImg = null; viewport.classList.remove('dragging'); });

    let resizeTimer = null;
    addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
    });

    build();
});
