import uvicorn
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import router

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(title="Конструктор Технического Задания")

app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)