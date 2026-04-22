import json
import re
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.google import router as auth_router
from db import get_db, init_db
from scanner.routes import router as scan_router
from analyzer.breach import analyze_breaches

# ── Startup ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(scan_router)

# ── Mock data (used when no session) ─────────────────────────────────────────

def load_mock_data():
    try:
        with open('mock_services.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            services = data.get('services', [])
            print(f"✅ Loaded {len(services)} services")
            if services:
                print(f"First service: {services[0]['name']}")
            return services
    except FileNotFoundError:
        print("❌ mock_services.json not found!")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        return []
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return []

MOCK_SERVICES = load_mock_data()

DEMO_GRAPH = {
    "nodes": [
        {"id": "you", "name": "You", "dataMass": 10, "isCenter": True, "category": "user"}
    ] + [
        {
            "id": s['id'],
            "name": s['name'],
            "dataMass": s['dataMass'],
            "isCenter": False,
            "category": "service",
            "problems": s.get('problems', []),
            "dataFields": s.get('dataFields', [])
        }
        for s in MOCK_SERVICES
    ],
    "links": [
        {
            "source": "you",
            "target": s['id'],
            "problems": s.get('problems', []),
            "dataFields": s.get('dataFields', [])
        }
        for s in MOCK_SERVICES
    ]
}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/graph/demo")
def get_demo_graph():
    return DEMO_GRAPH


@app.get("/api/graph")
def get_graph(session_id: Optional[str] = None):
    if not session_id or session_id.startswith("demo-"):
        return DEMO_GRAPH

    conn = get_db()
    services = conn.execute(
        "SELECT * FROM services WHERE session_id=?", (session_id,)
    ).fetchall()
    conn.close()

    if not services:
        return DEMO_GRAPH

    nodes = [{"id": "you", "name": "You", "dataMass": 10, "isCenter": True, "category": "user"}]
    links = []

    for s in services:
        node_id = re.sub(r"[.\-]", "_", s["domain"])
        nodes.append({
            "id":       node_id,
            "name":     s["name"],
            "dataMass": s["data_mass"],
            "isCenter": False,
            "category": "service",
        })
        links.append({
            "source":     "you",
            "target":     node_id,
            "problems":   json.loads(s["problems"]),
            "dataFields": json.loads(s["data_fields"]),
        })

    return {"nodes": nodes, "links": links}


@app.get("/api/analyze/breaches")
async def get_breaches():
    KNOWN_BREACHES = {
        "kaspi": {"breached": True, "date": "2023-10-15",
                  "records": 11000000,
                  "exposed": ["email", "phone", "passport"]},
        "linkedin": {"breached": True, "date": "2021-06-22",
                     "records": 700000000,
                     "exposed": ["email", "phone"]},
        "facebook": {"breached": True, "date": "2021-04-03",
                     "records": 533000000,
                     "exposed": ["phone", "email"]},
        "yandex": {"breached": True, "date": "2023-01-25",
                   "records": 4000000,
                   "exposed": ["email", "password_hash"]},
        "egov": {"breached": True, "date": "2022-05-10",
                 "records": 2000000,
                 "exposed": ["email", "iin", "passport"]},
        "twitter": {"breached": True, "date": "2022-08-05",
                    "records": 400000000,
                    "exposed": ["email", "phone"]},
    }
    return KNOWN_BREACHES


@app.get("/api/analyze/service/{service_id}")
def analyze_service(service_id: str):
    service = next(
        (s for s in MOCK_SERVICES if s['id'] == service_id), None
    )
    if not service:
        return {"analysis": "Сервис не найден"}

    ANALYSES = {
        "kaspi": "Kaspi хранит твои финансовые данные, номер карты и паспорт. Сервис был взломан в 2023 — данные 11 млн казахстанцев утекли в даркнет. Риск: КРИТИЧЕСКИЙ. Рекомендуем немедленно запросить удаление старых данных.",
        "google": "Google собирает историю поиска, геолокацию 24/7, данные календаря и контакты. Активно продаёт данные рекламным сетям через DoubleClick. Риск: ВЫСОКИЙ. Отключи персонализированную рекламу в настройках.",
        "facebook": "Facebook хранит поведенческие данные, список друзей и историю действий. Утечка 2021 затронула 533 млн пользователей. Риск: ВЫСОКИЙ. Ограничь доступ приложений в настройках приватности.",
        "linkedin": "LinkedIn хранит профессиональные данные, телефон и историю работы. Взломан в 2021 — утекло 700 млн аккаунтов. Риск: ВЫСОКИЙ. Смени пароль и включи 2FA.",
        "yandex": "Yandex собирает данные поиска, геолокацию и историю браузера. Передаёт данные третьим лицам через Yandex.Ads. Взломан в 2023. Риск: ВЫСОКИЙ.",
        "egov": "eGov хранит ИИН, паспортные данные и государственные документы. Взломан в 2022. Риск: КРИТИЧЕСКИЙ — это самые чувствительные данные.",
        "uber": "Uber запрашивает геолокацию, контакты и микрофон — избыточный доступ. Достаточно только геолокации для работы сервиса. Риск: СРЕДНИЙ.",
        "glovo": "Glovo запрашивает доступ к камере и контактам без необходимости. Хранит историю заказов и адреса доставки. Риск: СРЕДНИЙ.",
        "telegram": "Telegram хранит номер телефона и список контактов. Не продаёт данные, хорошее шифрование. Риск: НИЗКИЙ.",
        "github": "GitHub хранит email и репозитории кода. Не продаёт данные. Риск: НИЗКИЙ — если нет приватного кода с секретами.",
        "twitter": "Twitter/X хранит email и историю постов. Заброшен — последняя активность 2+ лет назад. Риск: СРЕДНИЙ. Удали аккаунт если не используешь.",
        "spotify": "Spotify хранит email и историю прослушиваний. Не использовался 2+ лет. Риск: НИЗКИЙ. Можно безопасно удалить.",
        "discord": "Discord хранит email, сообщения и список серверов. Не продаёт данные активно. Риск: НИЗКИЙ.",
        "instagram": "Instagram продаёт поведенческие данные через Meta Ads. Хранит историю действий и интересы. Риск: ВЫСОКИЙ.",
        "tiktok": "TikTok принадлежит ByteDance (Китай). Собирает биометрию, геолокацию и поведенческие данные. Риск: КРИТИЧЕСКИЙ для приватности.",
        "vk": "VK хранит данные в России. Доступен спецслужбам по запросу. Риск: ВЫСОКИЙ если есть личные переписки.",
    }

    default = (
        f"{service['name']} собирает {', '.join(service.get('dataFields', []))}. "
        f"Проверьте настройки приватности в аккаунте. "
        f"Риск: {'ВЫСОКИЙ' if service.get('problems') else 'НИЗКИЙ'}."
    )

    return {"analysis": ANALYSES.get(service_id, default)}


@app.post("/api/generate/deletion-email/{service_id}")
def get_deletion_email(service_id: str):
    service = next(
        (s for s in MOCK_SERVICES if s['id'] == service_id), None
    )
    if not service:
        return {"email": "Сервис не найден"}

    name = service['name']
    fields = ', '.join(service.get('dataFields', []))

    email = f"""Уважаемая служба поддержки {name},

Прошу вас удалить все мои персональные данные в соответствии
со статьёй 25 Закона Республики Казахстан №94-V
«О персональных данных и их защите».

Мой аккаунт: abilmansur2501@gmail.com
Данные к удалению: {fields}

Прошу подтвердить выполнение запроса в течение 30 календарных
дней с момента получения настоящего обращения.

В случае невыполнения запроса оставляю за собой право обратиться
в уполномоченный орган по защите персональных данных РК.

С уважением,
Абилмансур"""

    return {"email": email}


@app.get("/api/supply-chain/{service_id}")
def get_supply_chain(service_id: str):
    chains = {
        "google": ["Google Ads", "DoubleClick", "YouTube Analytics",
                   "Google Analytics", "Firebase"],
        "facebook": ["Meta Ads", "Instagram Ads", "WhatsApp Business",
                     "Audience Network", "Facebook Pixel"],
        "kaspi": ["Kaspi Marketing", "Partner Banks", "МФО Partners"],
        "yandex": ["Yandex Ads", "Yandex Metrica", "YAN Network"],
        "linkedin": ["LinkedIn Ads", "Microsoft Ads", "Bing Ads"],
        "tiktok": ["TikTok Ads", "ByteDance Analytics", "Douyin"],
        "instagram": ["Meta Ads", "Facebook Business Suite"],
        "amazon": ["Amazon Ads", "AWS Partners", "Amazon DSP"],
        "twitter": ["Twitter Ads", "MoPub", "X Ad Network"],
        "vk": ["VK Ads", "myTarget", "OK.ru"],
    }
    return {"partners": chains.get(service_id, [])}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
