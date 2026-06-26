"""Minimal token authentication for the admin panel.

Single owner-operated user. Login checks credentials from settings and issues a
short-lived signed token (HMAC-SHA256, stdlib only — no extra dependency). The
token is a `payload.signature` pair where payload is `username:expiry`.

This is intentionally simple for a local, single-user MVP. Before exposing the
panel publicly, override ADMIN_PASSWORD and AUTH_SECRET via the environment.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import time

from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings


def _sign(payload: str, secret: str) -> str:
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).decode().rstrip("=")


def create_token(username: str, settings: Settings | None = None) -> tuple[str, int]:
    """Return ``(token, expires_at_epoch)``."""
    settings = settings or get_settings()
    expires_at = int(time.time()) + settings.token_ttl_minutes * 60
    payload = f"{username}:{expires_at}"
    token = f"{base64.urlsafe_b64encode(payload.encode()).decode().rstrip('=')}.{_sign(payload, settings.auth_secret)}"
    return token, expires_at


def verify_token(token: str, settings: Settings | None = None) -> str:
    """Return the username if the token is valid, else raise ``ValueError``."""
    settings = settings or get_settings()
    try:
        payload_b64, signature = token.split(".", 1)
        padding = "=" * (-len(payload_b64) % 4)
        payload = base64.urlsafe_b64decode(payload_b64 + padding).decode()
        username, expiry_str = payload.rsplit(":", 1)
        expiry = int(expiry_str)
    except (ValueError, UnicodeDecodeError) as exc:
        raise ValueError("malformed token") from exc

    expected = _sign(payload, settings.auth_secret)
    if not hmac.compare_digest(expected, signature):
        raise ValueError("bad signature")
    if time.time() > expiry:
        raise ValueError("token expired")
    return username


def login(username: str, password: str, settings: Settings | None = None) -> tuple[str, int]:
    """Validate credentials and return a token. Raises ``ValueError`` on failure."""
    settings = settings or get_settings()
    user_ok = hmac.compare_digest(username, settings.admin_username)
    pass_ok = hmac.compare_digest(password, settings.admin_password)
    if not (user_ok and pass_ok):
        raise ValueError("invalid credentials")
    return create_token(username, settings)


def require_auth(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency: validate the Bearer token, return the username."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    try:
        return verify_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
