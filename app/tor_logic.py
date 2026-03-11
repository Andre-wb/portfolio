"""
Функционал для создания шаблона технического задания
"""

MAX_TG_MSG = 4096


def truncate_text(text: str, max_length: int = MAX_TG_MSG) -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - 50] + "\n\n... (текст обрезан, полная версия скопирована клиентом)"


def format_for_telegram(tor_text: str, contact: str) -> str:
    """Редактирование текста для красивой интеграции"""
    header = (
        "<b>Техническое задание</b>\n"
        "\n\n"
    )
    if contact:
        header += f"<b>Мои контакты:</b> <code>{contact}</code>\n\n"
        header += "\n\n"

    full = header + tor_text
    return truncate_text(full)
