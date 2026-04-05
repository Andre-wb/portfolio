'use strict';

const TG_USERNAME = window.TG_USERNAME || 'andr3ywb';
const BOT_API_URL = '/send-tor';
const LS_KEY      = 'tor_quiz_v5';

const STEPS = [

    {
        id: 'project_type',
        question: 'Что вы хотите разработать?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'site',       label: 'Сайт' },
            { value: 'webapp',     label: 'Веб-приложение' },
            { value: 'tgbot',      label: 'Telegram-бот' },
            { value: 'tgbot_site', label: 'Telegram-бот + Сайт' },
            { value: 'custom',     label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите ваш вариант...' },
        ],
        show: () => true,
    },

    {
        id: 'project_idea',
        question: 'Опишите идею проекта',
        subtitle: 'Что должен делать ваш продукт? Чем занимается ваш бизнес?',
        type: 'text', required: true,
        placeholder: 'Например: онлайн-магазин спортивного питания с каталогом, корзиной и оплатой картой…',
        show: () => true,
    },

    // САЙТ
    {
        id: 'site_type',
        question: 'Какой тип сайта вам нужен?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'landing',   label: 'Лендинг (одностраничный сайт)' },
            { value: 'corporate', label: 'Корпоративный сайт' },
            { value: 'shop',      label: 'Интернет-магазин' },
            { value: 'portal',    label: 'Портал / Сервис' },
            { value: 'custom',    label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите тип сайта...' },
        ],
        show: a => a.project_type?.value === 'site',
    },

    {
        id: 'site_goal',
        question: 'Какова основная цель сайта?',
        subtitle: 'Что сайт должен давать вашему бизнесу?',
        type: 'text', required: true,
        placeholder: 'Например: привлечь новых клиентов, продавать товары, рассказать об услугах…',
        show: a => a.project_type?.value === 'site',
    },

    {
        id: 'site_functions',
        question: 'Какие функции нужны на сайте?',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'registration', label: 'Регистрация пользователей' },
            { value: 'cabinet',      label: 'Личный кабинет' },
            { value: 'comments',     label: 'Комментарии' },
            { value: 'search',       label: 'Поиск' },
            { value: 'admin',        label: 'Админ-панель' },
            { value: 'feedback',     label: 'Форма обратной связи' },
            { value: 'uploads',      label: 'Загрузка файлов' },
            { value: 'payment',      label: 'Онлайн-оплата' },
            { value: 'custom',       label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите нужные функции...' },
        ],
        show: a => a.project_type?.value === 'site',
    },

    {
        id: 'site_reg_method',
        question: 'Как пользователи будут регистрироваться?',
        subtitle: 'Можно выбрать несколько способов',
        type: 'multi', required: true,
        options: [
            { value: 'email',    label: 'Email + пароль' },
            { value: 'social',   label: 'Социальные сети (VK, Google и др.)' },
            { value: 'telegram', label: 'Telegram' },
            { value: 'custom',   label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите способ регистрации...' },
        ],
        show: a => a.project_type?.value === 'site' &&
            (a.site_functions?.values || []).includes('registration'),
    },

    {
        id: 'site_cabinet_desc',
        question: 'Что пользователь делает в личном кабинете?',
        subtitle: 'Опишите возможности личного кабинета',
        type: 'text', required: true,
        placeholder: 'Просматривает заказы, редактирует профиль, скачивает документы…',
        show: a => a.project_type?.value === 'site' &&
            (a.site_functions?.values || []).includes('cabinet'),
    },

    {
        id: 'site_admin_desc',
        question: 'Какие функции нужны администратору?',
        subtitle: 'Что администратор должен уметь делать?',
        type: 'text', required: true,
        placeholder: 'Управление пользователями, редактирование контента, просмотр статистики…',
        show: a => a.project_type?.value === 'site' &&
            (a.site_functions?.values || []).includes('admin'),
    },

    {
        id: 'site_payment_method',
        question: 'Какая система оплаты нужна?',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'stripe', label: 'Stripe' },
            { value: 'paypal', label: 'PayPal' },
            { value: 'crypto', label: 'Криптовалюта' },
            { value: 'custom', label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Укажите систему оплаты...' },
        ],
        show: a => a.project_type?.value === 'site' &&
            (a.site_functions?.values || []).includes('payment'),
    },

    {
        id: 'shop_features',
        question: 'Какие функции нужны в интернет-магазине?',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'catalog',        label: 'Каталог товаров' },
            { value: 'cart',           label: 'Корзина' },
            { value: 'filters',        label: 'Фильтры товаров' },
            { value: 'reviews',        label: 'Отзывы покупателей' },
            { value: 'delivery',       label: 'Система доставки' },
            { value: 'admin_products', label: 'Управление товарами через админку' },
            { value: 'custom',         label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите дополнительные функции...' },
        ],
        show: a => a.project_type?.value === 'site' && a.site_type?.value === 'shop',
    },

    {
        id: 'site_design',
        question: 'Как обстоят дела с дизайном?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'ready',    label: 'Есть готовый дизайн (Figma / макеты)',
                hasText: true, textPlaceholder: 'Ссылка на Figma или описание файлов...' },
            { value: 'examples', label: 'Есть примеры сайтов',
                hasText: true, textPlaceholder: 'Вставьте ссылки на понравившиеся сайты...' },
            { value: 'develop',  label: 'Нужно разработать дизайн с нуля' },
            { value: 'custom',   label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите ситуацию с дизайном...' },
        ],
        show: a => a.project_type?.value === 'site',
    },

    {
        id: 'site_content',
        question: 'Есть ли готовый контент для сайта?',
        subtitle: 'Тексты, изображения, материалы — можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'texts',       label: 'Есть тексты / описания',
                hasText: true, textPlaceholder: 'Опишите кратко, что именно...' },
            { value: 'images',      label: 'Есть изображения / фото',
                hasText: true, textPlaceholder: 'Опишите кратко, что именно...' },
            { value: 'need_create', label: 'Контент нужно создать' },
            { value: 'custom',      label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите ситуацию с контентом...' },
        ],
        show: a => a.project_type?.value === 'site',
    },

    {
        id: 'site_hosting',
        question: 'Как обстоят дела с хостингом и доменом?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'has_both',   label: 'Есть домен и хостинг',
                hasText: true, textPlaceholder: 'Укажите домен и название хостинга...' },
            { value: 'has_domain', label: 'Есть только домен',
                hasText: true, textPlaceholder: 'Укажите доменное имя...' },
            { value: 'has_host',   label: 'Есть только хостинг',
                hasText: true, textPlaceholder: 'Укажите название хостинга...' },
            { value: 'delegate',   label: 'Доверяю выбор специалисту — подберите коммерчески выгодный вариант' },
            { value: 'need_help',  label: 'Нужна помощь с выбором, но решение за мной' },
        ],
        show: a => a.project_type?.value === 'site',
    },

    // ВЕБ-ПРИЛОЖЕНИЕ
    {
        id: 'webapp_type',
        question: 'Какой тип веб-приложения?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'saas',   label: 'SaaS-платформа (сервис по подписке)' },
            { value: 'crm',    label: 'CRM-система' },
            { value: 'social', label: 'Социальная платформа' },
            { value: 'files',  label: 'Файловый сервис / облачное хранилище' },
            { value: 'custom', label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите тип приложения...' },
        ],
        show: a => a.project_type?.value === 'webapp',
    },

    {
        id: 'webapp_users',
        question: 'Какие роли будут в системе?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'users_only',  label: 'Только обычные пользователи' },
            { value: 'users_admin', label: 'Пользователи + Администратор' },
            { value: 'multi_roles', label: 'Несколько ролей (менеджер, клиент, руководитель…)',
                hasText: true, textPlaceholder: 'Опишите роли и их права...' },
            { value: 'custom',      label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите роли и их права...' },
        ],
        show: a => a.project_type?.value === 'webapp',
    },

    {
        id: 'webapp_functions',
        question: 'Какие основные функции нужны?',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'registration',  label: 'Регистрация / авторизация' },
            { value: 'cabinet',       label: 'Личный кабинет' },
            { value: 'uploads',       label: 'Загрузка и хранение файлов' },
            { value: 'chat',          label: 'Чат / мессенджер' },
            { value: 'notifications', label: 'Уведомления' },
            { value: 'subscriptions', label: 'Подписки / тарифы' },
            { value: 'payment',       label: 'Оплата' },
            { value: 'custom',        label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите нужные функции...' },
        ],
        show: a => a.project_type?.value === 'webapp',
    },

    {
        id: 'webapp_scale',
        question: 'Сколько пользователей ожидается?',
        subtitle: 'Предполагаемое количество одновременных пользователей',
        type: 'single', required: true,
        options: [
            { value: 'under_100',  label: 'До 100 пользователей' },
            { value: 'under_1000', label: 'До 1000 пользователей' },
            { value: 'over_1000',  label: '1000+ пользователей' },
            { value: 'custom',     label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Укажите примерное количество...' },
        ],
        show: a => a.project_type?.value === 'webapp',
    },

    {
        id: 'webapp_design',
        question: 'Как обстоят дела с дизайном приложения?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'ready',    label: 'Есть готовый дизайн (Figma / макеты)',
                hasText: true, textPlaceholder: 'Ссылка на Figma или описание файлов...' },
            { value: 'examples', label: 'Есть примеры приложений',
                hasText: true, textPlaceholder: 'Вставьте ссылки на примеры...' },
            { value: 'develop',  label: 'Нужно разработать дизайн с нуля' },
            { value: 'custom',   label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите...' },
        ],
        show: a => a.project_type?.value === 'webapp',
    },

    {
        id: 'webapp_hosting',
        question: 'Как обстоят дела с хостингом и доменом?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'has_both',   label: 'Есть домен и хостинг',
                hasText: true, textPlaceholder: 'Укажите домен и название хостинга...' },
            { value: 'has_domain', label: 'Есть только домен',
                hasText: true, textPlaceholder: 'Укажите доменное имя...' },
            { value: 'has_host',   label: 'Есть только хостинг',
                hasText: true, textPlaceholder: 'Укажите название хостинга...' },
            { value: 'delegate',   label: 'Доверяю выбор специалисту — подберите коммерчески выгодный вариант' },
            { value: 'need_help',  label: 'Нужна помощь с выбором, но решение за мной' },
        ],
        show: a => a.project_type?.value === 'webapp',
    },

    // TELEGRAM-БОТ
    {
        id: 'bot_task',
        question: 'Какова основная задача Telegram-бота?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'support',    label: 'Поддержка пользователей' },
            { value: 'automation', label: 'Автоматизация процессов' },
            { value: 'orders',     label: 'Приём заказов' },
            { value: 'info',       label: 'Информационный / рассылочный бот' },
            { value: 'custom',     label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите задачу бота...' },
        ],
        show: a => a.project_type?.value === 'tgbot',
    },

    {
        id: 'bot_db',
        question: 'Нужна ли боту база данных?',
        subtitle: 'База данных позволяет хранить информацию о пользователях, заказах и т.д.',
        type: 'single', required: true,
        options: [
            { value: 'yes', label: 'Да, нужна' },
            { value: 'no',  label: 'Нет, бот простой без хранения данных' },
        ],
        show: a => a.project_type?.value === 'tgbot',
    },

    {
        id: 'bot_db_what',
        question: 'Что нужно хранить в базе данных?',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'users',    label: 'Информацию о пользователях' },
            { value: 'orders',   label: 'Заказы' },
            { value: 'messages', label: 'Сообщения / историю чатов' },
            { value: 'files',    label: 'Файлы / медиа' },
            { value: 'custom',   label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите данные...' },
        ],
        show: a => a.project_type?.value === 'tgbot' && a.bot_db?.value === 'yes',
    },

    {
        id: 'bot_admin',
        question: 'Нужна ли административная панель?',
        subtitle: 'Веб-интерфейс для управления ботом и просмотра данных',
        type: 'single', required: true,
        options: [
            { value: 'yes', label: 'Да, нужна веб-панель' },
            { value: 'no',  label: 'Нет, управление только через бота' },
        ],
        show: a => a.project_type?.value === 'tgbot',
    },

    {
        id: 'bot_services',
        question: 'Нужно ли подключить внешние сервисы?',
        subtitle: 'Можно выбрать несколько (или пропустить)',
        type: 'multi', required: false,
        options: [
            { value: 'site',     label: 'Сайт (API-интеграция)' },
            { value: 'payments', label: 'Платёжная система' },
            { value: 'crm',      label: 'CRM-система' },
            { value: 'custom',   label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите интеграции...' },
        ],
        show: a => a.project_type?.value === 'tgbot',
    },

    {
        id: 'bot_hosting',
        question: 'Как обстоят дела с хостингом для бота?',
        subtitle: 'Бот должен работать на сервере круглосуточно',
        type: 'single', required: true,
        options: [
            { value: 'has_server', label: 'Есть свой сервер / VPS',
                hasText: true, textPlaceholder: 'Укажите провайдера или параметры...' },
            { value: 'delegate',   label: 'Доверяю выбор специалисту — подберите коммерчески выгодный вариант' },
            { value: 'need_help',  label: 'Нужна помощь с выбором, но решение за мной' },
        ],
        show: a => a.project_type?.value === 'tgbot',
    },

    // TELEGRAM-БОТ + САЙТ
    {
        id: 'botsite_site_type',
        question: 'Какой тип сайта нужен?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'landing', label: 'Лендинг' },
            { value: 'service', label: 'Сервис / SaaS' },
            { value: 'shop',    label: 'Интернет-магазин' },
            { value: 'custom',  label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите тип сайта...' },
        ],
        show: a => a.project_type?.value === 'tgbot_site',
    },

    {
        id: 'botsite_site_functions',
        question: 'Основные функции сайта',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'registration', label: 'Регистрация / авторизация' },
            { value: 'cabinet',      label: 'Личный кабинет' },
            { value: 'catalog',      label: 'Каталог / витрина' },
            { value: 'payments',     label: 'Платежи' },
            { value: 'admin',        label: 'Админ-панель' },
            { value: 'custom',       label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите функции...' },
        ],
        show: a => a.project_type?.value === 'tgbot_site',
    },

    {
        id: 'botsite_bot_functions',
        question: 'Основные функции Telegram-бота',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'notifications', label: 'Уведомления пользователям' },
            { value: 'account',       label: 'Управление аккаунтом' },
            { value: 'orders',        label: 'Оформление / отслеживание заказов' },
            { value: 'support',       label: 'Поддержка клиентов' },
            { value: 'custom',        label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите функции бота...' },
        ],
        show: a => a.project_type?.value === 'tgbot_site',
    },

    {
        id: 'botsite_interaction',
        question: 'Как сайт и бот будут взаимодействовать?',
        subtitle: 'Можно выбрать несколько',
        type: 'multi', required: true,
        options: [
            { value: 'notifications', label: 'Бот отправляет уведомления о событиях на сайте' },
            { value: 'manage_site',   label: 'Управление сайтом через бота' },
            { value: 'tg_auth',       label: 'Авторизация на сайте через Telegram' },
            { value: 'custom',        label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите взаимодействие...' },
        ],
        show: a => a.project_type?.value === 'tgbot_site',
    },

    {
        id: 'botsite_design',
        question: 'Как обстоят дела с дизайном сайта?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'ready',    label: 'Есть готовый дизайн (Figma / макеты)',
                hasText: true, textPlaceholder: 'Ссылка на Figma или описание файлов...' },
            { value: 'examples', label: 'Есть примеры (похожие сайты)',
                hasText: true, textPlaceholder: 'Ссылки на примеры сайтов...' },
            { value: 'develop',  label: 'Нужно разработать дизайн с нуля' },
            { value: 'custom',   label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Опишите ситуацию...' },
        ],
        show: a => a.project_type?.value === 'tgbot_site',
    },

    {
        id: 'botsite_hosting',
        question: 'Как обстоят дела с хостингом и доменом?',
        subtitle: 'Выберите один вариант',
        type: 'single', required: true,
        options: [
            { value: 'has_both',   label: 'Есть домен и хостинг',
                hasText: true, textPlaceholder: 'Укажите домен и название хостинга...' },
            { value: 'has_domain', label: 'Есть только домен',
                hasText: true, textPlaceholder: 'Укажите доменное имя...' },
            { value: 'has_host',   label: 'Есть только хостинг',
                hasText: true, textPlaceholder: 'Укажите название хостинга...' },
            { value: 'delegate',   label: 'Доверяю выбор специалисту — подберите коммерчески выгодный вариант' },
            { value: 'need_help',  label: 'Нужна помощь с выбором, но решение за мной' },
        ],
        show: a => a.project_type?.value === 'tgbot_site',
    },

    // ОБЩИЙ БЛОК
    {
        id: 'deadline',
        question: 'Когда нужен запуск проекта?',
        subtitle: 'Выберите примерные сроки',
        type: 'single', required: true,
        options: [
            { value: 'asap',       label: 'Как можно быстрее' },
            { value: '1_month',    label: '1 месяц' },
            { value: '2_3_months', label: '2–3 месяца' },
            { value: 'custom',     label: 'Свой вариант / не знаю',
                hasText: true, textPlaceholder: 'Укажите желаемые сроки...' },
        ],
        show: () => true,
    },

    {
        id: 'budget',
        question: 'Какой бюджет на проект?',
        subtitle: 'Минимальная стоимость — 1 000 рублей. Укажите реальную цифру.',
        type: 'number', required: true,
        placeholder: 'Например: 50000',
        min: 1000,
        show: () => true,
    },

    {
        id: 'contact_type',
        question: 'Как с вами связаться?',
        subtitle: 'Выберите способ и укажите контакт',
        type: 'single', required: true,
        requireSubText: true,
        options: [
            { value: 'telegram', label: 'Telegram',
                hasText: true, textPlaceholder: '@username или +7 900 000-00-00' },
            { value: 'email',    label: 'Email',
                hasText: true, textPlaceholder: 'your@email.com' },
            { value: 'phone',    label: 'Телефон',
                hasText: true, textPlaceholder: '+7 (999) 999-99-99' },
            { value: 'custom',   label: 'Другой способ',
                hasText: true, textPlaceholder: 'Укажите удобный способ связи...' },
        ],
        show: () => true,
    },

    {
        id: 'extra_info',
        question: 'Дополнительная информация',
        subtitle: 'Любые пожелания, уточнения или вопросы (необязательно)',
        type: 'text', required: false,
        placeholder: 'Например: нужна поддержка на русском, интеграция с 1С…',
        show: () => true,
    },
];

let state = {
    currentStepId: STEPS[0].id,
    answers:       {},
    history:       [STEPS[0].id],
    done:          false,
};

function saveState()  { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (_) {} }
function loadState()  { try { const r = localStorage.getItem(LS_KEY); if (r) Object.assign(state, JSON.parse(r)); } catch (_) {} }
function clearState() { localStorage.removeItem(LS_KEY); state = { currentStepId: STEPS[0].id, answers: {}, history: [STEPS[0].id], done: false }; }

function getStep(id)    { return STEPS.find(s => s.id === id); }
function visibleSteps() { return STEPS.filter(s => s.show(state.answers)); }

function nextStep(currentId) {
    const vis = visibleSteps();
    const idx = vis.findIndex(s => s.id === currentId);
    return idx >= 0 && idx < vis.length - 1 ? vis[idx + 1] : null;
}

function progress() {
    const vis = visibleSteps();
    const idx = vis.findIndex(s => s.id === state.currentStepId);
    const cur = Math.max(idx + 1, 1);
    return { cur, total: vis.length, pct: Math.round((cur / vis.length) * 100) };
}

function render() {
    if (state.done) { renderResult(); return; }
    const step = getStep(state.currentStepId);
    if (!step || !step.show(state.answers)) {
        const first = visibleSteps()[0];
        if (first) { state.currentStepId = first.id; state.history = [first.id]; saveState(); }
    }
    updateProgress();
    renderStep(getStep(state.currentStepId));
}

function updateProgress() {
    const { cur, total, pct } = progress();
    const fill  = document.getElementById('progressFill');
    const label = document.getElementById('progressLabel');
    if (fill)  fill.style.width = pct + '%';
    if (label) label.textContent = `${String(cur).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    const backBtn = document.getElementById('progressBackBtn');
    if (backBtn) backBtn.disabled = state.history.length <= 1;
}

function renderStep(step) {
    const quizScreen   = document.getElementById('quizScreen');
    const resultScreen = document.getElementById('resultScreen');
    const bottomNav    = document.getElementById('bottomNav');
    const card         = document.getElementById('questionCard');
    quizScreen.classList.remove('hidden');
    resultScreen.classList.add('hidden');
    bottomNav.classList.remove('hidden');
    card.innerHTML = buildCardHTML(step);
    restoreAnswer(step);
    bindEvents(step);
    updateNavBtns();
}

function buildCardHTML(step) {
    const { cur, total } = progress();
    let body = '';
    if      (step.type === 'text')   body = buildTextArea(step);
    else if (step.type === 'number') body = buildNumberInput(step);
    else if (step.type === 'single') body = buildOptions(step, false);
    else if (step.type === 'multi')  body = buildOptions(step, true);
    return `
    <div data-corner="tr"></div>
    <div data-corner="bl"></div>
    <div class="q-step">Вопрос ${String(cur).padStart(2,'0')} из ${String(total).padStart(2,'0')}</div>
    <h2 class="q-title">${step.question}</h2>
    ${step.subtitle ? `<p class="q-subtitle">${step.subtitle}</p>` : ''}
    ${body}
    <div class="err-msg" id="errMsg"></div>
  `;
}

function buildTextArea(step) {
    const fid = `files_main_${step.id}`;
    return `
    <div class="input-toggle-wrap">
      <div class="input-toggle-bar">
        <button type="button" class="itoggle active" id="tog_text_main"
          onclick="switchInputMode('main','text','${step.id}')">Текст</button>
        <button type="button" class="itoggle" id="tog_file_main"
          onclick="switchInputMode('main','file','${step.id}')">Файлы</button>
      </div>
      <div id="mode_text_main">
        <textarea class="txt-area" id="mainTextInput"
          placeholder="${esc(step.placeholder || 'Введите ваш ответ...')}"
          rows="5"></textarea>
      </div>
      <div id="mode_file_main" class="file-inline-zone" style="display:none">
        <label class="file-drop-zone-inline">
          <input type="file" id="${fid}" multiple accept="*/*" style="display:block;opacity:0;width:0;height:0;position:absolute"
            onchange="addInlineFiles(this.files,'${step.id}','main')" />
          <span class="file-drop-icon-sm">📎</span>
          <span class="file-drop-text-sm">Нажмите или перетащите файлы (до 10 шт., до 50 МБ каждый)</span>
        </label>
        <div class="file-list-inline" id="flist_main_${step.id}"></div>
      </div>
    </div>`;
}

function buildNumberInput(step) {
    return `
    <div class="num-wrap">
      <input type="number" class="num-input" id="mainNumInput"
        placeholder="${esc(step.placeholder || '0')}"
        min="${step.min || 0}" step="500" />
      <span class="num-suffix">₽</span>
    </div>`;
}

function buildOptions(step, isMulti) {
    const items = step.options.map(opt => {
        const subId  = `sub_${step.id}_${opt.value}`;
        const fileId = `files_${step.id}_${opt.value}`;
        const sub = opt.hasText ? `
      <div class="input-toggle-wrap sub-wrap" id="wrap_${subId}" style="display:none">
        <div class="input-toggle-bar small">
          <button type="button" class="itoggle active" id="tog_text_${subId}"
            onclick="switchInputMode('${subId}','text','${step.id}')">Текст</button>
          <button type="button" class="itoggle" id="tog_file_${subId}"
            onclick="switchInputMode('${subId}','file','${step.id}')">Файлы</button>
        </div>
        <div id="mode_text_${subId}">
          <textarea class="opt-sub-input" id="${subId}" data-opt="${opt.value}"
            placeholder="${esc(opt.textPlaceholder || 'Уточните...')}" rows="2"></textarea>
        </div>
        <div id="mode_file_${subId}" class="file-inline-zone" style="display:none">
          <label class="file-drop-zone-inline">
            <input type="file" id="${fileId}" multiple accept="*/*" style="display:block;opacity:0;width:0;height:0;position:absolute"
              onchange="addInlineFiles(this.files,'${step.id}','${subId}')" />
            <span class="file-drop-icon-sm">📎</span>
            <span class="file-drop-text-sm">Нажмите — до 10 файлов, до 50 МБ каждый</span>
          </label>
          <div class="file-list-inline" id="flist_${subId}"></div>
        </div>
      </div>` : '';
        return `
      <div class="opt-wrap">
        <button type="button"
          class="opt-btn${isMulti ? ' multi' : ''}"
          data-value="${opt.value}"
          onclick="${isMulti ? `toggleMulti('${step.id}','${opt.value}',this)` : `selectSingle('${step.id}','${opt.value}',this)`}">
          <span class="opt-indicator"></span>
          <span class="opt-label">${opt.label}</span>
        </button>
        ${sub}
      </div>`;
    }).join('');
    return `<div class="options-list">${items}</div>`;
}

function restoreAnswer(step) {
    const ans = state.answers[step.id];
    if (!ans) return;
    if (step.type === 'text') {
        const el = document.getElementById('mainTextInput');
        if (el) el.value = ans;
    } else if (step.type === 'number') {
        const el = document.getElementById('mainNumInput');
        if (el) el.value = ans;
    } else if (step.type === 'single' && ans.value) {
        const btn = document.querySelector(`.opt-btn[data-value="${ans.value}"]`);
        if (btn) {
            btn.classList.add('selected');
            const subId = `sub_${step.id}_${ans.value}`;
            const wrap  = document.getElementById(`wrap_${subId}`);
            if (wrap) wrap.style.display = 'block';
            if (ans.text) {
                const sub = document.getElementById(subId);
                if (sub) sub.value = ans.text;
            }
        }
    } else if (step.type === 'multi' && ans.values?.length) {
        ans.values.forEach(v => {
            const btn = document.querySelector(`.opt-btn[data-value="${v}"]`);
            if (btn) {
                btn.classList.add('selected');
                const subId = `sub_${step.id}_${v}`;
                const wrap  = document.getElementById(`wrap_${subId}`);
                if (wrap) wrap.style.display = 'block';
                const t = ans.texts?.[v];
                if (t) {
                    const sub = document.getElementById(subId);
                    if (sub) sub.value = t;
                }
            }
        });
    }
    // Restore inline file lists
    renderAllInlineFileLists();
}

function bindEvents(step) {
    const textEl = document.getElementById('mainTextInput');
    if (textEl) textEl.addEventListener('input', () => { state.answers[step.id] = textEl.value; saveState(); });
    const numEl = document.getElementById('mainNumInput');
    if (numEl) numEl.addEventListener('input', () => { state.answers[step.id] = numEl.value; saveState(); });
    document.querySelectorAll('.opt-sub-input').forEach(sub => {
        sub.addEventListener('input', () => {
            const val = sub.dataset.opt;
            if (step.type === 'single') {
                if (!state.answers[step.id]) state.answers[step.id] = {};
                state.answers[step.id].text = sub.value;
            } else {
                if (!state.answers[step.id]) state.answers[step.id] = { values:[], labels:[], texts:{} };
                if (!state.answers[step.id].texts) state.answers[step.id].texts = {};
                state.answers[step.id].texts[val] = sub.value;
            }
            saveState();
        });
    });
}

function selectSingle(stepId, value, btnEl) {
    const step = getStep(stepId);
    if (!step) return;
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    // Hide all sub-wraps
    document.querySelectorAll('.sub-wrap').forEach(s => s.style.display = 'none');
    btnEl.classList.add('selected');
    const subId = `sub_${stepId}_${value}`;
    const wrap  = document.getElementById(`wrap_${subId}`);
    if (wrap) wrap.style.display = 'block';
    const sub   = document.getElementById(subId);
    const opt   = step.options.find(o => o.value === value);
    state.answers[stepId] = { value, label: opt?.label || value, text: sub?.value || '' };
    saveState();
    hideErr();
}

function toggleMulti(stepId, value, btnEl) {
    btnEl.classList.toggle('selected');
    const isOn  = btnEl.classList.contains('selected');
    const subId = `sub_${stepId}_${value}`;
    const wrap  = document.getElementById(`wrap_${subId}`);
    if (wrap) wrap.style.display = isOn ? 'block' : 'none';
    flushMulti(stepId);
    hideErr();
}

function flushMulti(stepId) {
    const step = getStep(stepId);
    if (!step) return;
    const values = [], labels = [], texts = {};
    document.querySelectorAll('.opt-btn.selected').forEach(b => {
        const v = b.dataset.value;
        const opt = step.options.find(o => o.value === v);
        values.push(v);
        labels.push(opt?.label || v);
        const sub = document.getElementById(`sub_${stepId}_${v}`);
        if (sub?.value) texts[v] = sub.value;
    });
    state.answers[stepId] = { values, labels, texts };
    saveState();
}

function validate() {
    const step = getStep(state.currentStepId);
    if (!step) return true;
    if (step.type === 'multi') flushMulti(step.id);
    const ans = state.answers[step.id];
    if (!step.required) return true;
    if (step.type === 'text') {
        if (!ans?.trim()) { showErr('Пожалуйста, заполните это поле'); return false; }
    } else if (step.type === 'number') {
        if (!ans || isNaN(Number(ans)) || Number(ans) < (step.min || 0)) {
            showErr(`Минимальная сумма: ${(step.min || 0).toLocaleString('ru-RU')} ₽`); return false;
        }
    } else if (step.type === 'single') {
        if (!ans?.value) { showErr('Пожалуйста, выберите один из вариантов'); return false; }
        if (step.requireSubText && !ans.text?.trim()) {
            showErr('Пожалуйста, укажите контактные данные в поле ниже выбранного пункта'); return false;
        }
    } else if (step.type === 'multi') {
        if (!ans?.values?.length) { showErr('Пожалуйста, выберите хотя бы один вариант'); return false; }
    }
    return true;
}

function showErr(msg) { const el = document.getElementById('errMsg'); if (el) { el.textContent = msg; el.classList.add('show'); } }
function hideErr()    { const el = document.getElementById('errMsg'); if (el) el.classList.remove('show'); }

function goNext() {
    const step = getStep(state.currentStepId);
    if (step.type === 'text') {
        const el = document.getElementById('mainTextInput');
        if (el) { state.answers[step.id] = el.value; saveState(); }
    } else if (step.type === 'number') {
        const el = document.getElementById('mainNumInput');
        if (el) { state.answers[step.id] = el.value; saveState(); }
    } else if (step.type === 'single') {
        const ans = state.answers[step.id];
        if (ans?.value) {
            const sub = document.getElementById(`sub_${step.id}_${ans.value}`);
            if (sub) { state.answers[step.id].text = sub.value; saveState(); }
        }
    } else if (step.type === 'multi') {
        flushMulti(step.id);
    }
    if (!validate()) return;
    const next = nextStep(state.currentStepId);
    if (!next) { state.done = true; saveState(); renderResult(); return; }
    state.history.push(next.id);
    state.currentStepId = next.id;
    saveState();
    render();
}

function goBack() {
    if (state.done) { state.done = false; saveState(); render(); return; }
    if (state.history.length <= 1) return;
    state.history.pop();
    state.currentStepId = state.history[state.history.length - 1];
    saveState();
    render();
}

function updateNavBtns() {
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (backBtn) backBtn.disabled = state.history.length <= 1;
    if (nextBtn) nextBtn.textContent = nextStep(state.currentStepId) ? 'Далее →' : 'Готово';
}

// Хелпер: форматирование хостинга
function hostingLine(ans) {
    if (!ans?.value) return 'Не указано';
    const map = {
        has_both:   `Домен и хостинг: ${ans.text || 'имеются'}`,
        has_domain: `Только домен: ${ans.text || 'имеется'}`,
        has_host:   `Только хостинг: ${ans.text || 'имеется'}`,
        delegate:   'Выбор и настройку берёт на себя специалист',
        need_help:  'Нужна помощь с выбором, решение за клиентом',
        has_server: `Сервер/VPS: ${ans.text || 'имеется'}`,
    };
    return map[ans.value] || ans.text || 'Не указано';
}

function generateTZ() {
    const a     = state.answers;
    const pType = a.project_type?.value;
    const lines = [];

    const add  = s  => lines.push(s);
    const sec  = s  => { add(''); add(s); add(''); };
    const sub  = s  => add('  ' + s);
    const item = s  => add('    - ' + s);

    add('Техническое задание на разработку');

    const ptLabel = {
        site:       'Сайт',
        webapp:     'Веб-приложение',
        tgbot:      'Telegram-бот',
        tgbot_site: 'Telegram-бот + Сайт',
        custom:     a.project_type?.text || 'Свой вариант',
    }[pType] || 'Не указано';

    sub(`Тип проекта: ${ptLabel}`);
    add('');
    sub('Описание проекта:');
    add('  ' + (a.project_idea || 'Не указано'));

    if (pType === 'site')       tzSite(a, add, sec, sub, item);
    if (pType === 'webapp')     tzWebapp(a, add, sec, sub, item);
    if (pType === 'tgbot')      tzBot(a, add, sec, sub, item);
    if (pType === 'tgbot_site') tzBotSite(a, add, sec, sub, item);

    sec('Общие параметры');

    const dlLabel = {
        asap:         'Как можно быстрее',
        '1_month':    '1 месяц',
        '2_3_months': '2–3 месяца',
        custom:       a.deadline?.text || 'Свой вариант',
    }[a.deadline?.value] || 'Не указано';
    sub(`Сроки запуска: ${dlLabel}`);

    const budget = a.budget ? `${Number(a.budget).toLocaleString('ru-RU')} руб.` : 'Не указано';
    sub(`Бюджет: ${budget}`);

    const ctLabel = { telegram: 'Telegram', email: 'Email', phone: 'Телефон', custom: 'Другой способ' };
    const ct = a.contact_type;
    sub(`Способ связи: ${ctLabel[ct?.value] || ct?.value || 'Не указано'}`);
    if (ct?.text) sub(`Контакт: ${ct.text}`);

    if (a.extra_info?.trim()) {
        add('');
        sub('Дополнительно:');
        add('  ' + a.extra_info);
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function tzSite(a, add, sec, sub, item) {
    sec('Сайт');

    const siteTypes = {
        landing: 'Лендинг', corporate: 'Корпоративный сайт',
        shop: 'Интернет-магазин', portal: 'Портал / Сервис',
        custom: a.site_type?.text || 'Свой вариант',
    };
    sub(`Тип: ${siteTypes[a.site_type?.value] || 'Не указано'}`);
    sub(`Основная цель: ${a.site_goal || 'Не указано'}`);

    if (a.site_functions?.values?.length) {
        add('');
        sub('Функции:');
        const fl = {
            registration: 'Регистрация пользователей', cabinet: 'Личный кабинет',
            comments: 'Комментарии', search: 'Поиск', admin: 'Админ-панель',
            feedback: 'Форма обратной связи', uploads: 'Загрузка файлов', payment: 'Онлайн-оплата',
            custom: a.site_functions.texts?.custom || 'Свой вариант',
        };
        a.site_functions.values.forEach(v => item(fl[v] || v));

        if (a.site_functions.values.includes('registration') && a.site_reg_method?.values?.length) {
            add('');
            sub('Способ регистрации:');
            const rl = { email: 'Email + пароль', social: 'Социальные сети', telegram: 'Telegram',
                custom: a.site_reg_method.texts?.custom || 'Свой вариант' };
            a.site_reg_method.values.forEach(v => item(rl[v] || v));
        }

        if (a.site_functions.values.includes('cabinet') && a.site_cabinet_desc) {
            add('');
            sub('Возможности личного кабинета:');
            add('  ' + a.site_cabinet_desc);
        }

        if (a.site_functions.values.includes('admin') && a.site_admin_desc) {
            add('');
            sub('Функции администратора:');
            add('  ' + a.site_admin_desc);
        }

        if (a.site_functions.values.includes('payment') && a.site_payment_method?.values?.length) {
            add('');
            sub('Платёжные системы:');
            const pl = { stripe: 'Stripe', paypal: 'PayPal', crypto: 'Криптовалюта',
                custom: a.site_payment_method.texts?.custom || 'Свой вариант' };
            a.site_payment_method.values.forEach(v => item(pl[v] || v));
        }
    }

    if (a.site_type?.value === 'shop' && a.shop_features?.values?.length) {
        add('');
        sub('Функции интернет-магазина:');
        const sl = {
            catalog: 'Каталог товаров', cart: 'Корзина', filters: 'Фильтры',
            reviews: 'Отзывы покупателей', delivery: 'Доставка',
            admin_products: 'Управление товарами через админку',
            custom: a.shop_features.texts?.custom || 'Свой вариант',
        };
        a.shop_features.values.forEach(v => item(sl[v] || v));
    }

    add('');
    const dsMap = {
        ready:    a.site_design?.text
            ? `Готовый дизайн (Figma): ${a.site_design.text}`
            : 'Готовый дизайн предоставлен',
        examples: `Примеры для референса: ${a.site_design?.text || 'не указаны'}`,
        develop:  'Дизайн разрабатывается с нуля',
        custom:   a.site_design?.text || 'Свой вариант',
    };
    sub(`Дизайн: ${dsMap[a.site_design?.value] || 'Не указано'}`);

    if (a.site_content?.values?.length) {
        add('');
        sub('Контент:');
        const cl = {
            texts: 'Тексты предоставлены', images: 'Изображения предоставлены',
            need_create: 'Нужно создать',
            custom: a.site_content.texts?.custom || 'Свой вариант',
        };
        a.site_content.values.forEach(v => item(cl[v] || v));
    }

    add('');
    sub(`Хостинг и домен: ${hostingLine(a.site_hosting)}`);
}

function tzWebapp(a, add, sec, sub, item) {
    sec('Веб-приложение');

    const tMap = { saas: 'SaaS-платформа', crm: 'CRM-система', social: 'Социальная платформа',
        files: 'Файловый сервис', custom: a.webapp_type?.text || 'Свой вариант' };
    sub(`Тип: ${tMap[a.webapp_type?.value] || 'Не указано'}`);

    const uMap = {
        users_only:  'Только пользователи',
        users_admin: 'Пользователи + Администратор',
        multi_roles: `Несколько ролей: ${a.webapp_users?.text || ''}`,
        custom:      a.webapp_users?.text || 'Свой вариант',
    };
    sub(`Роли в системе: ${uMap[a.webapp_users?.value] || 'Не указано'}`);

    if (a.webapp_functions?.values?.length) {
        add('');
        sub('Функции:');
        const fl = {
            registration: 'Регистрация / авторизация', cabinet: 'Личный кабинет',
            uploads: 'Загрузка файлов', chat: 'Чат / мессенджер',
            notifications: 'Уведомления', subscriptions: 'Подписки / тарифы', payment: 'Оплата',
            custom: a.webapp_functions.texts?.custom || 'Свой вариант',
        };
        a.webapp_functions.values.forEach(v => item(fl[v] || v));
    }

    add('');
    const sMap = { under_100: 'До 100 пользователей', under_1000: 'До 1 000 пользователей',
        over_1000: '1 000+ пользователей', custom: a.webapp_scale?.text || 'Свой вариант' };
    sub(`Ожидаемый масштаб: ${sMap[a.webapp_scale?.value] || 'Не указано'}`);

    const dMap = {
        ready:    a.webapp_design?.text
            ? `Готовый дизайн (Figma): ${a.webapp_design.text}`
            : 'Готовый дизайн предоставлен',
        examples: `Примеры для референса: ${a.webapp_design?.text || 'не указаны'}`,
        develop:  'Дизайн разрабатывается с нуля',
        custom:   a.webapp_design?.text || 'Свой вариант',
    };
    sub(`Дизайн: ${dMap[a.webapp_design?.value] || 'Не указано'}`);

    sub(`Хостинг и домен: ${hostingLine(a.webapp_hosting)}`);
}

function tzBot(a, add, sec, sub, item) {
    sec('Telegram-бот');

    const tMap = {
        support: 'Поддержка пользователей', automation: 'Автоматизация процессов',
        orders: 'Приём заказов', info: 'Информационный бот',
        custom: a.bot_task?.text || 'Свой вариант',
    };
    sub(`Задача: ${tMap[a.bot_task?.value] || 'Не указано'}`);
    sub(`База данных: ${a.bot_db?.value === 'yes' ? 'Да' : 'Нет'}`);

    if (a.bot_db?.value === 'yes' && a.bot_db_what?.values?.length) {
        add('');
        sub('Что хранить в базе:');
        const dl = { users: 'Пользователи', orders: 'Заказы', messages: 'Сообщения', files: 'Файлы',
            custom: a.bot_db_what.texts?.custom || 'Свой вариант' };
        a.bot_db_what.values.forEach(v => item(dl[v] || v));
    }

    add('');
    sub(`Административная панель: ${a.bot_admin?.value === 'yes' ? 'Да' : 'Нет'}`);

    if (a.bot_services?.values?.length) {
        add('');
        sub('Внешние интеграции:');
        const sl = { site: 'Сайт', payments: 'Платёжная система', crm: 'CRM',
            custom: a.bot_services.texts?.custom || 'Свой вариант' };
        a.bot_services.values.forEach(v => item(sl[v] || v));
    }

    add('');
    sub(`Хостинг сервера: ${hostingLine(a.bot_hosting)}`);
}

function tzBotSite(a, add, sec, sub, item) {
    sec('Telegram-бот + Сайт');

    const stMap = { landing: 'Лендинг', service: 'Сервис / SaaS', shop: 'Интернет-магазин',
        custom: a.botsite_site_type?.text || 'Свой вариант' };
    sub(`Тип сайта: ${stMap[a.botsite_site_type?.value] || 'Не указано'}`);

    if (a.botsite_site_functions?.values?.length) {
        add('');
        sub('Функции сайта:');
        const fl = { registration: 'Регистрация', cabinet: 'Личный кабинет', catalog: 'Каталог',
            payments: 'Платежи', admin: 'Админ-панель',
            custom: a.botsite_site_functions.texts?.custom || 'Свой вариант' };
        a.botsite_site_functions.values.forEach(v => item(fl[v] || v));
    }

    if (a.botsite_bot_functions?.values?.length) {
        add('');
        sub('Функции бота:');
        const bl = { notifications: 'Уведомления', account: 'Управление аккаунтом',
            orders: 'Заказы', support: 'Поддержка',
            custom: a.botsite_bot_functions.texts?.custom || 'Свой вариант' };
        a.botsite_bot_functions.values.forEach(v => item(bl[v] || v));
    }

    if (a.botsite_interaction?.values?.length) {
        add('');
        sub('Взаимодействие бота и сайта:');
        const il = {
            notifications: 'Бот отправляет уведомления о событиях на сайте',
            manage_site:   'Управление сайтом через бота',
            tg_auth:       'Авторизация на сайте через Telegram',
            custom:        a.botsite_interaction.texts?.custom || 'Свой вариант',
        };
        a.botsite_interaction.values.forEach(v => item(il[v] || v));
    }

    add('');
    const dMap = {
        ready:    a.botsite_design?.text
            ? `Готовый дизайн (Figma): ${a.botsite_design.text}`
            : 'Готовый дизайн предоставлен',
        examples: `Примеры для референса: ${a.botsite_design?.text || 'не указаны'}`,
        develop:  'Дизайн разрабатывается с нуля',
        custom:   a.botsite_design?.text || 'Свой вариант',
    };
    sub(`Дизайн: ${dMap[a.botsite_design?.value] || 'Не указано'}`);

    add('');
    sub(`Хостинг и домен: ${hostingLine(a.botsite_hosting)}`);
}

function renderResult() {
    const quizScreen   = document.getElementById('quizScreen');
    const resultScreen = document.getElementById('resultScreen');
    const bottomNav    = document.getElementById('bottomNav');
    const progressFill = document.getElementById('progressFill');
    const progressLabel= document.getElementById('progressLabel');
    const backBtn      = document.getElementById('progressBackBtn');

    quizScreen.classList.add('hidden');
    bottomNav.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    if (progressFill)  progressFill.style.width = '100%';
    if (progressLabel) progressLabel.textContent = 'ГОТОВО';
    if (backBtn)       backBtn.disabled = false;

    const torText   = generateTZ();
    window._torText = torText;

    const a = state.answers;
    const ct = a.contact_type;
    const ctLabelMap = { telegram: 'Telegram', email: 'Email', phone: 'Телефон', custom: 'Другой способ' };
    window._contact = ct ? `${ctLabelMap[ct.value] || ct.value}: ${ct.text || ''}` : '';

    const encoded  = encodeURIComponent(torText.slice(0, 4000));
    const tgDirect = `https://t.me/${TG_USERNAME}?text=${encoded}`;

    resultScreen.innerHTML = `
    <div class="result-wrap">
      <div class="result-hero">
        <h1>// Техническое задание готово</h1>
      </div>
      <div class="tor-card">
        <div class="tor-card-header">
          <span>Сформированный текст:</span>
        </div>
        <pre class="tor-text" id="torPre">${escH(torText)}</pre>
      </div>

      <div class="file-upload-card">
<!--    Кнопки отключены из-за блокировки API телеграма    <div class="file-upload-label">Прикрепить файлы (необязательно)</div>-->
<!--        <p class="file-upload-hint">Макеты, изображения, документы — всё что поможет понять проект. До 10 файлов, до 50 МБ каждый.</p>-->
<!--        <label class="file-drop-zone" id="fileDropZone">-->
<!--          <input type="file" id="fileInput" multiple accept="*/*" style="display:block;opacity:0;width:0;height:0;position:absolute"-->
<!--            onchange="handleFileSelect(this.files)" />-->
<!--          <div class="file-drop-icon">📎</div>-->
<!--          <div class="file-drop-text">Нажмите или перетащите файлы сюда</div>-->
<!--        </label>-->
<!--        <div class="file-list" id="fileList"></div>-->
      </div>

      <div class="actions">
        <button class="act-btn act-copy" id="copyBtn" onclick="doCopy()">Скопировать ТЗ</button>
        <a class="act-btn act-direct" href="${tgDirect}" target="_blank" rel="noopener">
          Написать напрямую в Telegram (с текстом ТЗ)
        </a>
<!--   Кнопка временно удалена из-за блокировки телеграм API    -->
<!--        <button class="act-btn act-bot" id="botBtn" onclick="doSendBot()">-->
<!--          Отправить через бота — я напишу вам сам-->
<!--        </button>-->
        <div id="sendStatus" class="send-status"></div>
        <button class="act-btn act-restart btn-ghost" onclick="doRestart()">Начать заново</button>
      </div>
    </div>
  `;

    // Drag & drop
    const zone = document.getElementById('fileDropZone');
    if (zone) {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            handleFileSelect(e.dataTransfer.files);
        });
        // label naturally triggers input click
    }
}

async function doCopy() {
    const text = window._torText || '';
    const btn = document.getElementById('copyBtn');
    try {
        await navigator.clipboard.writeText(text);
    } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
    }
    if (btn) { btn.textContent = 'Скопировано!'; setTimeout(() => { btn.textContent = 'Скопировать ТЗ'; }, 2500); }
}

// Хранилище выбранных файлов
window._resultFiles = [];

function handleFileSelect(fileList) {
    Array.from(fileList).forEach(f => {
        if (window._resultFiles.length >= 10) return;
        if (f.size > 50 * 1024 * 1024) { alert(`Файл "${f.name}" слишком большой (макс. 50 МБ)`); return; }
        window._resultFiles.push(f);
    });
    renderFileList();
}

function renderFileList() {
    const list = document.getElementById('fileList');
    if (!list) return;
    list.innerHTML = window._resultFiles.map((f, i) => `
    <div class="file-item">
      <span class="file-name">${escH(f.name)}</span>
      <span class="file-size">${(f.size / 1024).toFixed(0)} КБ</span>
      <button class="file-remove" onclick="removeFile(${i})" title="Удалить">✕</button>
    </div>
  `).join('');
}

function removeFile(idx) {
    window._resultFiles.splice(idx, 1);
    renderFileList();
}

async function doSendBot() {
    const btn    = document.getElementById('botBtn');
    const status = document.getElementById('sendStatus');
    if (btn) { btn.disabled = true; btn.textContent = 'Отправляю…'; }
    if (status) status.className = 'send-status';

    try {
        const fd = new FormData();
        fd.append('tor_text', window._torText || '');
        fd.append('contact',  window._contact || '');
        getAllCollectedFiles().forEach(f => fd.append('files', f, f.name));

        const res  = await fetch(BOT_API_URL, { method: 'POST', body: fd });
        const data = await res.json();

        if (data.success) {
            if (status) {
                const fileCount = (window._selectedFiles || []).length;
                const fileMsg   = fileCount ? ` Файлов отправлено: ${fileCount}.` : '';
                status.textContent = `ТЗ успешно отправлено!${fileMsg} Я напишу вам в ближайшее время.`;
                status.className = 'send-status ok';
            }
            if (btn) btn.textContent = 'Отправлено!';
        } else { throw new Error(data.error || 'Ошибка API'); }
    } catch (e) {
        if (status) { status.textContent = `Не удалось отправить: ${e.message}`; status.className = 'send-status err'; }
        if (btn) { btn.disabled = false; btn.textContent = 'Попробовать снова'; }
    }
}

// File storage: { contextId -> [File, ...] }
window._inlineFiles = {};

function switchInputMode(ctxId, mode, stepId) {
    const textDiv = document.getElementById(`mode_text_${ctxId}`);
    const fileDiv = document.getElementById(`mode_file_${ctxId}`);
    const togText = document.getElementById(`tog_text_${ctxId}`);
    const togFile = document.getElementById(`tog_file_${ctxId}`);
    if (!textDiv || !fileDiv) return;

    if (mode === 'text') {
        textDiv.style.display = '';
        fileDiv.style.display = 'none';
        togText?.classList.add('active');
        togFile?.classList.remove('active');
    } else {
        textDiv.style.display = 'none';
        fileDiv.style.display = '';
        togText?.classList.remove('active');
        togFile?.classList.add('active');
        renderInlineFileList(ctxId, stepId);
    }
}

function addInlineFiles(fileList, stepId, ctxId) {
    if (!window._inlineFiles[ctxId]) window._inlineFiles[ctxId] = [];
    const bucket = window._inlineFiles[ctxId];
    Array.from(fileList).forEach(f => {
        if (bucket.length >= 10) { alert('Максимум 10 файлов на поле'); return; }
        if (f.size > 50 * 1024 * 1024) { alert(`${f.name}: превышает 50 МБ`); return; }
        bucket.push(f);
    });
    renderInlineFileList(ctxId, stepId);
}

function removeInlineFile(ctxId, idx) {
    if (window._inlineFiles[ctxId]) window._inlineFiles[ctxId].splice(idx, 1);
    renderInlineFileList(ctxId);
}

function renderInlineFileList(ctxId) {
    const list = document.getElementById(`flist_${ctxId}`);
    if (!list) return;
    const files = window._inlineFiles[ctxId] || [];
    list.innerHTML = files.map((f, i) => `
    <div class="file-item-inline">
      <span class="file-name">${escH(f.name)}</span>
      <span class="file-size">${(f.size/1024).toFixed(0)} КБ</span>
      <button class="file-remove" onclick="removeInlineFile('${ctxId}',${i})" title="Удалить">✕</button>
    </div>`).join('');
}

function renderAllInlineFileLists() {
    Object.keys(window._inlineFiles || {}).forEach(ctxId => renderInlineFileList(ctxId));
}

function getAllCollectedFiles() {
    const all = [];
    Object.values(window._inlineFiles || {}).forEach(bucket => all.push(...bucket));
    Object.values(window._resultFiles  || {}).forEach(f => all.push(f));
    return all;
}

function doRestart() {
    if (!confirm('Вы уверены? Весь прогресс и ответы будут удалены.')) return;
    clearState();
    render();
}

function escH(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function esc(s)  { return s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

Object.assign(window, { goNext, goBack, selectSingle, toggleMulti, doCopy, doSendBot, doRestart, handleFileSelect, removeFile, removeInlineFile, addInlineFiles, switchInputMode });

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    if (!state.currentStepId) { state.currentStepId = STEPS[0].id; state.history = [STEPS[0].id]; }
    render();
});