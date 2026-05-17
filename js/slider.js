class ProjectGallery {
    constructor() {
        this.modal = document.getElementById('galleryModal');
        this.track = document.getElementById('galleryTrack');
        this.dotsContainer = document.getElementById('galleryDots');
        this.currentSpan = document.getElementById('currentSlide');
        this.totalSpan = document.getElementById('totalSlides');

        this.currentIndex = 0;
        this.images = [];

        this.isMobile = window.matchMedia('(max-width: 768px)').matches;

        this.zoomState = {
            scale: 1,
            panX: 0,
            panY: 0,
            isDragging: false,
            startX: 0,
            startY: 0,
            lastPanX: 0,
            lastPanY: 0,
            lastTapTime: 0,
            lastTapX: 0,
            lastTapY: 0,
            initialPinchDistance: 0,
            initialScale: 1,
            isPinching: false,
            activeImg: null,
            rafId: null
        };

        this.init();
    }

    init() {
        document.querySelectorAll('.project-link[href="#"]').forEach(btn => {
            if (btn.textContent.trim() === 'Галерея') {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const projectCard = btn.closest('.project-card');
                    this.open(projectCard.dataset.project);
                });
            }
        });

        this.modal.querySelector('.gallery-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.gallery-backdrop').addEventListener('click', () => this.close());

        document.getElementById('prevBtn').addEventListener('click', () => this.prev());
        document.getElementById('nextBtn').addEventListener('click', () => this.next());

        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        this.initSwipe();
        this.initZoom();
    }

    initZoom() {
        this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.track.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.track.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        this.track.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.track.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    getActiveImage() {
        return this.track.querySelectorAll('.gallery-slide img')[this.currentIndex];
    }

    applyTransform(img) {
        if (!img) return;
        const { scale, panX, panY } = this.zoomState;
        img.style.transformOrigin = 'center center';
        img.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
    }

    resetZoom() {
        const img = this.zoomState.activeImg || this.getActiveImage();
        if (!img) return;

        this.zoomState.scale = 1;
        this.zoomState.panX = 0;
        this.zoomState.panY = 0;
        this.zoomState.lastPanX = 0;
        this.zoomState.lastPanY = 0;

        img.style.transform = '';
        img.classList.remove('zoomed');
        this.zoomState.activeImg = null;
    }

    setZoom(scale, centerX, centerY) {
        const img = this.getActiveImage();
        if (!img) return;

        scale = Math.max(1, Math.min(scale, 5));

        const oldScale = this.zoomState.scale;
        const rect = img.getBoundingClientRect();

        const imgCenterX = rect.left + rect.width / 2;
        const imgCenterY = rect.top + rect.height / 2;

        const mouseOffsetX = centerX - imgCenterX;
        const mouseOffsetY = centerY - imgCenterY;

        const scaleRatio = scale / oldScale;

        this.zoomState.panX = this.zoomState.panX - mouseOffsetX * (scaleRatio - 1);
        this.zoomState.panY = this.zoomState.panY - mouseOffsetY * (scaleRatio - 1);
        this.zoomState.scale = scale;

        this.zoomState.activeImg = img;
        img.classList.toggle('zoomed', scale > 1);

        this.clampPan();
        this.applyTransform(img);
    }

    clampPan() {
        const img = this.zoomState.activeImg || this.getActiveImage();
        if (!img || this.zoomState.scale <= 1) return;

        const rect = img.getBoundingClientRect();
        const parent = img.parentElement.getBoundingClientRect();

        const maxPanX = Math.max(0, (rect.width * this.zoomState.scale - parent.width) / 2);
        const maxPanY = Math.max(0, (rect.height * this.zoomState.scale - parent.height) / 2);

        this.zoomState.panX = Math.max(-maxPanX, Math.min(maxPanX, this.zoomState.panX));
        this.zoomState.panY = Math.max(-maxPanY, Math.min(maxPanY, this.zoomState.panY));
    }

    handleTouchStart(e) {
        const img = this.getActiveImage();
        if (!img) return;

        if (e.touches.length === 2) {
            e.preventDefault();
            e.stopPropagation();

            this.zoomState.isPinching = true;
            this.zoomState.initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            this.zoomState.initialScale = this.zoomState.scale;

        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            const now = Date.now();

            const isDoubleTap = now - this.zoomState.lastTapTime < 300 &&
                Math.hypot(touch.clientX - this.zoomState.lastTapX, touch.clientY - this.zoomState.lastTapY) < 30;

            if (isDoubleTap) {
                e.preventDefault();
                e.stopPropagation();

                if (this.zoomState.scale > 1) {
                    this.resetZoom();
                } else {
                    this.setZoom(2.5, touch.clientX, touch.clientY);
                }
                this.zoomState.lastTapTime = 0;
                return;
            }

            this.zoomState.lastTapTime = now;
            this.zoomState.lastTapX = touch.clientX;
            this.zoomState.lastTapY = touch.clientY;

            if (this.zoomState.scale > 1) {
                this.zoomState.isDragging = true;
                this.zoomState.startX = touch.clientX - this.zoomState.panX;
                this.zoomState.startY = touch.clientY - this.zoomState.panY;
                img.style.cursor = 'grabbing';
            }
        }
    }

    handleTouchMove(e) {
        if (this.zoomState.isPinching && e.touches.length === 2) {
            e.preventDefault();
            e.stopPropagation();

            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const newScale = this.zoomState.initialScale * (distance / this.zoomState.initialPinchDistance);
            this.setZoom(newScale, centerX, centerY);

        } else if (this.zoomState.isDragging && e.touches.length === 1 && this.zoomState.scale > 1) {
            e.preventDefault();

            const touch = e.touches[0];
            this.zoomState.panX = touch.clientX - this.zoomState.startX;
            this.zoomState.panY = touch.clientY - this.zoomState.startY;

            this.clampPan();
            this.applyTransform(this.zoomState.activeImg);
        }
    }

    handleTouchEnd(e) {
        if (this.zoomState.isPinching) {
            if (e.touches.length < 2) {
                this.zoomState.isPinching = false;
                if (this.zoomState.scale < 1.2) {
                    this.resetZoom();
                }
            }
        }

        if (this.zoomState.isDragging) {
            this.zoomState.isDragging = false;
            const img = this.zoomState.activeImg || this.getActiveImage();
            if (img) img.style.cursor = this.zoomState.scale > 1 ? 'grab' : '';
        }
    }

    handleWheel(e) {
        e.preventDefault();
        const img = this.getActiveImage();
        if (!img) return;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(1, Math.min(this.zoomState.scale * delta, 5));

        this.setZoom(newScale, e.clientX, e.clientY);

        if (newScale <= 1) {
            this.resetZoom();
        }
    }

    handleDoubleClick(e) {
        const img = e.target.closest('.gallery-slide img');
        if (!img) return;

        if (this.zoomState.scale > 1) {
            this.resetZoom();
        } else {
            this.setZoom(2.5, e.clientX, e.clientY);
        }
    }

    initSwipe() {
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false;

        this.track.addEventListener('touchstart', (e) => {
            if (this.zoomState.scale > 1 || this.zoomState.isPinching) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = true;
        }, { passive: true });

        this.track.addEventListener('touchmove', (e) => {
            if (!isSwiping || this.zoomState.scale > 1) return;
            const dx = Math.abs(e.touches[0].clientX - touchStartX);
            const dy = Math.abs(e.touches[0].clientY - touchStartY);
            if (dx > dy && dx > 10) {
                e.preventDefault();
            }
        }, { passive: false });

        this.track.addEventListener('touchend', (e) => {
            if (!isSwiping || this.zoomState.scale > 1) {
                isSwiping = false;
                return;
            }

            const diffX = touchStartX - e.changedTouches[0].clientX;
            const diffY = touchStartY - e.changedTouches[0].clientY;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                diffX > 0 ? this.next() : this.prev();
            }
            isSwiping = false;
        }, { passive: true });
    }

    getImageUrl(basePath) {
        const suffix = this.isMobile ? '_m.webp' : '.webp';
        return basePath + suffix;
    }

    open(projectId) {
        const projectImagesBase = {
            'vortex': [
                'assets/vortex/vortex1',
                'assets/vortex/vortex2',
                'assets/vortex/vortex3',
                'assets/vortex/vortex5',
                'assets/vortex/vortex6',
                'assets/vortex/vortex7',
                'assets/vortex/vortex8',
                'assets/vortex/vortex9',
                'assets/vortex/vortex10',
                'assets/vortex/vortex11',
            ],
            'artifex': [
                'assets/artifex/artifex1',
                'assets/artifex/artifex2',
                'assets/artifex/artifex3',
                'assets/artifex/artifex4',
                'assets/artifex/artifex5',
                'assets/artifex/artifex6',
            ],
            'lethalhome': [
                'assets/lethalhome/lethalhome4',
                'assets/lethalhome/lethalhome5',
                'assets/lethalhome/lethalhome6',
                'assets/lethalhome/lethalhome7',
                'assets/lethalhome/lethalhome8',
            ],
            'realestate': [
                'assets/realestate/realestate1',
                'assets/realestate/realestate2',
                'assets/realestate/realestate3',
                'assets/realestate/realestate4',
                'assets/realestate/realestate5',
                'assets/realestate/realestate6',
            ],
            'orbityx': [
                'assets/orbityx/orbityx2',
                'assets/orbityx/orbityx3',
                'assets/orbityx/orbityx4',
                'assets/orbityx/orbityx5',
                'assets/orbityx/orbityx6',
                'assets/orbityx/orbityx7',
            ],
        };

        const basePaths = projectImagesBase[projectId] || [];
        this.images = basePaths.map(path => this.getImageUrl(path));

        this.currentIndex = 0;
        this.resetZoom();
        this.render();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.resetZoom();
        setTimeout(() => {
            this.track.innerHTML = '';
            this.dotsContainer.innerHTML = '';
        }, 400);
    }

    render() {
        this.track.innerHTML = this.images.map(src => `
            <div class="gallery-slide">
                <img src="${src}" alt="Screenshot" draggable="false" loading="eager">
            </div>
        `).join('');

        this.dotsContainer.innerHTML = this.images.map((_, i) => `
            <div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
        `).join('');

        this.dotsContainer.querySelectorAll('.gallery-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                this.resetZoom();
                this.goTo(parseInt(dot.dataset.index));
            });
        });

        this.totalSpan.textContent = this.images.length;
        this.update();
    }

    update() {
        this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        this.currentSpan.textContent = this.currentIndex + 1;

        this.dotsContainer.querySelectorAll('.gallery-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });

        document.getElementById('prevBtn').disabled = this.currentIndex === 0;
        document.getElementById('nextBtn').disabled = this.currentIndex === this.images.length - 1;

        this.resetZoom();
    }

    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.currentIndex++;
            this.update();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.update();
        }
    }

    goTo(index) {
        this.currentIndex = index;
        this.update();
    }
}

new ProjectGallery();