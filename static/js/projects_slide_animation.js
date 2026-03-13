// ============================================
// 3D SCROLL ANIMATIONS FOR PROJECTS - SMOOTH VERSION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const initScrollAnimations = () => {
        const lenis = window.lenis;
        const title = document.getElementById('projects-title');
        const cards = document.querySelectorAll('.project-card');

        if (!title || cards.length === 0) return;

        // Расширенные конфигурации для медленных, плавных переходов
        const config = {
            title: {
                // Увеличенный диапазон скролла для заголовка
                triggerStart: 0.85,    // Начинаем когда верх заголовка на 85% экрана (почти внизу)
                triggerEnd: 0.15,      // Заканчиваем когда верх на 15% экрана (высоко)
                maxRotation: 55,        // Начальный угол — чуть больше для драматичности
                maxBlur: 25,           // Сильнее размытие вначале
                maxZ: -400,            // Дальше "отлет" от экрана
                scaleStart: 0.5,       // Меньше вначале
                scaleEnd: 1,
                // Функция easing для очень медленного старта и быстрого финиша
                easePower: 4           // Степень easing (чем больше, тем медленнее старт)
            },
            cards: {
                triggerStart: 0.9,     // Карточки начинают позже, чем заголовок
                triggerEnd: 0.25,
                maxRotation: 40,
                maxBlur: 20,
                maxZ: -300,
                scaleStart: 0.7,
                scaleEnd: 1,
                easePower: 5,          // Еще более медленный старт для карточек
                staggerDelay: 150       // Задержка между карточками в пикселях скролла
            }
        };

        // Кастомная функция easing: очень медленный старт, резкий финиш
        // Похоже на "выныривание" из воды — долгое сопротивление, потом быстрое выравнивание
        const customEase = (t, power) => {
            // t от 0 до 1
            // power контролирует "инерцию" — чем больше, тем дольше держится начальное состояние
            return 1 - Math.pow(1 - t, power);
        };

        // Альтернативный ease: easeOutCirc для плавного "приземления"
        const easeOutCirc = (t) => {
            return Math.sqrt(1 - Math.pow(t - 1, 2));
        };

        // Комбинированный ease: медленный старт + плавный финиш
        const smoothEase = (t) => {
            // Первая половина — очень медленно, вторая — ускорение
            if (t < 0.5) {
                return Math.pow(t * 2, 4) / 2;
            } else {
                return 1 - Math.pow((1 - t) * 2, 2) / 2;
            }
        };

        // Получить прогресс с учетом расширенного диапазона
        const getScrollProgress = (element, cfg) => {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Нормализованная позиция элемента (0 = вверху экрана, 1 = внизу)
            const elementTopNormalized = rect.top / windowHeight;

            // Прогресс от triggerStart до triggerEnd
            const range = cfg.triggerStart - cfg.triggerEnd;
            const current = cfg.triggerStart - elementTopNormalized;

            let progress = current / range;
            progress = Math.max(0, Math.min(1, progress));

            return progress;
        };

        // Применить трансформации с плавным easing
        const applySmoothTransform = (element, progress, type) => {
            const cfg = config[type];

            // Используем комбинированный easing для максимальной плавности
            // Особенно важно: 0-0.7 должно быть очень медленным изменением
            const eased = smoothEase(progress);

            // Дополнительная интерполяция для "зависания" в наклонном положении
            // Создаем "плато" где угол держится дольше
            const plateauEased = progress < 0.7
                ? customEase(progress / 0.7, cfg.easePower) * 0.3  // Первые 70% — только 30% изменений
                : 0.3 + (progress - 0.7) / 0.3 * 0.7;            // Последние 30% — оставшиеся 70%

            // Рассчитываем значения
            const rotation = cfg.maxRotation * (1 - plateauEased);
            const blur = cfg.maxBlur * (1 - eased); // Размытие уходит плавнее
            const z = cfg.maxZ * (1 - plateauEased);
            const scale = cfg.scaleStart + (cfg.scaleEnd - cfg.scaleStart) * eased;

            // Добавляем небольшой сдвиг по Y для эффекта "всплытия"
            const translateY = 100 * (1 - eased);

            // Применяем с will-change для производительности
            element.style.transform = `
                perspective(1200px)
                rotateX(${rotation}deg)
                translateZ(${z}px)
                translateY(${translateY}px)
                scale(${scale})
            `;
            element.style.filter = `blur(${blur}px)`;

            // Opacity меняется очень плавно, почти незаметно
            element.style.opacity = 0.2 + (0.8 * eased);

            // Класс visible добавляем только при полном завершении
            if (progress >= 0.98) {
                element.classList.add('visible');
                // Сброс transform для чистоты
                element.style.transform = '';
                element.style.filter = '';
                element.style.opacity = '';
            } else {
                element.classList.remove('visible');
            }
        };

        // Главный обработчик скролла
        const handleScroll = () => {
            // Анимация заголовка
            const titleProgress = getScrollProgress(
                title.closest('.section-title-wrapper'),
                config.title
            );
            applySmoothTransform(title, titleProgress, 'title');

            // Анимация карточек с индивидуальным сдвигом
            cards.forEach((card, index) => {
                // Каждая карточка начинает позже предыдущей
                const cardConfig = {
                    ...config.cards,
                    triggerStart: config.cards.triggerStart + (index * 0.05),
                    triggerEnd: config.cards.triggerEnd + (index * 0.05)
                };

                const progress = getScrollProgress(card, cardConfig);
                applySmoothTransform(card, progress, 'cards');
            });
        };

        // Подписка на скролл
        if (lenis && lenis.on) {
            lenis.on('scroll', handleScroll);
        } else {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        // Начальная проверка
        handleScroll();

        // Обновление при ресайзе
        window.addEventListener('resize', handleScroll, { passive: true });
    };

    setTimeout(initScrollAnimations, 150);
});