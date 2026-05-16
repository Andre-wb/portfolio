(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initZoom);
    } else {
        initZoom();
    }

    function initZoom() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile) return;

        const slides = document.querySelectorAll('.gallery-slide');
        let currentZoomedSlide = null;

        function resetZoom(slideElement) {
            if (!slideElement) return;
            slideElement.classList.remove('zoomed');
            slideElement.style.overflow = '';
            slideElement.scrollTop = 0;
            slideElement.scrollLeft = 0;
        }

        function applyZoom(slideElement, scale) {
            const img = slideElement.querySelector('img');
            if (!img) return;

            if (!slideElement.classList.contains('zoomed')) {
                slideElement.classList.add('zoomed');
                img.style.transform = `scale(${scale})`;
            }
        }

        slides.forEach(slide => {
            const img = slide.querySelector('img');
            if (!img) return;

            let touchTimer = null;

            slide.addEventListener('touchstart', (e) => {
                if (slide.classList.contains('zoomed')) {
                    e.preventDefault();
                    resetZoom(slide);
                    if (currentZoomedSlide === slide) {
                        currentZoomedSlide = null;
                    }
                    return;
                }

                touchTimer = setTimeout(() => {
                    applyZoom(slide, 2);
                    currentZoomedSlide = slide;
                }, 150);
            });

            slide.addEventListener('touchend', () => {
                if (touchTimer) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                }
            });

            slide.addEventListener('dblclick', (e) => {
                e.preventDefault();
                if (slide.classList.contains('zoomed')) {
                    resetZoom(slide);
                    if (currentZoomedSlide === slide) {
                        currentZoomedSlide = null;
                    }
                } else {
                    applyZoom(slide, 2.5);
                    currentZoomedSlide = slide;
                }
            });
        });

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const dots = document.querySelectorAll('.gallery-dot');

        function resetCurrentZoom() {
            if (currentZoomedSlide) {
                resetZoom(currentZoomedSlide);
                currentZoomedSlide = null;
            }
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', resetCurrentZoom);
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', resetCurrentZoom);
        }

        dots.forEach(dot => {
            dot.addEventListener('click', resetCurrentZoom);
        });

        const closeBtn = document.querySelector('.gallery-close');
        const backdrop = document.querySelector('.gallery-backdrop');

        const closeModal = () => resetCurrentZoom();

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);
    }
})();