document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('galleryViewport');
    const world = document.getElementById('galleryWorld');
    if (!viewport || !world) return;

    // Placeholder photos - swap these for real project/work photos
    const IMAGES = [
        'assets/images/engineering/eng-01.jpg',
        'assets/images/engineering/eng-02.png',
        'assets/images/engineering/eng-03.jpg',
        'assets/images/engineering/eng-04.png',
        'assets/images/engineering/eng-05.jpg',
        'assets/images/engineering/eng-06.jpg',
        'assets/images/engineering/eng-07.jpg',
        'assets/images/engineering/eng-08.jpg',
    ];
    const PATTERN_COLS = 4, PATTERN_ROWS = 2; // one repeating tile = one of each image
    // The tile is rendered 3x3 times (REPEATS) so that no matter where the wrapped
    // drag offset lands within a tile, a full tile of buffer surrounds the viewport
    // on every side - that's what makes the pan feel endless with a fixed-size DOM
    // instead of growing images forever.
    const REPEATS = 3;
    const TILE_SCALE = 1.3; // each tile is this many viewport-widths/heights, so a single tile alone already overflows the screen

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
                img.src = IMAGES[idx];
                img.alt = '';
                img.draggable = false;
                img.loading = 'lazy';
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

    viewport.addEventListener('pointerdown', e => {
        dragging = true;
        viewport.setPointerCapture(e.pointerId);
        startX = e.clientX; startY = e.clientY;
        startRawX = state.rawX; startRawY = state.rawY;
        viewport.classList.add('dragging');
    });
    viewport.addEventListener('pointermove', e => {
        if (!dragging) return;
        state.rawX = startRawX + (e.clientX - startX);
        state.rawY = startRawY + (e.clientY - startY);
        applyTransform();
    });
    function endDrag() {
        dragging = false;
        viewport.classList.remove('dragging');
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', endDrag);

    let resizeTimer = null;
    addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
    });

    build();
});
