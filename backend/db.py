import sqlite3
from config import DATABASE_PATH


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id            TEXT PRIMARY KEY,
            email         TEXT,
            access_token  TEXT,
            refresh_token TEXT,
            expires_at    INTEGER
        );

        CREATE TABLE IF NOT EXISTS services (
            id              TEXT PRIMARY KEY,
            session_id      TEXT,
            name            TEXT,
            domain          TEXT,
            registered_at   TEXT,
            last_email_at   TEXT,
            data_fields     TEXT,
            problems        TEXT,
            data_mass       INTEGER,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS scan_jobs (
            id              TEXT PRIMARY KEY,
            session_id      TEXT,
            status          TEXT DEFAULT 'running',
            total           INTEGER DEFAULT 0,
            processed       INTEGER DEFAULT 0,
            services_found  INTEGER DEFAULT 0,
            created_at      INTEGER,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );
    """)
    conn.commit()
    conn.close()
