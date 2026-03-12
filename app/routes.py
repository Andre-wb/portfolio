import os
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from app.tor_logic import format_for_telegram

load_dotenv()

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Переменные для интеграции телеграм-бота (обозначены в .env)
BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_USERNAME: str = os.getenv("TELEGRAM_USERNAME", "andr3ywb")


# Маршруты и переадресации
@router.get("/", response_class=HTMLResponse)
async def root(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "main.html",
        {"request": request}
    )


@router.get("/tor_builder", response_class=HTMLResponse)
async def tor_builder(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "tor_builder.html",
        {"request": request, "telegram_username": TELEGRAM_USERNAME},
    )


class TORSubmission(BaseModel):
    tor_text: str
    contact: str = ""


@router.post("/send-tor")
async def send_tor(data: TORSubmission) -> JSONResponse:
    if not BOT_TOKEN:
        return JSONResponse(
            {
                "success": False,
                "error": (
                    "Бот не настроен. Установите BOT_TOKEN и CHAT_ID в файле .env "
                    "и перезапустите сервер."
                ),
            }
        )

    message = format_for_telegram(data.tor_text, data.contact)
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                url,
                json={
                    "chat_id": CHAT_ID,
                    "text": message,
                    "parse_mode": "HTML",
                },
            )
        if resp.status_code == 200:
            return JSONResponse({"success": True})
        return JSONResponse(
            {"success": False, "error": f"Telegram API: {resp.text}"}
        )
    except Exception as exc:
        return JSONResponse({"success": False, "error": str(exc)})
