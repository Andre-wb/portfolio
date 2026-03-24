import os
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from typing import List
from app.tor_logic import format_for_telegram

load_dotenv()

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

BOT_TOKEN:         str = os.getenv("TELEGRAM_BOT_TOKEN", "")
CHAT_ID:           str = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_USERNAME: str = os.getenv("TELEGRAM_USERNAME", "andr3ywb")

TG_API     = f"https://api.telegram.org/bot{BOT_TOKEN}"
MAX_FILE_MB = 50


@router.get("/", response_class=HTMLResponse)
async def root(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("main.html", {"request": request})


@router.get("/tor_builder", response_class=HTMLResponse)
async def tor_builder(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "tor_builder.html",
        {"request": request, "telegram_username": TELEGRAM_USERNAME},
    )


@router.get("/privacy", response_class=HTMLResponse)
async def privacy(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("privacy.html", {"request": request})


@router.post("/send-tor")
async def send_tor(
        tor_text: str = Form(...),
        contact:  str = Form(""),
        files:    List[UploadFile] = File(default=[]),
) -> JSONResponse:

    if not BOT_TOKEN or not CHAT_ID:
        return JSONResponse({
            "success": False,
            "error": "Бот не настроен. Установите BOT_TOKEN и CHAT_ID в .env и перезапустите сервер.",
        })

    async with httpx.AsyncClient(timeout=30.0) as client:

        message = format_for_telegram(tor_text, contact)
        resp = await client.post(
            f"{TG_API}/sendMessage",
            json={"chat_id": CHAT_ID, "text": message, "parse_mode": "HTML"},
        )
        if resp.status_code != 200:
            return JSONResponse({"success": False, "error": f"Telegram API: {resp.text}"})

        errors = []
        valid_files = [f for f in files if f and f.filename]
        for f in valid_files:
            content = await f.read()
            if len(content) > MAX_FILE_MB * 1024 * 1024:
                errors.append(f"{f.filename}: превышает {MAX_FILE_MB} МБ")
                continue
            try:
                file_resp = await client.post(
                    f"{TG_API}/sendDocument",
                    data={"chat_id": CHAT_ID, "caption": f"Файл от клиента: {f.filename}"},
                    files={"document": (f.filename, content, f.content_type or "application/octet-stream")},
                )
                if file_resp.status_code != 200:
                    errors.append(f"{f.filename}: {file_resp.text}")
            except Exception as exc:
                errors.append(f"{f.filename}: {exc}")

    if errors:
        return JSONResponse({
            "success": True,
            "warning": f"ТЗ отправлено, но некоторые файлы не удалось: {'; '.join(errors)}",
        })
    return JSONResponse({"success": True})