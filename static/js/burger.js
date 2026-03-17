// Burger Menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const burgerBtn = document.querySelector('.burger-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeBtn = document.querySelector('.mobile-nav-close');
    const overlay = document.querySelector('.mobile-nav-overlay');

    // Функция открытия меню
    function openMenu() {
        mobileNav.classList.add('active');
        burgerBtn.classList.add('active');
        overlay.classList.add('active');
        burgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // Блокируем скролл
    }

    // Функция закрытия меню
    function closeMenu() {
        mobileNav.classList.remove('active');
        burgerBtn.classList.remove('active');
        overlay.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; // Возвращаем скролл
    }

    // Открытие по клику на бургер
    burgerBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (mobileNav.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Закрытие по крестику
    closeBtn.addEventListener('click', closeMenu);

    // Закрытие по оверлею
    overlay.addEventListener('click', closeMenu);

    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMenu();
        }
    });

    // Закрытие при клике на ссылку в меню
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });

    // Предотвращаем закрытие при клике на само меню
    mobileNav.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Обработка изменения размера окна
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 1024 && mobileNav.classList.contains('active')) {
                closeMenu();
            }
        }, 250);
    });
});