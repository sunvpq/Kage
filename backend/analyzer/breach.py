import httpx
from typing import List

KNOWN_BREACHES = {
    "kaspi.kz": {"breached": True, "date": "2023-10-15", "records": 11000000,
                  "exposed": ["email", "phone", "address", "passport"]},
    "linkedin.com": {"breached": True, "date": "2021-06-22", "records": 700000000,
                      "exposed": ["email", "phone", "employment"]},
    "yandex.kz": {"breached": True, "date": "2023-01-25", "records": 4000000,
                   "exposed": ["email", "password_hash"]},
    "egov.kz": {"breached": True, "date": "2022-05-10", "records": 2000000,
                 "exposed": ["email", "iin", "passport"]},
    "facebook.com": {"breached": True, "date": "2021-04-03", "records": 533000000,
                      "exposed": ["phone", "email", "location"]},
    "twitter.com": {"breached": True, "date": "2022-08-05", "records": 400000000,
                     "exposed": ["email", "phone"]},
    "amazon.com": {"breached": False},
    "github.com": {"breached": False},
    "google.com": {"breached": False},
    "telegram.org": {"breached": False},
}


async def check_breach(domain: str) -> dict:
    """Check if a domain has been breached"""
    if domain in KNOWN_BREACHES:
        return KNOWN_BREACHES[domain]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://haveibeenpwned.com/api/v3/breaches",
                headers={"hibp-api-key": "demo"},
                timeout=5.0,
            )
            if response.status_code == 200:
                breaches = response.json()
                for breach in breaches:
                    if domain in breach.get("Domain", "").lower():
                        return {
                            "breached": True,
                            "date": breach.get("BreachDate"),
                            "records": breach.get("PwnCount", 0),
                            "exposed": breach.get("DataClasses", []),
                        }
    except Exception:
        pass

    return {"breached": False}


async def analyze_breaches(services: list) -> dict:
    """Analyze all services for breaches"""
    results = {}
    for service in services:
        domain = service.get("domain", "")
        breach_data = await check_breach(domain)
        results[service["id"]] = breach_data
    return results
