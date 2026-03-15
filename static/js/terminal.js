'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.getElementById('terminal-body');
    if (!terminal) return;

    // ── Утилиты ────────────────────────────────────────────────────

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // Печатает текст посимвольно в элемент
    async function typeInto(el, text, speed = 68) {
        for (const ch of text) {
            el.textContent += ch;
            await sleep(speed + Math.random() * 40);
        }
    }

    // Добавляет новую строку с промптом и печатает команду
    async function typeCommand(cmd) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = '<span class="prompt">andrey@portfolio:~$</span><span class="cmd-text"></span>';
        terminal.appendChild(line);
        scrollTerminal();

        const cmdEl = line.querySelector('.cmd-text');
        await sleep(320);
        await typeInto(cmdEl, ' ' + cmd, 72);
        await sleep(180); // пауза перед "enter"
    }

    // Добавляет блок вывода
    function addOutput(html, cls = '') {
        const out = document.createElement('div');
        out.className = 'terminal-output' + (cls ? ' ' + cls : '');
        out.innerHTML = html;
        out.style.opacity = '0';
        terminal.appendChild(out);
        scrollTerminal();
        // Плавное появление
        requestAnimationFrame(() => {
            out.style.transition = 'opacity 0.25s ease';
            out.style.opacity = '1';
        });
        return out;
    }

    // Добавляет строки вывода по одной с задержкой
    async function printLines(lines, delay = 110) {
        for (const line of lines) {
            await sleep(delay);
            addOutput(line);
            scrollTerminal();
        }
    }

    // Имитация прогресс-бара pip install
    async function fakePipInstall(packages) {
        const out = addOutput('');
        for (const pkg of packages) {
            out.innerHTML += `<span class="out-muted">Collecting </span><span class="out-accent">${pkg}</span><br>`;
            scrollTerminal();
            await sleep(160 + Math.random() * 120);
        }
        await sleep(120);
        out.innerHTML += `<span class="out-green">Successfully resolved dependencies</span><br>`;
        scrollTerminal();
    }

    // Имитация загрузки данных (для achievements)
    async function fakeLoading(label) {
        const out = addOutput(`<span class="out-muted">${label}</span> <span class="loading-dots"></span>`);
        const dots = out.querySelector('.loading-dots');
        let i = 0;
        await new Promise(resolve => {
            const iv = setInterval(() => {
                dots.textContent = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'][i++ % 10];
                if (i >= 14) { clearInterval(iv); resolve(); }
            }, 80);
        });
        dots.textContent = '';
        out.innerHTML = `<span class="out-muted">${label}</span> <span class="out-green">done</span>`;
        scrollTerminal();
        await sleep(120);
    }

    // Убирает мигающий курсор из последней строки
    function removeCursor() {
        const cur = terminal.querySelector('.cursor-blink');
        if (cur) cur.remove();
    }

    // Добавляет строку с курсором в конец
    function appendIdleLine() {
        removeCursor();
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = '<span class="prompt">andrey@portfolio:~$</span> <span class="cursor-blink">█</span>';
        terminal.appendChild(line);
        scrollTerminal();
    }

    function scrollTerminal() {
        terminal.scrollTop = terminal.scrollHeight;
    }

    // ── Основной сценарий ───────────────────────────────────────────

    async function runTerminal() {
        // Небольшая пауза после появления окна
        await sleep(600);

        // ── whoami ──────────────────────────────────────────
        removeCursor();
        await typeCommand('whoami');
        await sleep(220);
        await printLines([
            'Андрей Караваев — fullstack-разработчик, 16 лет.',
            'Специализация: бэкенд, системное программирование, безопасность.',
            '<span class="out-muted">Учусь в TOP Academy (профиль: IT-разработка).</span>',
        ], 120);

        // ── stack ───────────────────────────────────────────
        await sleep(500);
        removeCursor();
        await typeCommand('stack');
        await sleep(260);
        await fakePipInstall([
            'Python · FastAPI · Flask · SQLAlchemy',
            'Rust · PyO3 · AES-GCM · X25519 · Argon2id',
            'JavaScript · WebSocket · WebRTC',
            'SQLite · PostgreSQL',
        ]);

        // ── achievements ────────────────────────────────────
        await sleep(500);
        removeCursor();
        await typeCommand('achievements');
        await sleep(200);
        await fakeLoading('Fetching records...');
        await printLines([
            '<span class="out-accent">🥈</span> 2 место — хакатон <a class="terminal-link" href="/static/assets/кибер_рывок.pdf" target="_blank" rel="noopener noreferrer">Кибер Рывок</a> [2026]',
            '<span class="out-accent">🏆</span> Участие — хакатон <a class="terminal-link" href="/static/assets/nuclear_it_hack.pdf" target="_blank" rel="noopener noreferrer">Nuclear IT Hack</a> [2026]',
            '<span class="out-accent">💼</span> Коммерческий заказ — сайт для специалиста по приёмке квартир',
        ], 130);

        // ── interests ───────────────────────────────────────
        await sleep(500);
        removeCursor();
        await typeCommand('interests');
        await sleep(220);
        await printLines([
            'Blockchain-разработка · Rust-экосистема',
            'Криптография · P2P-сети · Безопасность',
            '<span class="out-muted">Участие в хакатонах и open-source проектах.</span>',
        ], 120);

        // ── status ──────────────────────────────────────────
        await sleep(500);
        removeCursor();
        await typeCommand('status');
        await sleep(200);
        await fakeLoading('Checking availability...');
        addOutput('<span class="out-green">●</span> Открыт к заказам и предложениям о работе');
        scrollTerminal();

        // Финальный курсор
        await sleep(350);
        appendIdleLine();
    }

    // ── Запуск по IntersectionObserver ─────────────────────────────

    let started = false;
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !started) {
            started = true;
            observer.disconnect();
            runTerminal();
        }
    }, { threshold: 0.25 });

    const section = document.getElementById('about');
    if (section) observer.observe(section);
});
