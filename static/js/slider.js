class ProjectGallery {
    constructor() {
        this.modal = document.getElementById('galleryModal');
        this.track = document.getElementById('galleryTrack');
        this.dotsContainer = document.getElementById('galleryDots');
        this.currentSpan = document.getElementById('currentSlide');
        this.totalSpan = document.getElementById('totalSlides');

        this.currentIndex = 0;
        this.images = [];

        this.init();
    }

    init() {
        // Открытие галереи по клику на кнопки
        document.querySelectorAll('.project-link[href="#"]').forEach(btn => {
            if (btn.textContent.trim() === 'Галерея') {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const projectCard = btn.closest('.project-card');
                    this.open(projectCard.dataset.project);
                });
            }
        });

        // Закрытие
        this.modal.querySelector('.gallery-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.gallery-backdrop').addEventListener('click', () => this.close());

        // Навигация
        document.getElementById('prevBtn').addEventListener('click', () => this.prev());
        document.getElementById('nextBtn').addEventListener('click', () => this.next());

        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        // Свайп на мобиле
        let touchStartX = 0;
        this.track.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.track.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                diff > 0 ? this.next() : this.prev();
            }
        });
    }

    open(projectId) {
        const projectImages = {
            'vortex': [
                '/static/assets/vortex/vortex1.png',
                '/static/assets/vortex/vortex2.png',
                '/static/assets/vortex/vortex3.png',
                '/static/assets/vortex/vortex4.png',
                '/static/assets/vortex/vortex5.png',
                '/static/assets/vortex/vortex6.png',
                '/static/assets/vortex/vortex7.png',
                '/static/assets/vortex/vortex8.png',
                '/static/assets/vortex/vortex9.png',
            ],
            'artifex': [
                '/static/assets/artifex/artifex1.png',
                '/static/assets/artifex/artifex2.png',
                '/static/assets/artifex/artifex3.png',
                '/static/assets/artifex/artifex4.png',
                '/static/assets/artifex/artifex5.png',
                '/static/assets/artifex/artifex6.png',
            ],
            'lethalhome': [
                '/static/assets/lethalhome/lethalhome4.png',
                '/static/assets/lethalhome/lethalhome5.png',
                '/static/assets/lethalhome/lethalhome6.png',
                '/static/assets/lethalhome/lethalhome7.png',
                '/static/assets/lethalhome/lethalhome8.png',
            ],
            'realestate': [
                '/static/assets/realestate/realestate1.png',
                '/static/assets/realestate/realestate2.png',
                '/static/assets/realestate/realestate3.png',
                '/static/assets/realestate/realestate4.png',
                '/static/assets/realestate/realestate5.png',
                '/static/assets/realestate/realestate6.png',
            ],
            'orbityx': [
                '/static/assets/orbityx/orbityx1.png',
                '/static/assets/orbityx/orbityx2.png',
            ],
        }

        this.images = projectImages[projectId] || [];
        this.currentIndex = 0;
        this.render();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            this.track.innerHTML = '';
            this.dotsContainer.innerHTML = '';
        }, 400);
    }

    render() {
        // Слайды
        this.track.innerHTML = this.images.map(src => `
            <div class="gallery-slide">
                <img src="${src}" alt="Screenshot" loading="lazy">
            </div>
        `).join('');

        // Доты
        this.dotsContainer.innerHTML = this.images.map((_, i) => `
            <div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
        `).join('');

        this.dotsContainer.querySelectorAll('.gallery-dot').forEach(dot => {
            dot.addEventListener('click', () => {
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

// Инициализация
new ProjectGallery();