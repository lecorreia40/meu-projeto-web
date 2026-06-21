# Backend API image for Mesa Proprietária com IA (FastAPI).
# Paper-only; live trading disabled by default.
FROM python:3.12-slim

WORKDIR /app

# Install runtime deps first (better layer caching).
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code (the frontend in web/ is excluded via .dockerignore).
COPY . .

# Safety defaults (override via the platform's env settings).
ENV LIVE_TRADING_ENABLED=false \
    EXECUTION_MODE=paper \
    PYTHONUNBUFFERED=1

EXPOSE 8000

# $PORT is provided by the hosting platform (Render, etc.); default 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
