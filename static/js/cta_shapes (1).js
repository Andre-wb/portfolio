'use strict';

/* ─────────────────────────────────────────────────────────────
 * CTA — 3D фигуры с кинематографическими тенями и depth blur
 *
 * Реализация depth-of-field без постпроцессинга:
 *   Три отдельных канваса (задний / средний / передний слой)
 *   накладываются друг на друга через position:absolute.
 *   К заднему применяется CSS blur(4px), к среднему blur(1.5px).
 *   Каждый слой рендерится своим Three.js рендерером.
 *
 * КАК МЕНЯТЬ СКОРОСТЬ ВРАЩЕНИЯ:
 *   rot: [rx, ry, rz] — радиан за кадр. 0.002 = медленно, 0.008 = быстро.
 * ───────────────────────────────────────────────────────────── */

(function () {

    /* ── Конфиги фигур ─────────────────────────────────────────
     * layer:  'back' | 'mid' | 'front'
     * pos:    [x, y, z]  — z задаёт глубину внутри слоя
     * rot:    [rx, ry, rz] — скорость вращения рад/кадр
     * par:    {x, y} — направление и сила реакции на курсор
     * color:  hex
     * geo:    индекс геометрии
     * ────────────────────────────────────────────────────────── */
    const CONFIGS = [
        // ЗАДНИЙ слой — размытый
        {
            layer: 'back',
            pos:   [-3.2, 2.0, -1.5],
            rot:   [0.002, 0.003, 0.001],
            par:   { x: -0.9, y:  0.7 },
            color: 0x0ea5e9,
            geo:   2, // октаэдр
        },
        {
            layer: 'back',
            pos:   [ 3.0, -1.8, -1.0],
            rot:   [0.001, 0.004, 0.002],
            par:   { x:  0.8, y: -0.6 },
            color: 0x6366f1,
            geo:   1, // куб
        },

        // СРЕДНИЙ слой — слабое размытие
        {
            layer: 'mid',
            pos:   [-2.0, -1.0, 0.0],
            rot:   [0.003, 0.005, 0.002],
            par:   { x:  1.2, y: -1.0 },
            color: 0x10b981,
            geo:   3, // пирамида
        },
        {
            layer: 'mid',
            pos:   [ 2.5,  1.5, 0.3],
            rot:   [0.002, 0.003, 0.004],
            par:   { x: -1.1, y:  0.9 },
            color: 0x3b82f6,
            geo:   4, // призма
        },

        // ПЕРЕДНИЙ слой — резкий
        {
            layer: 'front',
            pos:   [ 0.3, -0.5, 1.5],
            rot:   [0.004, 0.006, 0.002],
            par:   { x:  1.4, y:  1.2 },
            color: 0x00e1ff,
            geo:   0, // тетраэдр
        },
    ];

    /* ── Геометрии ─────────────────────────────────────────── */
    function makeGeos() {
        return [
            new THREE.TetrahedronGeometry(0.85),
            new THREE.BoxGeometry(1.15, 1.15, 1.15),
            new THREE.OctahedronGeometry(0.95),
            new THREE.ConeGeometry(0.70, 1.50, 4),
            new THREE.CylinderGeometry(0.55, 0.55, 1.30, 6),
        ];
    }

    /* ── Построить сцену одного слоя ───────────────────────── */
    function buildLayer(configs, geos) {
        const scene = new THREE.Scene();

        // Освещение — одинаковое для всех слоёв
        scene.add(new THREE.AmbientLight(0xffffff, 0.30));

        // Основной ключевой свет — голубой, мощный
        const key = new THREE.DirectionalLight(0x00e1ff, 3.0);
        key.position.set(5, 8, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(4096, 4096);
        key.shadow.camera.near   = 0.1;
        key.shadow.camera.far    = 40;
        key.shadow.camera.left   = -8;
        key.shadow.camera.right  =  8;
        key.shadow.camera.top    =  8;
        key.shadow.camera.bottom = -8;
        key.shadow.radius        = 20;   // сильное размытие тени
        key.shadow.blurSamples   = 16;
        key.shadow.bias          = -0.001;
        scene.add(key);

        // Контровой — синий, снизу-сзади
        const rim = new THREE.DirectionalLight(0x3b82f6, 2.0);
        rim.position.set(-4, -5, -4);
        scene.add(rim);

        // Мягкий fill — тёплый, спереди
        const fill = new THREE.DirectionalLight(0xffffff, 0.8);
        fill.position.set(0, 2, 8);
        scene.add(fill);

        // Точечный — внутреннее свечение
        const pt = new THREE.PointLight(0x0ea5e9, 1.5, 15);
        pt.position.set(0, 0, 4);
        scene.add(pt);

        const meshes = configs.map(cfg => {
            const mat = new THREE.MeshStandardMaterial({
                color:     cfg.color,
                metalness: 0.45,
                roughness: 0.30,
            });
            const mesh = new THREE.Mesh(geos[cfg.geo], mat);
            mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
            mesh.castShadow    = true;
            mesh.receiveShadow = true;
            mesh.userData.rot  = cfg.rot;
            mesh.userData.par  = cfg.par;
            mesh.userData.base = mesh.position.clone();
            scene.add(mesh);
            return mesh;
        });

        return { scene, meshes };
    }

    /* ── Создать renderer + canvas для слоя ────────────────── */
    function buildRenderer(container, blur) {
        const cv = document.createElement('canvas');
        Object.assign(cv.style, {
            position:  'absolute',
            top: '0', left: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none',
            filter: blur ? 'blur(' + blur + ')' : 'none',
        });
        container.appendChild(cv);

        const rdr = new THREE.WebGLRenderer({
            canvas:    cv,
            antialias: true,
            alpha:     true,
        });
        rdr.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rdr.setClearColor(0x000000, 0);
        rdr.shadowMap.enabled = true;
        rdr.shadowMap.type    = THREE.PCFSoftShadowMap;
        return rdr;
    }

    /* ── Главная инициализация ──────────────────────────────── */
    function init() {
        if (typeof THREE === 'undefined') { setTimeout(init, 50); return; }

        const wrapper = document.getElementById('ctaCanvas');
        if (!wrapper) return;

        // Оборачиваем в контейнер с relative positioning
        const container = wrapper.parentElement;
        container.style.position = 'relative';
        wrapper.style.display    = 'none'; // скрываем placeholder canvas

        /* Камера общая для всех слоёв */
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 8;

        const geos = makeGeos();

        const backCfgs  = CONFIGS.filter(c => c.layer === 'back');
        const midCfgs   = CONFIGS.filter(c => c.layer === 'mid');
        const frontCfgs = CONFIGS.filter(c => c.layer === 'front');

        const back  = buildLayer(backCfgs,  geos);
        const mid   = buildLayer(midCfgs,   geos);
        const front = buildLayer(frontCfgs, geos);

        const backRdr  = buildRenderer(container, '4px');
        const midRdr   = buildRenderer(container, '1.5px');
        const frontRdr = buildRenderer(container, null);

        /* ── Resize ─────────────────────────────────────────── */
        function resize() {
            const w = container.clientWidth  || 400;
            const h = container.clientHeight || 400;
            [backRdr, midRdr, frontRdr].forEach(r => r.setSize(w, h, false));
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener('resize', resize);

        /* ── Курсор ─────────────────────────────────────────── */
        let mx = 0, my = 0, smx = 0, smy = 0;
        window.addEventListener('mousemove', e => {
            mx =  (e.clientX / window.innerWidth  - 0.5) * 2;
            my = -(e.clientY / window.innerHeight - 0.5) * 2;
        });

        /* ── Анимация ───────────────────────────────────────── */
        let rafId = null;

        const allLayers = [
            { ...back,  rdr: backRdr  },
            { ...mid,   rdr: midRdr   },
            { ...front, rdr: frontRdr },
        ];

        function animate() {
            rafId = requestAnimationFrame(animate);

            smx += (mx - smx) * 0.04;
            smy += (my - smy) * 0.04;

            camera.position.x += (smx * 0.25 - camera.position.x) * 0.025;
            camera.position.y += (smy * 0.20 - camera.position.y) * 0.025;
            camera.lookAt(0, 0, 0);

            allLayers.forEach(({ scene, meshes, rdr }) => {
                meshes.forEach(m => {
                    m.rotation.x += m.userData.rot[0];
                    m.rotation.y += m.userData.rot[1];
                    m.rotation.z += m.userData.rot[2];

                    m.position.x = m.userData.base.x + smx * m.userData.par.x * 0.28;
                    m.position.y = m.userData.base.y + smy * m.userData.par.y * 0.28;
                });
                rdr.render(scene, camera);
            });
        }

        animate();

        const section = document.getElementById('cta');
        if (section) {
            new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    if (!rafId) animate();
                } else {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }, { threshold: 0.05 }).observe(section);
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    /* ══════════════════════════════════════════════════════════
     * Магнитные кнопки
     * ══════════════════════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', () => {
        const STRENGTH = 0.38;
        const EASE     = 0.12;

        document.querySelectorAll('.cta-btn').forEach(btn => {
            let ox = 0, oy = 0, tx = 0, ty = 0;
            let inside = false, rafId = null;

            function loop() {
                ox += (tx - ox) * EASE;
                oy += (ty - oy) * EASE;
                btn.style.transform = 'translate(' + ox.toFixed(2) + 'px,' + oy.toFixed(2) + 'px)';
                if (Math.abs(ox) > 0.05 || Math.abs(oy) > 0.05 || inside) {
                    rafId = requestAnimationFrame(loop);
                } else {
                    btn.style.transform = '';
                    rafId = null;
                }
            }

            btn.addEventListener('mouseenter', () => { inside = true; });
            btn.addEventListener('mousemove', e => {
                const r = btn.getBoundingClientRect();
                tx = (e.clientX - (r.left + r.width  / 2)) * STRENGTH;
                ty = (e.clientY - (r.top  + r.height / 2)) * STRENGTH;
                if (!rafId) rafId = requestAnimationFrame(loop);
            });
            btn.addEventListener('mouseleave', () => {
                inside = false; tx = 0; ty = 0;
                if (!rafId) rafId = requestAnimationFrame(loop);
            });
        });
    });

}());
