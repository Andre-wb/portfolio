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

        // Настройка уменьшения количества и яркости звезд при экране меньше 1024px шириной
        const isSmallScreen = window.innerWidth < 1024;
        const densityMultiplier = isSmallScreen ? 0.4 : 1;
        const alphaMultiplier = isSmallScreen ? 0.6 : 1;

        // Layer 0 = far (small, dim, slow), Layer 8 = near (large, bright, fast)
        //
        // scrollFactor: движение звезды в canvas при скролле.
        //   Итоговая скорость на экране = scrollDy * (1 - scrollFactor)
        //   > 0 → звезда "отстаёт" от страницы → выглядит далёкой
        //   < 0 → звезда "обгоняет" страницу → выглядит ближней
        //   scrollFactor 0.80: экранная скорость = 20% от скролла (медленный фон)
        //   scrollFactor -0.64: экранная скорость = 164% от скролла (быстрый передний план)
        const LAYERS_BASE = [
            { cnt: 350, scrollFactor:  0.80, cursorSpeed: 0.5,  sz: [0.18, 0.525], al: [0.225, 0.525] },
            { cnt: 320, scrollFactor:  0.62, cursorSpeed: 0.9,  sz: [0.27, 0.72], al: [0.33, 0.675] },
            { cnt: 290, scrollFactor:  0.44, cursorSpeed: 1.4,  sz: [0.39, 0.93], al: [0.45, 0.87] },
            { cnt: 260, scrollFactor:  0.26, cursorSpeed: 2.0,  sz: [0.54, 1.20], al: [0.57, 1.05] },
            { cnt: 220, scrollFactor:  0.08, cursorSpeed: 2.8,  sz: [0.72, 1.50], al: [0.72, 1.275] },
            { cnt: 180, scrollFactor: -0.10, cursorSpeed: 3.8,  sz: [0.96, 1.92], al: [0.87, 1.50] },
            { cnt: 140, scrollFactor: -0.28, cursorSpeed: 5.0,  sz: [1.26, 2.43], al: [1.05, 1.83] },
            { cnt: 100, scrollFactor: -0.46, cursorSpeed: 6.5,  sz: [1.65, 3.075], al: [1.23, 2.25] },
            { cnt:  80, scrollFactor: -0.64, cursorSpeed: 8.5,  sz: [2.10, 3.825], al: [1.41, 3.00] },
        ];

        const LAYERS = LAYERS_BASE.map(L => ({
            ...L,
            cnt: Math.round(L.cnt * densityMultiplier),
            al: [L.al[0] * alphaMultiplier, L.al[1] * alphaMultiplier]
        }));

        let stars = [], W = 0, H = 0;
        let lastScrollY = window.scrollY;
        let scrollActive = false;
        let scrollTimer = null;
        let dirX = 0, dirY = 0;
        let smDirX = 0, smDirY = 0;
        let cursorBlend = 0; // 0 = scroll-режим, 1 = cursor-режим
        let tick = 0;

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

        if (!isTouchDevice) {
            document.addEventListener('mousemove', e => {
                const r = section.getBoundingClientRect();
                dirX = ((e.clientX - r.left) / W - 0.5) * 2;
                dirY = ((e.clientY - r.top)  / H - 0.5) * 2;
            });
        }

        // Поддержка Lenis — дополнительно слушаем его события для флага scrollActive
        const lenisCheck = setInterval(() => {
            if (window.lenis) {
                window.lenis.on('scroll', () => {
                    scrollActive = true;
                    clearTimeout(scrollTimer);
                    scrollTimer = setTimeout(() => { scrollActive = false; }, 250);
                });
                clearInterval(lenisCheck);
            }
        }, 200);

        function draw() {
            requestAnimationFrame(draw);
            tick++;

            // Читаем дельту скролла прямо в rAF — синхронно с рендером.
            // Никакого накопления/трения. iOS сам плавно гасит через momentum scroll.
            const curScrollY = window.scrollY;
            const rawDy = curScrollY - lastScrollY;
            lastScrollY = curScrollY;

            if (rawDy !== 0) {
                scrollActive = true;
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => { scrollActive = false; }, 250);
            }

            // Ограничение от резких рывков на мобиле при инерционном скролле
            const scrollDy = Math.max(-60, Math.min(60, rawDy));

            // Плавное сглаживание направления курсора (только desktop)
            if (!isTouchDevice) {
                smDirX += (dirX - smDirX) * 0.05;
                smDirY += (dirY - smDirY) * 0.05;
            }

            // Плавный переход между режимами
            const targetBlend = (scrollActive || isTouchDevice) ? 0 : 1;
            cursorBlend += (targetBlend - cursorBlend) * 0.05;

            ctx.clearRect(0, 0, W, H);

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                const L = LAYERS[s.li];

                let moveX = 0;
                let moveY = 0;

                // Бесконечный полёт к курсору (ближние звёзды — значительно быстрее)
                if (cursorBlend > 0.001) {
                    moveX += smDirX * L.cursorSpeed * cursorBlend;
                    moveY += smDirY * L.cursorSpeed * cursorBlend;
                }

                // Параллакс при скролле (ближние обгоняют, дальние отстают)
                if (scrollDy !== 0) {
                    moveY += scrollDy * L.scrollFactor;
                }

                if (moveX !== 0 || moveY !== 0) {
                    s.x = ((s.x + moveX) % W + W) % W;
                    s.y = ((s.y + moveY) % H + H) % H;
                }

                // Мерцание
                const tw = 0.60 + 0.40 * Math.sin(tick * s.ts + s.tp);
                const a  = s.al * tw;

                // Свечение для крупных ближних звёзд
                if (s.li >= 7 && s.sz > 1.8) {
                    const gr = s.sz * 4;
                    const g  = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, gr);
                    g.addColorStop(0,   'rgba(0,225,255,'  + (a * 0.55).toFixed(3) + ')');
                    g.addColorStop(0.4, 'rgba(59,130,246,' + (a * 0.18).toFixed(3) + ')');
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

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { resize(); initStars(); }, 150);
        });
    });
}());