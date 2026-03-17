/**
 * Cookie Banner Logic
 * - Проверяет localStorage на наличие согласия.
 * - Если согласия нет, показывает баннер.
 * - Обрабатывает клики на кнопки и сохраняет выбор.
 */

(function() {
    'use strict';

    // Ключ для хранения в localStorage
    const STORAGE_KEY = 'cookieConsent';
    // Значения: 'accepted', 'declined', или null (не выбрано)

    // Элементы DOM
    const banner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');

    // Функция для проверки, нужно ли показывать баннер
    const shouldShowBanner = () => {
        const consent = localStorage.getItem(STORAGE_KEY);
        // Показываем, если ключа нет (null) или если значение не 'accepted' и не 'declined'
        return !consent || (consent !== 'accepted' && consent !== 'declined');
    };

    // Функция для скрытия баннера с анимацией
    const hideBanner = () => {
        if (!banner) return;

        // Добавляем анимацию исчезновения
        banner.style.animation = 'slideUpCookie 0.4s cubic-bezier(0.23, 1, 0.32, 1) reverse forwards';

        // После завершения анимации скрываем элемент
        setTimeout(() => {
            banner.style.display = 'none';
            // Очищаем inline-анимацию, чтобы при следующем показе она сработала снова
            banner.style.animation = '';
        }, 400); // Чуть меньше, чем длительность анимации
    };

    // Функция для установки согласия и скрытия баннера
    const setConsent = (status) => {
        if (!status || (status !== 'accepted' && status !== 'declined')) {
            console.error('Неверный статус согласия');
            return;
        }

        // Сохраняем в localStorage
        localStorage.setItem(STORAGE_KEY, status);
        // Скрываем баннер
        hideBanner();

        // Здесь можно добавить логику для загрузки аналитики, если статус 'accepted'
        if (status === 'accepted') {
            console.log('🍪 Куки приняты. Можно загружать аналитику.');
            // Например: loadAnalyticsScripts();
        } else {
            console.log('🍪 Куки отклонены.');
        }
    };

    // Инициализация: проверяем и показываем баннер, если нужно
    const initCookieBanner = () => {
        // Если элементов нет, выходим
        if (!banner || !acceptBtn || !declineBtn) {
            console.error('Элементы cookie-баннера не найдены');
            return;
        }

        // Показываем баннер, если нет сохраненного согласия
        if (shouldShowBanner()) {
            banner.style.display = 'flex'; // Делаем видимым
        } else {
            // Если согласие уже есть, просто скрываем (не показываем)
            banner.style.display = 'none';
        }

        // Обработчики событий на кнопки
        acceptBtn.addEventListener('click', () => setConsent('accepted'));
        declineBtn.addEventListener('click', () => setConsent('declined'));
    };

    // Запускаем, когда DOM полностью загрузится
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieBanner);
    } else {
        // DOM уже загружен
        initCookieBanner();
    }

})();