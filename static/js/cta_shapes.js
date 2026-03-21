'use strict';

/* ─────────────────────────────────────────────────────────────
 * CTA — таблички с вырезом текста насквозь через Shape.holes
 * ───────────────────────────────────────────────────────────── */

(function () {

    const VEL_SCALE = 25;
    const VEL_MAX   = 5.0;
    const VEL_DECAY = 0.90;

    const PW   = 3.8;    // ширина таблички
    const PH   = 1.30;   // высота
    const PD   = 0.5;   // толщина
    const PR   = 0.16;   // радиус скругления
    const FONT_SIZE = 0.6; // размер шрифта (em)

    const CONFIGS = [
        { layer:'back',  text:'PYTHON',
            pos:[-2.9, 1.7,-1.3], rot:[ 0.002,-0.004, 0.001], par:{ x:-0.9, y: 0.7}, color:0x3b82f6 },
        { layer:'back',  text:'RUST',
            pos:[ 2.9,-1.5,-1.0], rot:[-0.001, 0.003,-0.002], par:{ x: 0.8, y:-0.6}, color:0x0ea5e9 },
        { layer:'mid',   text:'JS',
            pos:[-1.9,-1.3, 0.0], rot:[ 0.003,-0.005, 0.002], par:{ x: 1.2, y:-1.0}, color:0x10b981 },
        { layer:'mid',   text:'CSS',
            pos:[ 2.5, 1.3, 0.3], rot:[-0.002, 0.003,-0.003], par:{ x:-1.1, y: 0.9}, color:0x6366f1 },
        { layer:'front', text:'HTML',
            pos:[ 0.2,-0.1, 1.5], rot:[ 0.004, 0.006,-0.002], par:{ x: 1.4, y: 1.2}, color:0x00e1ff },
    ];

    /* ── Скруглённый прямоугольник как THREE.Shape ───────── */
    function makeRoundedRect(w, h, r) {
        const s = new THREE.Shape();
        s.moveTo(-w/2+r, -h/2);
        s.lineTo( w/2-r, -h/2); s.quadraticCurveTo( w/2,-h/2,  w/2,-h/2+r);
        s.lineTo( w/2,   h/2-r); s.quadraticCurveTo( w/2, h/2,  w/2-r, h/2);
        s.lineTo(-w/2+r, h/2);   s.quadraticCurveTo(-w/2, h/2, -w/2,  h/2-r);
        s.lineTo(-w/2,  -h/2+r); s.quadraticCurveTo(-w/2,-h/2, -w/2+r,-h/2);
        return s;
    }

    /* ── Геометрия таблички с вырезом текста ─────────────────
     * 1. Строим скруглённый прямоугольник
     * 2. Генерируем формы букв через font.generateShapes
     * 3. Центрируем текст и добавляем каждую букву как hole
     * 4. ExtrudeGeometry — дырки проходят насквозь
     * ────────────────────────────────────────────────────── */
    function makePlaqueWithCutout(font, text) {
        const plaqueShape = makeRoundedRect(PW, PH, PR);

        // Получаем формы букв
        const letterShapes = font.generateShapes(text, FONT_SIZE);

        // Вычисляем bounding box текста для центрирования
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        letterShapes.forEach(shape => {
            const pts = shape.getPoints(8);
            pts.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
        });
        const textW  = maxX - minX;
        const textH  = maxY - minY;
        const ox     = -(minX + textW / 2); // смещение по X для центрирования
        const oy     = -(minY + textH / 2); // смещение по Y

        // Добавляем каждую букву как отверстие в табличке
        // extractPoints() возвращает точки с правильным winding order
        letterShapes.forEach(shape => {
            const extracted = shape.extractPoints(12);

            // Внешний контур буквы — дырка в табличке
            const outerPts = extracted.shape;
            if (!outerPts || outerPts.length < 3) return;

            const outerHole = new THREE.Path(
                outerPts.map(p => new THREE.Vector2(p.x + ox, p.y + oy))
            );
            plaqueShape.holes.push(outerHole);

            // Внутренние контуры (островки внутри 'o', 'p', 'R' и т.д.)
            // Добавляем обратно — они "восстанавливают" материал внутри буквы
            if (extracted.holes && extracted.holes.length > 0) {
                extracted.holes.forEach(holePts => {
                    if (!holePts || holePts.length < 3) return;
                    const innerHole = new THREE.Path(
                        holePts.map(p => new THREE.Vector2(p.x + ox, p.y + oy))
                    );
                    plaqueShape.holes.push(innerHole);
                });
            }
        });

        const geo = new THREE.ExtrudeGeometry(plaqueShape, {
            depth:           PD,
            bevelEnabled:    true,
            bevelThickness:  0.035,
            bevelSize:       0.035,
            bevelSegments:   5,
            curveSegments:   16,
        });
        geo.translate(0, 0, -PD / 2);
        return geo;
    }

    /* ── Построить группу ────────────────────────────────── */
    function buildGroup(cfg, font) {
        const group = new THREE.Group();

        const geo = makePlaqueWithCutout(font, cfg.text);
        const mat = new THREE.MeshStandardMaterial({
            color:     cfg.color,
            metalness: 0.55,
            roughness: 0.20,
            side:      THREE.DoubleSide, // видно изнутри прорезей
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = mesh.receiveShadow = true;
        group.add(mesh);

        group.position.set(...cfg.pos);
        group.userData.rot  = cfg.rot;
        group.userData.par  = cfg.par;
        group.userData.base = group.position.clone();
        return group;
    }

    /* ── Освещение ───────────────────────────────────────── */
    function addLights(scene) {
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));

        const key = new THREE.DirectionalLight(0x00e1ff, 1.4);
        key.position.set(5, 8, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = key.shadow.camera.bottom = -10;
        key.shadow.camera.right = key.shadow.camera.top   =  10;
        key.shadow.camera.near = 0.5; key.shadow.camera.far = 40;
        key.shadow.radius = 14; key.shadow.blurSamples = 12;
        key.shadow.bias = -0.001;
        scene.add(key);

        const rim = new THREE.DirectionalLight(0x3b82f6, 0.9);
        rim.position.set(-4, -5, -4);
        scene.add(rim);

        const fill = new THREE.DirectionalLight(0xffffff, 0.4);
        fill.position.set(0, 2, 8);
        scene.add(fill);

        const pt = new THREE.PointLight(0x0ea5e9, 0.7, 15);
        pt.position.set(0, 0, 4);
        scene.add(pt);
    }

    /* ── Renderer ────────────────────────────────────────── */
    function makeRenderer(container, blur) {
        const cv = document.createElement('canvas');
        Object.assign(cv.style, {
            position:'absolute', top:'0', left:'0',
            width:'100%', height:'100%',
            pointerEvents:'none',
            filter: blur ? 'blur('+blur+')' : 'none',
        });
        container.appendChild(cv);
        const r = new THREE.WebGLRenderer({ canvas:cv, antialias:true, alpha:true });
        r.setPixelRatio(Math.min(devicePixelRatio, 2));
        r.setClearColor(0, 0);
        r.shadowMap.enabled = true;
        r.shadowMap.type    = THREE.PCFSoftShadowMap;
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

    /* ── Инициализация ───────────────────────────────────── */
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

        const rdrs = ['4px','1.5px',null].map(b => makeRenderer(container, b));

        function resize() {
            const w = container.clientWidth  || 400;
            const h = container.clientHeight || 400;
            rdrs.forEach(r => r.setSize(w, h, false));
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener('resize', resize);

        // Пробуем два CDN
        const FONT_URLS = [
            'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/fonts/helvetiker_bold.typeface.json',
            'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
        ];

        const loader = new THREE.FontLoader();
        let tried = 0;

        function tryLoad() {
            if (tried >= FONT_URLS.length) return; // без шрифта не запускаем — вырез невозможен
            loader.load(
                FONT_URLS[tried++],
                font  => start(camera, rdrs, font),
                undefined,
                ()    => tryLoad()
            );
        }
        tryLoad();
    }

    function start(camera, rdrs, font) {
        const layers = [
            buildLayer(CONFIGS.filter(c => c.layer==='back'),  font),
            buildLayer(CONFIGS.filter(c => c.layer==='mid'),   font),
            buildLayer(CONFIGS.filter(c => c.layer==='front'), font),
        ];

        let mx=0, my=0, smx=0, smy=0;
        let prevMx=0, prevMy=0, cursorVel=0, rafId=null;

        window.addEventListener('mousemove', e => {
            mx =  (e.clientX / innerWidth  - 0.5) * 2;
            my = -(e.clientY / innerHeight - 0.5) * 2;
            cursorVel = Math.min(Math.hypot(mx-prevMx, my-prevMy)*VEL_SCALE, VEL_MAX);
            prevMx=mx; prevMy=my;
        });

        function animate() {
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
        animate();

        const sec = document.getElementById('cta');
        if (sec) new IntersectionObserver(en => {
            if (en[0].isIntersecting) { if (!rafId) animate(); }
            else { cancelAnimationFrame(rafId); rafId=null; }
        }, { threshold:0.05 }).observe(sec);
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