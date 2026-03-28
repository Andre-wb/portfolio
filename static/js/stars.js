'use strict';
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('projects');
        if (!section) return;

        const isTouchDevice = ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);

        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: '0',
        });
        if (getComputedStyle(section).position === 'static')
            section.style.position = 'relative';
        section.prepend(canvas);
        const ctx = canvas.getContext('2d');

        const LAYERS = [
            { cnt: 400, scroll: 0.03, speed: 1, cursor: 0.08, sz: [0.12, 0.40], al: [0.2, 0.4] },
            { cnt: 380, scroll: 0.06, speed: 2, cursor: 0.12, sz: [0.14, 0.48], al: [0.3, 0.6] },
            { cnt: 360, scroll: 0.10, speed: 3, cursor: 0.18, sz: [0.18, 0.58], al: [0.4, 0.8] },
            { cnt: 340, scroll: 0.15, speed: 4, cursor: 0.26, sz: [0.24, 0.72], al: [0.5, 1.0] },
            { cnt: 300, scroll: 0.22, speed: 5, cursor: 0.38, sz: [0.32, 0.92], al: [0.6, 1.2] },
            { cnt: 260, scroll: 0.31, speed: 6, cursor: 0.52, sz: [0.44, 1.18], al: [0.7, 1.4] },
            { cnt: 220, scroll: 0.42, speed: 7, cursor: 0.70, sz: [0.60, 1.52], al: [0.8, 1.6] },
            { cnt: 180, scroll: 0.55, speed: 8, cursor: 0.92, sz: [0.82, 1.95], al: [0.9, 1.8] },
            { cnt: 130, scroll: 0.70, speed: 9, cursor: 1.20, sz: [1.10, 2.48], al: [1.0, 2.0] },
        ];

        let stars = [], W = 0, H = 0;
        let lastScrollY = window.scrollY;
        let isScrolling = false;
        let scrollTimer = null;
        let scrollDelta = 0;
        let targetScrollDelta = 0;

        function resize() {
            W = canvas.width  = section.offsetWidth;
            H = canvas.height = section.offsetHeight;
        }

        function initStars() {
            stars = [];
            LAYERS.forEach((L, li) => {
                for (let i = 0; i < L.cnt; i++) {
                    stars.push({
                        x:  Math.random() * W,
                        y:  Math.random() * H,
                        sz: L.sz[0] + Math.random() * (L.sz[1] - L.sz[0]),
                        al: L.al[0] + Math.random() * (L.al[1] - L.al[0]),
                        tp: Math.random() * Math.PI * 2,
                        ts: 0.004 + Math.random() * 0.011,
                        li,
                    });
                }
            });
        }

        // Оптимизированный обработчик скролла - только вычисляем дельту
        function onScroll() {
            const currentScrollY = window.scrollY;
            const dy = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;

            if (dy !== 0) {
                targetScrollDelta = dy;
            }

            isScrolling = true;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                isScrolling = false;
                targetScrollDelta = 0;
                scrollDelta = 0;
            }, 150);
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        const lenisCheck = setInterval(() => {
            if (window.lenis) {
                window.lenis.on('scroll', onScroll);
                clearInterval(lenisCheck);
            }
        }, 200);

        let dirX = 0, dirY = 0;
        let smDirX = 0, smDirY = 0;

        if (!isTouchDevice) {
            document.addEventListener('mousemove', e => {
                const r = section.getBoundingClientRect();
                dirX = ((e.clientX - r.left) / W - 0.5) * 2;
                dirY = ((e.clientY - r.top)  / H - 0.5) * 2;
            });
        }

        let cursorAlpha = 0;
        let tick = 0;

        function draw() {
            requestAnimationFrame(draw);
            tick++;

            // Плавное затухание скролл-дельты
            if (isScrolling) {
                scrollDelta += (targetScrollDelta - scrollDelta) * 0.3;
            } else {
                scrollDelta *= 0.95;
                if (Math.abs(scrollDelta) < 0.01) scrollDelta = 0;
            }

            if (!isTouchDevice) {
                smDirX += (dirX - smDirX) * 0.04;
                smDirY += (dirY - smDirY) * 0.04;

                const targetAlpha = isScrolling ? 0 : 1;
                cursorAlpha += (targetAlpha - cursorAlpha) * 0.06;
            } else {
                smDirX = 0;
                smDirY = 0;
                cursorAlpha = 0;
            }

            ctx.clearRect(0, 0, W, H);

            // Оптимизация: обновляем звезды без лишних проверок в цикле
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                const L = LAYERS[s.li];

                let moveX = 0;
                let moveY = 0;

                // Движение от курсора
                if (!isTouchDevice && cursorAlpha > 0.01) {
                    moveX = smDirX * L.speed * L.cursor * cursorAlpha;
                    moveY = smDirY * L.speed * L.cursor * cursorAlpha;
                }

                // Движение от скролла (параллакс) - применяем мгновенно
                if (scrollDelta !== 0) {
                    moveY += scrollDelta * L.scroll;
                }

                // Применяем движение
                if (moveX !== 0 || moveY !== 0) {
                    s.x = ((s.x + moveX) % W + W) % W;
                    s.y = ((s.y + moveY) % H + H) % H;
                }

                // Мерцание звезд
                const tw = 0.60 + 0.40 * Math.sin(tick * s.ts + s.tp);
                const a  = s.al * tw;

                // Свечение для ближних крупных звёзд
                if (s.li === 2 && s.sz > 1.9) {
                    const gr = s.sz * 5;
                    const g  = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, gr);
                    g.addColorStop(0,   'rgba(0,225,255,'   + (a * 0.55).toFixed(3) + ')');
                    g.addColorStop(0.4, 'rgba(59,130,246,'  + (a * 0.18).toFixed(3) + ')');
                    g.addColorStop(1,   'rgba(0,0,0,0)');
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, gr, 0, 6.2832);
                    ctx.fillStyle = g;
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(s.x, s.y, s.sz, 0, 6.2832);
                ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
                ctx.fill();
            }
        }

        resize();
        initStars();
        draw();

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resize();
                initStars();
            }, 150);
        });
    });
}());