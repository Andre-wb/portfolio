'use strict';

// Архитектура вырезки букв в 3д табличках из CTA блока

(function () {

    // ========== ОПРЕДЕЛЕНИЕ ПРОИЗВОДИТЕЛЬНОСТИ ==========
    function detectPerformanceLevel() {
        // Быстрый тест производительности через замер времени рендеринга
        return new Promise((resolve) => {
            const startTime = performance.now();
            let frames = 0;

            function testFrame() {
                frames++;
                if (performance.now() - startTime >= 200) {
                    const fps = frames / 0.2;

                    // Определяем уровень качества
                    let level = 'medium'; // по умолчанию

                    // Аппаратные подсказки
                    const cores = navigator.hardwareConcurrency || 2;
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    const isLowEndMobile = isMobile && (cores <= 4 || /SM-|Moto|Redmi|RMX/i.test(navigator.userAgent));

                    if (fps > 50 && cores >= 6 && !isLowEndMobile) {
                        level = 'high';
                    } else if (fps < 30 || (isMobile && cores <= 4)) {
                        level = 'low';
                    } else if (fps < 40 || isMobile) {
                        level = 'medium';
                    }

                    console.log(`[CTA] Производительность: ${Math.round(fps)} FPS, ядер: ${cores}, уровень: ${level}`);
                    resolve(level);
                    return;
                }
                requestAnimationFrame(testFrame);
            }
            requestAnimationFrame(testFrame);
        });
    }

    // ========== НАСТРОЙКИ КАЧЕСТВА ==========
    let QUALITY = 'medium'; // будет установлено после детекта

    // Параметры геометрии в зависимости от качества
    function getGeometryParams() {
        switch (QUALITY) {
            case 'high':
                return {
                    bevelSegments: 100,
                    curveSegments: 100,
                    bevelEnabled: true,
                    bevelThickness: 0.035,
                    bevelSize: 0.035,
                    depth: PD
                };
            case 'medium':
                return {
                    bevelSegments: 48,
                    curveSegments: 48,
                    bevelEnabled: true,
                    bevelThickness: 0.03,
                    bevelSize: 0.03,
                    depth: PD
                };
            case 'low':
                return {
                    bevelSegments: 12,
                    curveSegments: 24,
                    bevelEnabled: false,
                    bevelThickness: 0,
                    bevelSize: 0,
                    depth: PD
                };
            default:
                return {
                    bevelSegments: 48,
                    curveSegments: 48,
                    bevelEnabled: true,
                    bevelThickness: 0.035,
                    bevelSize: 0.035,
                    depth: PD
                };
        }
    }

    // Параметры теней и освещения
    function getShadowParams() {
        switch (QUALITY) {
            case 'high':
                return {
                    mapSize: 2048,
                    blurSamples: 12,
                    bias: -0.001,
                    radius: 14,
                    shadowsEnabled: true
                };
            case 'medium':
                return {
                    mapSize: 1024,
                    blurSamples: 6,
                    bias: -0.0005,
                    radius: 8,
                    shadowsEnabled: true
                };
            case 'low':
                return {
                    mapSize: 512,
                    blurSamples: 2,
                    bias: -0.0001,
                    radius: 4,
                    shadowsEnabled: false
                };
        }
    }

    // Настройка материалов
    function getMaterialParams() {
        switch (QUALITY) {
            case 'high':
                return {
                    metalness: 0.55,
                    roughness: 0.20,
                    side: THREE.DoubleSide
                };
            case 'medium':
                return {
                    metalness: 0.5,
                    roughness: 0.35,
                    side: THREE.DoubleSide
                };
            case 'low':
                return {
                    metalness: 0.4,
                    roughness: 0.6,
                    side: THREE.DoubleSide
                };
        }
    }

    // Количество точек для классификации контуров
    function getClassificationPoints() {
        switch (QUALITY) {
            case 'high': return 48;
            case 'medium': return 32;
            case 'low': return 16;
            default: return 32;
        }
    }

    // Настройка размера шрифта, табличек и текста в них
    const VEL_SCALE = 25;
    const VEL_MAX   = 5.0;
    const VEL_DECAY = 0.90;

    const PW        = 3.8;
    const PH        = 1.30;
    const PD        = 0.5;
    const PR        = 0.16;
    const FONT_SIZE = 0.6;

    const CONFIGS = [
        { layer:'back',  text:'PYTHON',
            pos:[-2.9, 1.7,-1.3], rot:[ 0.002,-0.004, 0.001], par:{ x:-0.9, y: 0.7}, color:0x3b82f6 },
        { layer:'back',  text:'CSS',
            pos:[ 2.9,-1.5,-1.0], rot:[-0.001, 0.003,-0.002], par:{ x: 0.8, y:-0.6}, color:0x0ea5e9 },
        { layer:'mid',   text:'RUST',
            pos:[-1.9,-1.3, 0.0], rot:[ 0.003,-0.005, 0.002], par:{ x: 1.2, y:-1.0}, color:0x10b981 },
        { layer:'mid',   text:'JS',
            pos:[ 2.5, 1.3, 0.3], rot:[-0.002, 0.003,-0.003], par:{ x:-1.1, y: 0.9}, color:0x6366f1 },
        { layer:'front', text:'HTML',
            pos:[ 0.2,-0.1, 1.5], rot:[ 0.004, 0.006,-0.002], par:{ x: 1.4, y: 1.2}, color:0x00e1ff },
    ];

    // 1. Парсинг файла со шрифтом (.json)
    function parseAllPaths(font, text, fontSize) {
        const scale  = fontSize / font.data.resolution;
        const glyphs = font.data.glyphs;
        let offsetX  = 0;
        const paths  = [];

        for (let ci = 0; ci < text.length; ci++) {
            const char  = text[ci];
            const glyph = glyphs[char] || glyphs['?'];
            if (!glyph) continue;

            if (glyph.o) {
                const outline = glyph._outline ||
                    (glyph._outline = glyph.o.split(' '));

                let j = 0, path = null;

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
                            const x   = parseFloat(outline[j++]) * scale + offsetX;
                            const y   = parseFloat(outline[j++]) * scale;
                            path.quadraticCurveTo(cpx, cpy, x, y);
                            break;
                        }
                        case 'b': {
                            const cp1x = parseFloat(outline[j++]) * scale + offsetX;
                            const cp1y = parseFloat(outline[j++]) * scale;
                            const cp2x = parseFloat(outline[j++]) * scale + offsetX;
                            const cp2y = parseFloat(outline[j++]) * scale;
                            const x    = parseFloat(outline[j++]) * scale + offsetX;
                            const y    = parseFloat(outline[j++]) * scale;
                            path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                            break;
                        }
                    }
                }
                if (path) paths.push(path);
            }

            offsetX += glyph.ha * scale;
        }

        return paths;
    }

    // 2. Проверка наличия точки внутри полигона
    function pointInPolygon(pt, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            if (((yi > pt.y) !== (yj > pt.y)) &&
                (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    /* ────────────────────────────────────────────────────────
     * 3. Классификация контуров по глубине вложения (even-odd)
     * ──────────────────────────────────────────────────────── */
    function classifyPaths(paths, nPoints) {
        const samples = paths.map(p => p.getPoints(nPoints));
        const holePoints   = [];
        const islandPoints = [];

        for (let i = 0; i < samples.length; i++) {
            const testPt = samples[i][0];
            let depth = 0;
            for (let j = 0; j < samples.length; j++) {
                if (i !== j && pointInPolygon(testPt, samples[j])) depth++;
            }
            if (depth % 2 === 0) holePoints.push(samples[i]);
            else                  islandPoints.push(samples[i]);
        }

        return { holePoints, islandPoints };
    }

    // 4. Скругление и сглаживание углов
    function makeRoundedRect(w, h, r) {
        const s = new THREE.Shape();
        s.moveTo(-w/2+r, -h/2);
        s.lineTo( w/2-r, -h/2); s.quadraticCurveTo( w/2,-h/2,  w/2,-h/2+r);
        s.lineTo( w/2,   h/2-r); s.quadraticCurveTo( w/2, h/2,  w/2-r, h/2);
        s.lineTo(-w/2+r, h/2);   s.quadraticCurveTo(-w/2, h/2, -w/2,  h/2-r);
        s.lineTo(-w/2,  -h/2+r); s.quadraticCurveTo(-w/2,-h/2, -w/2+r,-h/2);
        return s;
    }

    // 5. Геометрии таблички и островов
    function buildGeometries(font, text) {
        const N_PTS = getClassificationPoints();

        const rawPaths = parseAllPaths(font, text, FONT_SIZE);

        // Центрируем
        const allPts = rawPaths.flatMap(p => p.getPoints(N_PTS));
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        allPts.forEach(p => {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
        });
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        // Сдвигаем все пути к центру
        const centeredPaths = rawPaths.map(path => {
            const shifted = new THREE.Path();
            const pts = path.getPoints(N_PTS);
            shifted.setFromPoints(pts.map(p => new THREE.Vector2(p.x - cx, p.y - cy)));
            return shifted;
        });

        const { holePoints, islandPoints } = classifyPaths(centeredPaths, N_PTS);

        const extrudeParams = getGeometryParams();

        // ── Табличка: добавляем все внешние контуры букв как отверстия
        const plaqueShape = makeRoundedRect(PW, PH, PR);
        holePoints.forEach(pts => {
            plaqueShape.holes.push(new THREE.Path(pts));
        });

        const plaqueGeo = new THREE.ExtrudeGeometry(plaqueShape, extrudeParams);
        plaqueGeo.translate(0, 0, -PD / 2);

        // ── Острова (O, P, B, R и т.д.): отдельные меши, та же глубина
        const islandGeos = islandPoints.map(pts => {
            const shape = new THREE.Shape(pts);
            const geo   = new THREE.ExtrudeGeometry(shape, {
                depth:         PD,
                bevelEnabled:  extrudeParams.bevelEnabled,
                bevelThickness: extrudeParams.bevelThickness,
                bevelSize:      extrudeParams.bevelSize,
                bevelSegments:  extrudeParams.bevelSegments,
                curveSegments:  extrudeParams.curveSegments,
            });
            geo.translate(0, 0, -PD / 2);
            return geo;
        });

        return { plaqueGeo, islandGeos };
    }

    // 6. Группа: табличка + острова, один материал
    function buildGroup(cfg, font) {
        const group = new THREE.Group();
        const { plaqueGeo, islandGeos } = buildGeometries(font, cfg.text);

        const matParams = getMaterialParams();
        const mat = new THREE.MeshStandardMaterial({
            color:     cfg.color,
            metalness: matParams.metalness,
            roughness: matParams.roughness,
            side:      matParams.side,
        });

        const plaque = new THREE.Mesh(plaqueGeo, mat);
        const shadowParams = getShadowParams();
        plaque.castShadow = plaque.receiveShadow = shadowParams.shadowsEnabled;
        group.add(plaque);

        islandGeos.forEach(geo => {
            const m = new THREE.Mesh(geo, mat);
            m.castShadow = m.receiveShadow = shadowParams.shadowsEnabled;
            group.add(m);
        });

        group.position.set(...cfg.pos);
        group.userData.rot  = cfg.rot;
        group.userData.par  = cfg.par;
        group.userData.base = group.position.clone();
        return group;
    }

    /* ── Освещение (адаптивное) ───────────────────────── */
    function addLights(scene) {
        const shadowParams = getShadowParams();
        const shadowsOn = shadowParams.shadowsEnabled;

        scene.add(new THREE.AmbientLight(0xffffff, QUALITY === 'low' ? 0.7 : 0.55));

        const key = new THREE.DirectionalLight(0x00e1ff, QUALITY === 'low' ? 0.9 : 1.4);
        key.position.set(5, 8, 6);
        if (shadowsOn) {
            key.castShadow = true;
            key.shadow.mapSize.set(shadowParams.mapSize, shadowParams.mapSize);
            key.shadow.camera.left = key.shadow.camera.bottom = -10;
            key.shadow.camera.right = key.shadow.camera.top   =  10;
            key.shadow.camera.near = 0.5; key.shadow.camera.far = 40;
            key.shadow.radius = shadowParams.radius;
            key.shadow.blurSamples = shadowParams.blurSamples;
            key.shadow.bias = shadowParams.bias;
        }
        scene.add(key);

        // На low отключаем дополнительный rim light
        if (QUALITY !== 'low') {
            const rim = new THREE.DirectionalLight(0x3b82f6, 0.9);
            rim.position.set(-4, -5, -4);
            scene.add(rim);
        }

        const fill = new THREE.DirectionalLight(0xffffff, QUALITY === 'low' ? 0.3 : 0.4);
        fill.position.set(0, 2, 8);
        scene.add(fill);

        // На low отключаем точечный свет
        if (QUALITY !== 'low') {
            const pt = new THREE.PointLight(0x0ea5e9, 0.7, 15);
            pt.position.set(0, 0, 4);
            scene.add(pt);
        }
    }

    /* ── Рендер ────────────────────────────────────────── */
    function makeRenderer(container, blur) {
        const cv = document.createElement('canvas');
        Object.assign(cv.style, {
            position:'absolute', top:'0', left:'0',
            width:'100%', height:'100%',
            pointerEvents:'none',
            filter: blur ? 'blur('+blur+')' : 'none',
        });
        container.appendChild(cv);
        const r = new THREE.WebGLRenderer({ canvas:cv, antialias: QUALITY !== 'low', alpha:true });
        r.setPixelRatio(QUALITY === 'low' ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2));
        r.setClearColor(0, 0);
        const shadowParams = getShadowParams();
        r.shadowMap.enabled = shadowParams.shadowsEnabled;
        if (shadowParams.shadowsEnabled) {
            r.shadowMap.type = QUALITY === 'low' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
        }
        return r;
    }

    function buildLayer(cfgs, font) {
        const scene  = new THREE.Scene();
        addLights(scene);
        const meshes = cfgs.map(c => {
            const g = buildGroup(c, font);
            scene.add(g);
            return g;
        });
        return { scene, meshes };
    }

    /* ── Инициализация с определением производительности ── */
    function init() {
        if (typeof THREE === 'undefined') { setTimeout(init, 50); return; }

        const wrapper = document.getElementById('ctaCanvas');
        if (!wrapper) return;

        const container = wrapper.parentElement;
        container.style.position = 'relative';
        container.style.overflow = 'visible';
        wrapper.style.display    = 'none';

        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 8;

        let rdrs = [];
        let layers = [];
        let animationActive = false;
        let rafId = null;

        // Сначала определяем производительность, потом запускаем 3D
        detectPerformanceLevel().then(level => {
            QUALITY = level;

            // Создаём рендереры с новым качеством
            rdrs = ['4px','1.5px',null].map(b => makeRenderer(container, b));

            function resize() {
                const w = container.clientWidth  || 400;
                const h = container.clientHeight || 400;
                rdrs.forEach(r => r.setSize(w, h, false));
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
            resize();
            window.addEventListener('resize', resize);

            // Загружаем шрифт и запускаем
            const FONT_URLS = [
                '/static/css/Erica_One/Erica_One_Regular.json',
                '/css/Erica_One/Erica_One_Regular.json',
            ];

            const loader = new THREE.FontLoader();
            let tried = 0;

            function tryLoad() {
                if (tried >= FONT_URLS.length) return;
                loader.load(
                    FONT_URLS[tried++],
                    font  => start(camera, rdrs, font),
                    undefined,
                    ()    => tryLoad()
                );
            }
            tryLoad();
        });

        function start(camera, rdrs, font) {
            layers = [
                buildLayer(CONFIGS.filter(c => c.layer==='back'),  font),
                buildLayer(CONFIGS.filter(c => c.layer==='mid'),   font),
                buildLayer(CONFIGS.filter(c => c.layer==='front'), font),
            ];

            let mx=0, my=0, smx=0, smy=0;
            let prevMx=0, prevMy=0, cursorVel=0;

            window.addEventListener('mousemove', e => {
                mx =  (e.clientX / innerWidth  - 0.5) * 2;
                my = -(e.clientY / innerHeight - 0.5) * 2;
                cursorVel = Math.min(Math.hypot(mx-prevMx, my-prevMy)*VEL_SCALE, VEL_MAX);
                prevMx=mx; prevMy=my;
            });

            function animate() {
                if (!animationActive) return;
                rafId = requestAnimationFrame(animate);
                smx += (mx-smx)*0.04; smy += (my-smy)*0.04;
                cursorVel *= VEL_DECAY;
                const spd = 1 + cursorVel;

                camera.position.x += (smx*0.25 - camera.position.x)*0.025;
                camera.position.y += (smy*0.20 - camera.position.y)*0.025;
                camera.lookAt(0, 0, 0);

                layers.forEach(({scene, meshes}, i) => {
                    meshes.forEach(m => {
                        m.rotation.x += m.userData.rot[0]*spd;
                        m.rotation.y += m.userData.rot[1]*spd;
                        m.rotation.z += m.userData.rot[2]*spd;
                        m.position.x = m.userData.base.x + smx*m.userData.par.x*0.28;
                        m.position.y = m.userData.base.y + smy*m.userData.par.y*0.28;
                    });
                    rdrs[i].render(scene, camera);
                });
            }

            animationActive = true;
            animate();

            const sec = document.getElementById('cta');
            if (sec) new IntersectionObserver(en => {
                if (en[0].isIntersecting) {
                    if (!rafId && animationActive) animate();
                } else {
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }, { threshold:0.05 }).observe(sec);
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    /* ── Магнитные кнопки ────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.cta-btn').forEach(btn => {
            let ox=0,oy=0,tx=0,ty=0,inside=false,rafId=null;
            const EASE=0.12, STR=0.38;
            function loop() {
                ox+=(tx-ox)*EASE; oy+=(ty-oy)*EASE;
                btn.style.transform='translate('+ox.toFixed(2)+'px,'+oy.toFixed(2)+'px)';
                if (Math.abs(ox)>0.05||Math.abs(oy)>0.05||inside) rafId=requestAnimationFrame(loop);
                else { btn.style.transform=''; rafId=null; }
            }
            btn.addEventListener('mouseenter',()=>{ inside=true; });
            btn.addEventListener('mousemove',e=>{
                const r=btn.getBoundingClientRect();
                tx=(e.clientX-(r.left+r.width/2))*STR;
                ty=(e.clientY-(r.top+r.height/2))*STR;
                if (!rafId) rafId=requestAnimationFrame(loop);
            });
            btn.addEventListener('mouseleave',()=>{
                inside=false; tx=0; ty=0;
                if (!rafId) rafId=requestAnimationFrame(loop);
            });
        });
    });

}());