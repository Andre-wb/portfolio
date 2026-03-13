document.addEventListener("DOMContentLoaded", () => {

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Та самая кривая ease-out
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });


    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }


    requestAnimationFrame(raf);


    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {

                lenis.scrollTo(targetElement, {
                    offset: 0,
                    duration: 1.5
                });
            }
        });
    });

});