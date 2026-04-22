# Kage — Your Digital Shadow

> Визуализируй и контролируй свой цифровой след

![Kage Graph](https://img.shields.io/badge/status-hackathon%20demo-blue)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20FastAPI-green)

## Что такое Kage?

Kage сканирует твою почту, находит все сервисы где ты 
регистрировался, и строит интерактивный граф твоего 
цифрового следа. Каждый цвет ребра = тип проблемы.

## Цвета рёбер

- 🔴 Красный — утечка данных (сервис был взломан)
- 🟣 Фиолетовый — продаёт данные третьим лицам  
- 🟡 Жёлтый — zombie (2+ лет не используется)
- 🟠 Оранжевый — избыточный доступ
- ⚫ Серый — норма

## Функционал

- Force-directed граф 50+ сервисов
- Анализ утечек через HIBP
- ИИ-анализ рисков каждого сервиса
- Автогенерация писем удаления (ст.25 Закона РК №94-V)
- Data Supply Chain — куда сервис передаёт твои данные
- Timeline 2015→2026
- Категоризация данных (личные/финансовые/образовательные)

## Stack

- **Frontend:** React + Vite + TypeScript + react-force-graph-2d
- **Backend:** FastAPI + SQLite + Python
- **AI:** Claude API (Anthropic)
- **Auth:** Google OAuth 2.0

## Запуск

```bash
# Backend
cd backend
py -m pip install -r requirements.txt
py main.py

# Frontend  
cd frontend
npm install
npm run dev
```
