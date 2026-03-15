'use strict';
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const section = document.getElementById('projects');
        if (!section) return;

        /* ── Определение touch-устройства ───────────────────────── */
        const isTouchDevice = ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);

        /* ── Canvas ─────────────────────────────────────────────── */
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

        /* ── Слои ───────────────────────────────────────────────────
         * scroll  — множитель параллакса при скролле
         * speed   — базовая скорость дрейфа (px/frame) для каждого слоя
         *           ближние быстрее → усиливает ощущение глубины
         * cursor  — насколько сильно курсор влияет на направление
         * ────────────────────────────────────────────────────────── */
        const LAYERS = [
            { cnt: 400, scroll: 0.06, speed: 1, cursor: 0.25, sz: [0.25, 0.8],  al: [0.10, 0.35] },
            { cnt: 200, scroll: 0.18, speed: 3, cursor: 0.60, sz: [0.65, 1.5],  al: [0.28, 0.58] },
            { cnt: 150, scroll: 0.42, speed: 4, cursor: 1.10, sz: [1.20, 2.6],  al: [0.48, 0.90] },
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

        /* ── Скролл ─────────────────────────────────────────────── */
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

        /* ── Курсор (только для non-touch устройств) ─────────────── */
        let dirX = 0, dirY = 0;
        let smDirX = 0, smDirY = 0;

        if (!isTouchDevice) {
            document.addEventListener('mousemove', e => {
                const r = section.getBoundingClientRect();
                // Нормализуем относительно центра секции: -1 … +1
                dirX = ((e.clientX - r.left) / W - 0.5) * 2;
                dirY = ((e.clientY - r.top)  / H - 0.5) * 2;
            });
        }

        /* ── Плавное переключение скролл ↔ курсор ─────────────────
         * cursorAlpha: 0 = скролл рулит, 1 = курсор рулит
         * Для touch-устройств cursorAlpha всегда равен 0
         * ────────────────────────────────────────────────────────── */
        let cursorAlpha = 0;

        /* ── Рендер ─────────────────────────────────────────────── */
        let tick = 0;

        function draw() {
            requestAnimationFrame(draw);
            tick++;

            if (!isTouchDevice) {
                // Плавно сглаживаем направление курсора (только для non-touch)
                smDirX += (dirX - smDirX) * 0.04;
                smDirY += (dirY - smDirY) * 0.04;

                // Плавно переключаем режим (только для non-touch)
                const targetAlpha = isScrolling ? 0 : 1;
                cursorAlpha += (targetAlpha - cursorAlpha) * 0.06;
            } else {
                // Для touch-устройств курсорный эффект отключен
                smDirX = 0;
                smDirY = 0;
                cursorAlpha = 0;
            }

            ctx.clearRect(0, 0, W, H);

            stars.forEach(s => {
                const L = LAYERS[s.li];

                // Движение под влиянием курсора (только если cursorAlpha > 0)
                if (cursorAlpha > 0.01) {
                    const vx = smDirX * L.speed * L.cursor * cursorAlpha;
                    const vy = smDirY * L.speed * L.cursor * cursorAlpha;
                    s.x = ((s.x + vx) % W + W) % W;
                    s.y = ((s.y + vy) % H + H) % H;
                }

                // Мерцание
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

                // Ядро
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