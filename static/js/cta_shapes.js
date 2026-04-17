'use strict';

// Улучшенная система адаптивного качества 3D табличек CTA
// Автоопределение производительности + динамическое снижение качества при просадках

(function () {
    'use strict';

    // 1. УЛУЧШЕННЫЙ ДЕТЕКТОР ПРОИЗВОДИТЕЛЬНОСТИ

    const PERF = {
        level: 'medium',      // 'low' | 'medium' | 'high'
        targetFPS: 60,
        currentFPS: 60,
        frameTime: 16.67,
        adaptiveScale: 1,     // Динамическое снижение разрешения (0.5 - 1.0)
        isPowerSave: false,   // Режим экономии заряда
        isThermalThrottled: false,
        droppedFrames: 0,
        lastAdaptation: 0,

        quickChecks() {
            const ua = navigator.userAgent;
            const cores = navigator.hardwareConcurrency || 2;
            const memory = navigator.deviceMemory || 4;

            if ('getBattery' in navigator) {
                navigator.getBattery().then(b => {
                    this.isPowerSave = b.charging === false && (b.level < 0.2 || b.saveData);
                });
            }

            const lowEndPatterns = /SM-A1|SM-J|Redmi [0-6]|Moto E|Moto G[0-4]|RMX[0-9]{3}[0-4]|Android [4-8]/i;
            const isLowEndUA = lowEndPatterns.test(ua);

            const iOSMatch = ua.match(/OS (\d+)_/);
            const isOldIOS = iOSMatch && parseInt(iOSMatch[1]) < 15;

            const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 600;

            if (isLowEndUA || isOldIOS || (cores <= 4 && memory <= 2) || this.isPowerSave) {
                return 'low';
            }
            if (cores >= 8 && memory >= 8 && !isSmallScreen) {
                return 'high';
            }
            return 'medium';
        },

        async measureFPS(duration = 300) {
            return new Promise((resolve) => {
                let frames = 0;
                let lastTime = performance.now();
                const startTime = lastTime;
                const times = [];

                function frame(now) {
                    const delta = now - lastTime;
                    lastTime = now;
                    times.push(delta);
                    frames++;

                    if (now - startTime < duration) {
                        requestAnimationFrame(frame);
                    } else {
                        const cleanTimes = times.slice(2);
                        const avgFrameTime = cleanTimes.reduce((a, b) => a + b, 0) / cleanTimes.length;
                        const fps = 1000 / avgFrameTime;

                        const variance = cleanTimes.reduce((sum, t) => sum + Math.pow(t - avgFrameTime, 2), 0) / cleanTimes.length;
                        const isStable = variance < 100;

                        resolve({
                            fps: Math.round(fps),
                            frameTime: avgFrameTime,
                            isStable,
                            dropped: frames < (duration / 16.67) * 0.8 // Ожидали 60fps, получили меньше
                        });
                    }
                }
                requestAnimationFrame(frame);
            });
        },

        async init() {
            const quick = this.quickChecks();

            const measured = await this.measureFPS(250);

            this.currentFPS = measured.fps;
            this.frameTime = measured.frameTime;
            this.droppedFrames = measured.dropped;

            if (quick === 'low' || measured.fps < 35 || !measured.isStable) {
                this.level = 'low';
                this.adaptiveScale = 0.75;
                this.targetFPS = 30;
            } else if (quick === 'high' && measured.fps > 55 && measured.isStable) {
                this.level = 'high';
                this.adaptiveScale = 1.0;
                this.targetFPS = 60;
            } else {
                this.level = 'medium';
                this.adaptiveScale = measured.fps < 45 ? 0.75 : 1.0;
                this.targetFPS = measured.fps < 45 ? 30 : 60;
            }

            console.log(`[CTA] Performance: ${this.level}, FPS: ${measured.fps}, Scale: ${this.adaptiveScale}`);
            return this.level;
        },

        adapt(frameTime) {
            const now = performance.now();
            if (now - this.lastAdaptation < 1000) return; // Не чаще раза в секунду

            this.frameTime = frameTime;
            const instantFPS = 1000 / frameTime;

            if (instantFPS < this.targetFPS * 0.85 && this.adaptiveScale > 0.5) {
                this.adaptiveScale = Math.max(0.5, this.adaptiveScale - 0.1);
                this.lastAdaptation = now;
                console.log(`[CTA] Downgraded: scale=${this.adaptiveScale.toFixed(2)}`);
                return true; // Нужен resize рендера
            }

            if (instantFPS > this.targetFPS * 1.1 && this.adaptiveScale < 1.0 && this.level !== 'low') {
                this.adaptiveScale = Math.min(1.0, this.adaptiveScale + 0.05);
                this.lastAdaptation = now;
                return true;
            }

            return false;
        }
    };

    // 2. ПАРАМЕТРЫ КАЧЕСТВА ПО УРОВНЯМ

    function getGeometryParams() {
        const base = {
            low: {
                bevelSegments: 8,
                curveSegments: 24,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                depth: 0.35
            },
            medium: {
                bevelSegments: 24,
                curveSegments: 32,
                bevelEnabled: true,
                bevelThickness: 0.025,
                bevelSize: 0.025,
                depth: 0.4
            },
            high: {
                bevelSegments: 48,
                curveSegments: 64,
                bevelEnabled: true,
                bevelThickness: 0.035,
                bevelSize: 0.035,
                depth: 0.5
            }
        };
        return base[PERF.level] || base.medium;
    }

    function getShadowParams() {
        const base = {
            low: {
                mapSize: 1024,
                blurSamples: 2,
                bias: -0.00025,
                radius: 4,
                shadowsEnabled: false
            },
            medium: {
                mapSize: 1024,
                blurSamples: 4,
                bias: -0.0005,
                radius: 6,
                shadowsEnabled: true
            },
            high: {
                mapSize: 2048,
                blurSamples: 8,
                bias: -0.001,
                radius: 12,
                shadowsEnabled: true
            }
        };
        return base[PERF.level] || base.medium;
    }

    function getMaterialParams() {
        const base = {
            low: {
                metalness: 0.3,
                roughness: 0.6,
                side: THREE.FrontSide
            },
            medium: {
                metalness: 0.45,
                roughness: 0.4,
                side: THREE.DoubleSide
            },
            high: {
                metalness: 0.55,
                roughness: 0.2,
                side: THREE.DoubleSide
            }
        };
        return base[PERF.level] || base.medium;
    }

    function getClassificationPoints() {
        return { low: 16, medium: 24, high: 48 }[PERF.level] || 24;
    }

    function getPixelRatio() {
        const dpr = window.devicePixelRatio || 1;
        const maxDpr = PERF.level === 'low' ? 2 : (PERF.level === 'medium' ? 1.5 : 2);
        return Math.min(dpr, maxDpr) * PERF.adaptiveScale;
    }

    // 3. КОНФИГУРАЦИЯ И УТИЛИТЫ

    const VEL_SCALE = 25;
    const VEL_MAX = 5.0;
    const VEL_DECAY = 0.90;

    // Упрощённые размеры для слабых устройств
    const SIZES = {
        low: { PW: 3.6, PH: 1.2, PD: 0.4, PR: 0.14, FONT_SIZE: 0.55 },
        medium: { PW: 3.6, PH: 1.2, PD: 0.4, PR: 0.14, FONT_SIZE: 0.55 },
        high: { PW: 3.8, PH: 1.30, PD: 0.5, PR: 0.16, FONT_SIZE: 0.6 }
    };

    const { PW, PH, PD, PR, FONT_SIZE } = SIZES[PERF.level] || SIZES.medium;

    const ALL_CONFIGS = [
        { layer: 'back', text: 'PYTHON', pos: [-2.9, 1.7, -1.3], rot: [0.002, -0.004, 0.001], par: { x: -0.9, y: 0.7 }, color: 0x3b82f6 },
        { layer: 'back', text: 'CSS', pos: [2.9, -1.5, -1.0], rot: [-0.001, 0.003, -0.002], par: { x: 0.8, y: -0.6 }, color: 0x0ea5e9 },
        { layer: 'mid', text: 'RUST', pos: [-1.9, -1.3, 0.0], rot: [0.003, -0.005, 0.002], par: { x: 1.2, y: -1.0 }, color: 0x10b981 },
        { layer: 'mid', text: 'JS', pos: [2.5, 1.3, 0.3], rot: [-0.002, 0.003, -0.003], par: { x: -1.1, y: 0.9 }, color: 0x6366f1 },
        { layer: 'front', text: 'HTML', pos: [0.2, -0.1, 1.5], rot: [0.004, 0.006, -0.002], par: { x: 1.4, y: 1.2 }, color: 0x00e1ff },
    ];

    const CONFIGS = ALL_CONFIGS;

    // 4. ПАРСИНГ ШРИФТА И ГЕОМЕТРИЯ (оптимизировано)

    function parseAllPaths(font, text, fontSize) {
        const scale = fontSize / font.data.resolution;
        const glyphs = font.data.glyphs;
        let offsetX = 0;
        const paths = [];

        for (let ci = 0; ci < text.length; ci++) {
            const char = text[ci];
            const glyph = glyphs[char] || glyphs['?'];
            if (!glyph || !glyph.o) {
                offsetX += (glyph?.ha || 600) * scale;
                continue;
            }

            const outline = glyph._outline || (glyph._outline = glyph.o.split(' '));
            let j = 0;
            let path = null;

            while (j < outline.length) {
                const cmd = outline[j++];
                switch (cmd) {
                    case 'm': {
                        if (path) paths.push(path);
                        const x = parseFloat(outline[j++]) * scale + offsetX;
                        const y = parseFloat(outline[j++]) * scale;
                        path = new THREE.Path();
                        path.moveTo(x, y);
                        break;
                    }
                    case 'l': {
                        const x = parseFloat(outline[j++]) * scale + offsetX;
                        const y = parseFloat(outline[j++]) * scale;
                        path.lineTo(x, y);
                        break;
                    }
                    case 'q': {
                        const cpx = parseFloat(outline[j++]) * scale + offsetX;
                        const cpy = parseFloat(outline[j++]) * scale;
                        const x = parseFloat(outline[j++]) * scale + offsetX;
                        const y = parseFloat(outline[j++]) * scale;
                        path.quadraticCurveTo(cpx, cpy, x, y);
                        break;
                    }
                    case 'b': {
                        const cp1x = parseFloat(outline[j++]) * scale + offsetX;
                        const cp1y = parseFloat(outline[j++]) * scale;
                        const cp2x = parseFloat(outline[j++]) * scale + offsetX;
                        const cp2y = parseFloat(outline[j++]) * scale;
                        const x = parseFloat(outline[j++]) * scale + offsetX;
                        const y = parseFloat(outline[j++]) * scale;
                        path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                        break;
                    }
                }
            }
            if (path) paths.push(path);
            offsetX += glyph.ha * scale;
        }
        return paths;
    }

    function pointInPolygon(pt, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            if (((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    function classifyPaths(paths, nPoints) {
        const samples = paths.map(p => p.getPoints(nPoints));
        const holePoints = [];
        const islandPoints = [];

        for (let i = 0; i < samples.length; i++) {
            const testPt = samples[i][0];
            let depth = 0;
            for (let j = 0; j < samples.length; j++) {
                if (i !== j && pointInPolygon(testPt, samples[j])) depth++;
            }
            if (depth % 2 === 0) holePoints.push(samples[i]);
            else islandPoints.push(samples[i]);
        }
        return { holePoints, islandPoints };
    }

    function makeRoundedRect(w, h, r) {
        const s = new THREE.Shape();
        s.moveTo(-w / 2 + r, -h / 2);
        s.lineTo(w / 2 - r, -h / 2);
        s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        s.lineTo(w / 2, h / 2 - r);
        s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        s.lineTo(-w / 2 + r, h / 2);
        s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        s.lineTo(-w / 2, -h / 2 + r);
        s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
        return s;
    }

    function buildGeometries(font, text) {
        const N_PTS = getClassificationPoints();
        const rawPaths = parseAllPaths(font, text, FONT_SIZE);

        const allPts = rawPaths.flatMap(p => p.getPoints(N_PTS));
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for (const p of allPts) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        const centeredPaths = rawPaths.map(path => {
            const shifted = new THREE.Path();
            const pts = path.getPoints(N_PTS);
            shifted.setFromPoints(pts.map(p => new THREE.Vector2(p.x - cx, p.y - cy)));
            return shifted;
        });

        const { holePoints, islandPoints } = classifyPaths(centeredPaths, N_PTS);
        const extrudeParams = getGeometryParams();

        const plaqueShape = makeRoundedRect(PW, PH, PR);
        holePoints.forEach(pts => plaqueShape.holes.push(new THREE.Path(pts)));

        const plaqueGeo = new THREE.ExtrudeGeometry(plaqueShape, extrudeParams);
        plaqueGeo.translate(0, 0, -PD / 2);

        const islandGeos = islandPoints.map(pts => {
            const shape = new THREE.Shape(pts);
            const geo = new THREE.ExtrudeGeometry(shape, {
                depth: PD,
                bevelEnabled: extrudeParams.bevelEnabled,
                bevelThickness: extrudeParams.bevelThickness,
                bevelSize: extrudeParams.bevelSize,
                bevelSegments: extrudeParams.bevelSegments,
                curveSegments: extrudeParams.curveSegments,
            });
            geo.translate(0, 0, -PD / 2);
            return geo;
        });

        return { plaqueGeo, islandGeos };
    }

    function buildGroup(cfg, font) {
        const group = new THREE.Group();
        const { plaqueGeo, islandGeos } = buildGeometries(font, cfg.text);

        const matParams = getMaterialParams();
        const mat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            metalness: matParams.metalness,
            roughness: matParams.roughness,
            side: matParams.side,
        });

        const shadowParams = getShadowParams();
        const plaque = new THREE.Mesh(plaqueGeo, mat);
        plaque.castShadow = plaque.receiveShadow = shadowParams.shadowsEnabled;
        group.add(plaque);

        islandGeos.forEach(geo => {
            const m = new THREE.Mesh(geo, mat);
            m.castShadow = m.receiveShadow = shadowParams.shadowsEnabled;
            group.add(m);
        });

        group.position.set(...cfg.pos);
        group.userData.rot = cfg.rot;
        group.userData.par = cfg.par;
        group.userData.base = group.position.clone();
        return group;
    }

    // 5. ОСВЕЩЕНИЕ (упрощённое для слабых устройств)

    function addLights(scene) {
        const shadowParams = getShadowParams();
        const shadowsOn = shadowParams.shadowsEnabled;

        scene.add(new THREE.AmbientLight(0xffffff, PERF.level === 'low' ? 0.9 : 0.5));

        const key = new THREE.DirectionalLight(0x00e1ff, PERF.level === 'low' ? 1.0 : 1.2);
        key.position.set(5, 8, 6);
        if (shadowsOn) {
            key.castShadow = true;
            key.shadow.mapSize.set(shadowParams.mapSize, shadowParams.mapSize);
            key.shadow.camera.left = key.shadow.camera.bottom = -8;
            key.shadow.camera.right = key.shadow.camera.top = 8;
            key.shadow.camera.near = 0.5;
            key.shadow.camera.far = 30;
            key.shadow.radius = shadowParams.radius;
            key.shadow.blurSamples = shadowParams.blurSamples;
            key.shadow.bias = shadowParams.bias;
        }
        scene.add(key);

        if (PERF.level !== 'low') {
            const rim = new THREE.DirectionalLight(0x3b82f6, 0.6);
            rim.position.set(-3, -4, -3);
            scene.add(rim);

            const fill = new THREE.DirectionalLight(0xffffff, 0.3);
            fill.position.set(0, 2, 6);
            scene.add(fill);
        }
    }

    // 6. РЕНДЕРИНГ С АДАПТИВНЫМ РАЗРЕШЕНИЕМ

    function makeRenderer(container, blur) {
        const cv = document.createElement('canvas');
        Object.assign(cv.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            filter: blur ? `blur(${blur})` : 'none',
            // GPU ускорение
            transform: 'translateZ(0)',
            willChange: 'transform',
        });
        container.appendChild(cv);

        const r = new THREE.WebGLRenderer({
            canvas: cv,
            antialias: PERF.level === 'high',
            alpha: true,
            powerPreference: PERF.level === 'low' ? 'low-power' : 'high-performance',
        });

        r.setPixelRatio(getPixelRatio());
        r.setClearColor(0, 0);

        const shadowParams = getShadowParams();
        r.shadowMap.enabled = shadowParams.shadowsEnabled;
        if (shadowParams.shadowsEnabled) {
            r.shadowMap.type = PERF.level === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
        }

        return r;
    }

    function buildLayer(cfgs, font) {
        const scene = new THREE.Scene();
        addLights(scene);
        const meshes = cfgs.map(c => {
            const g = buildGroup(c, font);
            scene.add(g);
            return g;
        });
        return { scene, meshes };
    }

    // 7. ИНИЦИАЛИЗАЦИЯ И АНИМАЦИЯ С FPS ЛИМИТОМ

    function init() {
        if (typeof THREE === 'undefined') {
            setTimeout(init, 50);
            return;
        }

        const wrapper = document.getElementById('ctaCanvas');
        if (!wrapper) return;

        const container = wrapper.parentElement;
        container.style.position = 'relative';
        container.style.overflow = 'visible';
        wrapper.style.display = 'none';

        // Сначала детектим производительность, потом создаём 3D
        PERF.init().then(() => {
            start(container, wrapper);
        });
    }

    function start(container, wrapper) {
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 8;

        const blurAmounts = PERF.level === 'low' ? [null, null, null] : (PERF.level === 'medium' ? ['2px', null, null] : ['4px', '1.5px', null]);
        const rdrs = blurAmounts.map(b => makeRenderer(container, b));

        function resize() {
            const w = container.clientWidth || 400;
            const h = container.clientHeight || 400;
            const pixelRatio = getPixelRatio();

            rdrs.forEach(r => {
                r.setPixelRatio(pixelRatio);
                r.setSize(w, h, false);
            });

            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }

        resize();

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resize, 200);
        });

        // Шрифты (принимает только .json)
        const FONT_URLS = [
            '/static/css/Erica_One/Erica_One_Regular.json',
            '/css/Erica_One/Erica_One_Regular.json',
            'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', // Fallback
        ];

        const loader = new THREE.FontLoader();
        let tried = 0;

        function tryLoad() {
            if (tried >= FONT_URLS.length) {
                console.warn('[CTA] Font load failed');
                return;
            }
            loader.load(
                FONT_URLS[tried++],
                font => initScene(camera, rdrs, font, container),
                undefined,
                () => tryLoad()
            );
        }
        tryLoad();
    }

    function initScene(camera, rdrs, font, container) {
        const layers = [
            buildLayer(CONFIGS.filter(c => c.layer === 'back'), font),
            buildLayer(CONFIGS.filter(c => c.layer === 'mid'), font),
            buildLayer(CONFIGS.filter(c => c.layer === 'front'), font),
        ];

        // Интерактивность
        let mx = 0, my = 0, smx = 0, smy = 0;
        let prevMx = 0, prevMy = 0, cursorVel = 0;
        let isHovering = false;

        // Throttled mousemove (16ms ≈ 60fps)
        let lastMouseMove = 0;
        window.addEventListener('mousemove', e => {
            const now = performance.now();
            if (now - lastMouseMove < 16) return;
            lastMouseMove = now;

            mx = (e.clientX / innerWidth - 0.5) * 2;
            my = -(e.clientY / innerHeight - 0.5) * 2;
            cursorVel = Math.min(Math.hypot(mx - prevMx, my - prevMy) * VEL_SCALE, VEL_MAX);
            prevMx = mx;
            prevMy = my;
            isHovering = true;
        });

        // Отключаем анимацию когда курсор не двигается
        let hoverTimeout;
        window.addEventListener('mousemove', () => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => { isHovering = false; }, 100);
        });

        // Animation loop с FPS limit
        let animationActive = false;
        let rafId = null;
        let lastFrameTime = 0;
        const targetFrameInterval = 1000 / PERF.targetFPS;

        function animate(now) {
            if (!animationActive) return;
            rafId = requestAnimationFrame(animate);

            // FPS limiting
            const elapsed = now - lastFrameTime;
            if (elapsed < targetFrameInterval) return;
            lastFrameTime = now - (elapsed % targetFrameInterval);

            // Адаптация качества
            const frameTime = performance.now() - now;
            const needsResize = PERF.adapt(frameTime);
            if (needsResize) {
                const w = container.clientWidth || 400;
                const h = container.clientHeight || 400;
                rdrs.forEach(r => {
                    r.setPixelRatio(getPixelRatio());
                    r.setSize(w, h, false);
                });
            }

            // Плавное следование за мышью (не обновляем если не двигается)
            if (isHovering || Math.abs(smx - mx) > 0.001) {
                smx += (mx - smx) * 0.04;
                smy += (my - smy) * 0.04;
            }

            cursorVel *= VEL_DECAY;
            const spd = 1 + cursorVel;

            // Камера
            camera.position.x += (smx * 0.25 - camera.position.x) * 0.025;
            camera.position.y += (smy * 0.20 - camera.position.y) * 0.025;
            camera.lookAt(0, 0, 0);

            // Рендер слоёв
            layers.forEach(({ scene, meshes }, i) => {
                meshes.forEach(m => {
                    m.rotation.x += m.userData.rot[0] * spd;
                    m.rotation.y += m.userData.rot[1] * spd;
                    m.rotation.z += m.userData.rot[2] * spd;
                    m.position.x = m.userData.base.x + smx * m.userData.par.x * 0.28;
                    m.position.y = m.userData.base.y + smy * m.userData.par.y * 0.28;
                });
                if (rdrs[i]) rdrs[i].render(scene, camera);
            });
        }

        // Intersection Observer для паузы
        const sec = document.getElementById('cta');
        if (sec) {
            new IntersectionObserver(entries => {
                const visible = entries[0].isIntersecting;
                if (visible && !animationActive) {
                    animationActive = true;
                    lastFrameTime = performance.now();
                    rafId = requestAnimationFrame(animate);
                } else if (!visible && animationActive) {
                    animationActive = false;
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }, { threshold: 0.05, rootMargin: '50px' }).observe(sec);
        } else {
            animationActive = true;
            rafId = requestAnimationFrame(animate);
        }

        // Visibility API - пауза когда вкладка неактивна
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                animationActive = false;
                if (rafId) cancelAnimationFrame(rafId);
            } else if (sec && !animationActive) {
                // Проверим видимость секции перед возобновлением
                const rect = sec.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    animationActive = true;
                    rafId = requestAnimationFrame(animate);
                }
            }
        });
    }

    // 8. МАГНИТНЫЕ КНОПКИ

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.cta-btn').forEach(btn => {
            let ox = 0, oy = 0, tx = 0, ty = 0;
            let inside = false;
            let rafId = null;
            const EASE = 0.12;
            const STR = 0.38;

            // Проверяем поддержку hover (не тач)
            const isTouch = window.matchMedia('(pointer: coarse)').matches;
            if (isTouch) return; // Отключаем на тач-устройствах

            function loop() {
                ox += (tx - ox) * EASE;
                oy += (ty - oy) * EASE;
                btn.style.transform = `translate(${ox.toFixed(2)}px,${oy.toFixed(2)}px)`;

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
                tx = (e.clientX - (r.left + r.width / 2)) * STR;
                ty = (e.clientY - (r.top + r.height / 2)) * STR;
                if (!rafId) rafId = requestAnimationFrame(loop);
            });

            btn.addEventListener('mouseleave', () => {
                inside = false;
                tx = 0;
                ty = 0;
                if (!rafId) rafId = requestAnimationFrame(loop);
            });
        });
    });

    // Старт
    document.addEventListener('DOMContentLoaded', init);

})();