import json
import re
import time
import uuid
from collections import defaultdict

from fastapi import APIRouter, BackgroundTasks, HTTPException

from db import get_db
from scanner.gmail_client import fetch_registration_emails

router = APIRouter()

_STRIP = re.compile(
    r"^(mail|email|noreply|no-reply|notifications?|mailer|bounce|reply"
    r"|accounts?|info|support|news|promo|offers?|alerts?|hello|team|updates?)\.",
    re.IGNORECASE,
)


def _domain(from_email: str) -> str:
    m = re.search(r"[\w.+%-]+@([\w.-]+\.[a-z]{2,})", from_email, re.IGNORECASE)
    if not m:
        return ""
    return _STRIP.sub("", m.group(1).lower())


def _name(domain: str) -> str:
    parts = domain.split(".")
    raw = parts[-2] if len(parts) >= 2 else parts[0]
    return raw.capitalize()


def _run_scan(job_id: str, session_id: str, access_token: str) -> None:
    conn = get_db()
    try:
        emails = fetch_registration_emails(access_token)

        conn.execute("UPDATE scan_jobs SET total=? WHERE id=?", (len(emails), job_id))
        conn.commit()

        domain_map: dict = defaultdict(list)
        for i, email in enumerate(emails):
            d = _domain(email["from_email"])
            if d and len(d) > 4:
                domain_map[d].append(email)
            if i % 30 == 0:
                conn.execute("UPDATE scan_jobs SET processed=? WHERE id=?", (i + 1, job_id))
                conn.commit()

        for domain, mails in domain_map.items():
            dates = sorted(filter(None, (m.get("date", "") for m in mails)))
            conn.execute(
                """INSERT OR REPLACE INTO services
                   (id, session_id, name, domain, registered_at, last_email_at,
                    data_fields, problems, data_mass)
                   VALUES (?,?,?,?,?,?,?,?,?)""",
                (
                    str(uuid.uuid4()), session_id,
                    _name(domain), domain,
                    dates[0] if dates else None,
                    dates[-1] if dates else None,
                    json.dumps(["email"]),
                    json.dumps([]),
                    min(10, max(1, round(len(mails) ** 0.5))),
                ),
            )

        conn.execute(
            "UPDATE scan_jobs SET status='done', processed=?, services_found=? WHERE id=?",
            (len(emails), len(domain_map), job_id),
        )
        conn.commit()
    except Exception:
        conn.execute("UPDATE scan_jobs SET status='error' WHERE id=?", (job_id,))
        conn.commit()
    finally:
        conn.close()


@router.get("/api/scan/start")
def scan_start(session_id: str, background_tasks: BackgroundTasks):
    conn = get_db()

    # Return existing job if running or done
    existing = conn.execute(
        "SELECT id, status FROM scan_jobs WHERE session_id=? ORDER BY rowid DESC LIMIT 1",
        (session_id,),
    ).fetchone()
    if existing and existing["status"] in ("running", "done"):
        conn.close()
        return {"job_id": existing["id"]}

    session = conn.execute(
        "SELECT access_token FROM sessions WHERE id=?", (session_id,)
    ).fetchone()
    conn.close()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    job_id = str(uuid.uuid4())
    conn2 = get_db()
    conn2.execute(
        "INSERT INTO scan_jobs (id, session_id, status, total, processed, services_found, created_at)"
        " VALUES (?,?,'running',0,0,0,?)",
        (job_id, session_id, int(time.time())),
    )
    conn2.commit()
    conn2.close()

    background_tasks.add_task(_run_scan, job_id, session_id, session["access_token"])
    return {"job_id": job_id}


@router.get("/api/scan/status/{job_id}")
def scan_status(job_id: str):
    conn = get_db()
    job = conn.execute("SELECT * FROM scan_jobs WHERE id=?", (job_id,)).fetchone()
    conn.close()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "status":          job["status"],
        "total":           job["total"],
        "processed":       job["processed"],
        "services_found":  job["services_found"],
    }
