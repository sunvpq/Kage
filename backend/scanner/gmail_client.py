from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

QUERIES = [
    "subject:(welcome OR подтверждение OR регистрация OR 'account created' OR 'verify your email')",
    "subject:(receipt OR заказ OR order OR invoice)",
    "from:(noreply OR no-reply OR donotreply)",
]

MAX_PER_QUERY = 200
MAX_TOTAL = 500


def _search_query(access_token: str, query: str) -> List[Dict]:
    creds = Credentials(token=access_token)
    service = build("gmail", "v1", credentials=creds)

    resp = service.users().messages().list(
        userId="me", q=query, maxResults=MAX_PER_QUERY
    ).execute()
    messages = resp.get("messages", [])
    if not messages:
        return []

    results: List[Dict] = []

    def _cb(request_id, response, exception):
        if exception or not response:
            return
        headers = {
            h["name"]: h["value"]
            for h in response.get("payload", {}).get("headers", [])
        }
        results.append({
            "message_id": response["id"],
            "from_email": headers.get("From", ""),
            "subject":    headers.get("Subject", ""),
            "date":       headers.get("Date", ""),
            "snippet":    response.get("snippet", ""),
        })

    # Batch-fetch metadata (100 msgs per HTTP request)
    for i in range(0, len(messages), 100):
        batch = service.new_batch_http_request(callback=_cb)
        for msg in messages[i:i + 100]:
            batch.add(
                service.users().messages().get(
                    userId="me", id=msg["id"], format="metadata",
                    metadataHeaders=["From", "Subject", "Date"],
                )
            )
        batch.execute()

    return results


def fetch_registration_emails(access_token: str) -> List[Dict]:
    """Run 3 Gmail searches in parallel, deduplicate, return up to 500 messages."""
    seen: set = set()
    all_msgs: List[Dict] = []

    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {ex.submit(_search_query, access_token, q): q for q in QUERIES}
        for future in as_completed(futures):
            try:
                for msg in future.result():
                    if msg["message_id"] not in seen:
                        seen.add(msg["message_id"])
                        all_msgs.append(msg)
            except Exception:
                pass

    return all_msgs[:MAX_TOTAL]
