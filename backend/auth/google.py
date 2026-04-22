import json as _json
import time
import urllib.request
import uuid

from fastapi import APIRouter
from fastapi.responses import JSONResponse, RedirectResponse
from google_auth_oauthlib.flow import Flow

from config import (FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
                    GOOGLE_REDIRECT_URI)
from db import get_db

router = APIRouter()

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.readonly",
]

CLIENT_CONFIG = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uris": [GOOGLE_REDIRECT_URI],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}


def _make_flow() -> Flow:
    return Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES, redirect_uri=GOOGLE_REDIRECT_URI
    )


def _get_email(access_token: str) -> str:
    req = urllib.request.Request(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    with urllib.request.urlopen(req) as resp:
        return _json.loads(resp.read()).get("email", "unknown@unknown.com")


@router.get("/api/auth/login")
def login():
    flow = _make_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline", prompt="consent", include_granted_scopes="true"
    )
    return JSONResponse({"auth_url": auth_url})


@router.get("/api/auth/callback")
def callback(code: str):
    flow = _make_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials

    email = _get_email(creds.token)
    session_id = str(uuid.uuid4())
    expires_at = int(creds.expiry.timestamp()) if creds.expiry else int(time.time()) + 3600

    conn = get_db()
    conn.execute(
        "INSERT INTO sessions (id, email, access_token, refresh_token, expires_at)"
        " VALUES (?,?,?,?,?)",
        (session_id, email, creds.token, creds.refresh_token, expires_at),
    )
    conn.commit()
    conn.close()

    return RedirectResponse(f"{FRONTEND_URL}/graph?session_id={session_id}")
