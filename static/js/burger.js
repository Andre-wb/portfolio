document.addEventListener('DOMContentLoaded', function() {
    const burgerBtn = document.querySelector('.burger-menu');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeBtn = document.querySelector('.mobile-nav-close');
    const overlay = document.querySelector('.mobile-nav-overlay');

    function openMenu() {
        mobileNav.classList.add('active');
        burgerBtn.classList.add('active');
        overlay.classList.add('active');
        burgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileNav.classList.remove('active');
        burgerBtn.classList.remove('active');
        overlay.classList.remove('active');
        burgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    burgerBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (mobileNav.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    closeBtn.addEventListener('click', closeMenu);

    overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            closeMenu();
        }
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });

    mobileNav.addEventListener('click', function(e) {
        e.stopPropagation();
    });

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