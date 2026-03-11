# ТЗ Генератор

FastAPI + vanilla JS приложение-опросник для создания технического задания.

## Быстрый старт

```bash
# 1. Установить зависимости
pip install -r requirements.txt

# 2. Настроить .env
cp .env .env.local
# Заполнить TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_USERNAME

# 3. Запустить
python main.py
# Открыть http://localhost:8000
```

## Настройка Telegram

| Переменная | Как получить |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Создать бота через [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Узнать через [@userinfobot](https://t.me/userinfobot) |
| `TELEGRAM_USERNAME` | Ваш username в Telegram (без @) |

## Структура

```
portfolio/
├── app/
│   ├── __init__.py
│   ├── routes.py        ← API endpoints
│   └── tor_logic.py     ← TOR formatting 
├── static/
│   ├── css/main.css
│   └── js/tor.js        ← вся логика опросника
├── templates/
│   └── main.html
├── .env
├── main.py
└── requirements.txt
```

## Функции

- 🌳 Полное дерево вопросов (Сайт / Веб-приложение / Telegram-бот / Бот+Сайт)
- ⬅️ Навигация назад без потери ответов
- 📊 Динамический прогресс-бар
- 📋 Генерация TOR на основе ответов
- 📋 Кнопка «Скопировать ТЗ»
- ✈️ Прямая ссылка для отправки ТЗ в Telegram
- 🤖 Отправка через Telegram-бота (клиент не пишет вам сам)
