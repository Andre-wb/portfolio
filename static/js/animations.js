const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя0123456789';

function randomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function scrambleTo(el, targetText, duration = 500, onDone) {
    const steps = 20;
    const interval = duration / steps;
    let frame = 0;

    clearInterval(el._scrambleInterval);

    el._scrambleInterval = setInterval(() => {
        const progress = frame / steps;
        const revealedCount = Math.floor(progress * targetText.length);

        let result = '';
        for (let i = 0; i < targetText.length; i++) {
            if (targetText[i] === ' ') result += ' ';
            else if (i < revealedCount) result += targetText[i];
            else result += randomChar();
        }

        el.textContent = result;
        frame++;

        if (frame > steps) {
            clearInterval(el._scrambleInterval);
            el.textContent = targetText;
            onDone && onDone();
        }
    }, interval);
}

function deleteText(el, currentText, duration = 1000, onDone) {
    const steps = currentText.length;
    if (steps === 0) { onDone && onDone(); return; }
    const interval = duration / steps;
    let remaining = steps;

    clearInterval(el._deleteInterval);

    el._deleteInterval = setInterval(() => {
        if (el._hovered) {
            clearInterval(el._deleteInterval);
            return;
        }
        remaining--;
        el.textContent = currentText.slice(0, remaining) + '\u00A0'.repeat(currentText.length - remaining);

        if (remaining <= 0) {
            clearInterval(el._deleteInterval);
            onDone && onDone();
        }
    }, interval);
}

function typeText(el, targetText, duration = 800, onDone) {
    const steps = targetText.length;
    if (steps === 0) { onDone && onDone(); return; }
    const interval = duration / steps;
    let typed = 0;

    clearInterval(el._typeInterval);

    el._typeInterval = setInterval(() => {
        if (el._hovered) {
            clearInterval(el._typeInterval);
            return;
        }
        typed++;
        el.textContent = targetText.slice(0, typed) + '\u00A0'.repeat(targetText.length - typed);

        if (typed >= steps) {
            clearInterval(el._typeInterval);
            el.textContent = targetText;
            onDone && onDone();
        }
    }, interval);
}

function runIdleCycle(el, originalText, pauseMs = 3500) {
    if (el._hovered) return;

    el._idleTimeout = setTimeout(() => {
        if (el._hovered) return;

        deleteText(el, originalText, 1000, () => {
            if (el._hovered) return;

            setTimeout(() => {
                if (el._hovered) return;

                typeText(el, originalText, 900, () => {
                    runIdleCycle(el, originalText, pauseMs);
                });
            }, 200);
        });
    }, pauseMs);
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.btn-tz');
    if (!btn) return;

    const originalText = btn.textContent.trim();
    btn._hovered = false;

    runIdleCycle(btn, originalText, 3500);

    btn.addEventListener('mouseenter', () => {
        btn._hovered = true;

        clearTimeout(btn._idleTimeout);
        clearInterval(btn._deleteInterval);
        clearInterval(btn._typeInterval);
        clearInterval(btn._scrambleInterval);

        btn.textContent = originalText;
        scrambleTo(btn, originalText, 500);
    });

    btn.addEventListener('mouseleave', () => {
        btn._hovered = false;
        clearInterval(btn._scrambleInterval);
        btn.textContent = originalText;

        runIdleCycle(btn, originalText, 3500);
    });

    const navLinks = document.querySelectorAll('.desktop-nav a');
    navLinks.forEach(link => {
        const originalText = link.textContent.trim();

        link.addEventListener('mouseenter', () => {
            clearInterval(link._scrambleInterval);
            link.textContent = originalText;
            scrambleTo(link, originalText, 400);
        });

        link.addEventListener('mouseleave', () => {
            clearInterval(link._scrambleInterval);
            link.textContent = originalText;
        });
    });
});