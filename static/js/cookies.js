(function () {
    const KEY     = 'cookie_consent_v1';
    const banner  = document.getElementById('cookieBanner');

    function showBanner() {
        if (banner) {
            banner.style.display = 'flex';
        }
    }

    function hideBanner() {
        if (banner) {
            banner.style.opacity  = '0';
            banner.style.transform = 'translateY(20px)';
            banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            setTimeout(() => { banner.style.display = 'none'; }, 320);
        }
    }

    window.acceptCookies = function () {
        localStorage.setItem(KEY, 'accepted');
        hideBanner();
    };

    window.declineCookies = function () {
        localStorage.setItem(KEY, 'declined');
        hideBanner();
    };

    const consent = localStorage.getItem(KEY);
    if (!consent) {
        setTimeout(showBanner, 1200);
    }
})();