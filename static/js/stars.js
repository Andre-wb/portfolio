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
        // Слои звезд с настройкой их количества, скорости и т.д. для параллакс эффекта
        const LAYERS = [
            { cnt: 400, scroll: 0.03, speed: 1, cursor: 0.08, sz: [0.12, 0.40], al: [0.04, 0.18] },
            { cnt: 380, scroll: 0.06, speed: 2, cursor: 0.12, sz: [0.14, 0.48], al: [0.06, 0.22] },
            { cnt: 360, scroll: 0.10, speed: 3, cursor: 0.18, sz: [0.18, 0.58], al: [0.09, 0.28] },
            { cnt: 340, scroll: 0.15, speed: 4, cursor: 0.26, sz: [0.24, 0.72], al: [0.13, 0.35] },
            { cnt: 300, scroll: 0.22, speed: 5, cursor: 0.38, sz: [0.32, 0.92], al: [0.18, 0.44] },
            { cnt: 260, scroll: 0.31, speed: 6, cursor: 0.52, sz: [0.44, 1.18], al: [0.24, 0.55] },
            { cnt: 220, scroll: 0.42, speed: 7, cursor: 0.70, sz: [0.60, 1.52], al: [0.32, 0.68] },
            { cnt: 180, scroll: 0.55, speed: 8, cursor: 0.92, sz: [0.82, 1.95], al: [0.42, 0.83] },
            { cnt: 130, scroll: 0.70, speed: 9, cursor: 1.20, sz: [1.10, 2.48], al: [0.54, 1.00] },
            { cnt:  80, scroll: 0.88, speed: 10, cursor: 1.55, sz: [1.48, 3.20], al: [0.68, 1.12] }
        ];

        let stars = [], W = 0, H = 0;

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

        let lastScrollY = window.scrollY;
        let isScrolling = false;
        let scrollTimer = null;

        function onScroll() {
            const dy = window.scrollY - lastScrollY;
            lastScrollY = window.scrollY;
            stars.forEach(s => {
                s.y = ((s.y + dy * LAYERS[s.li].scroll) % H + H) % H;
            });
            isScrolling = true;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => { isScrolling = false; }, 150);
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

            stars.forEach(s => {
                const L = LAYERS[s.li];

                // Зависимость движения от курсора (это если cursorAlpha > 0)
                if (cursorAlpha > 0.01) {
                    const vx = smDirX * L.speed * L.cursor * cursorAlpha;
                    const vy = smDirY * L.speed * L.cursor * cursorAlpha;
                    s.x = ((s.x + vx) % W + W) % W;
                    s.y = ((s.y + vy) % H + H) % H;
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
            });
        }

        resize();
        initStars();
        draw();

        window.addEventListener('resize', () => { resize(); initStars(); });
    });
}());