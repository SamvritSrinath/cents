# PaddleOCR Receipt Scanner Service
# Multi-stage build for smaller final image

FROM python:3.10-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy project files
COPY pyproject.toml .
COPY main.py .

# Create virtual environment and install dependencies
RUN uv venv /app/.venv
RUN uv sync --frozen 2>/dev/null || uv sync

# ============================================================================
# Production image
# ============================================================================
FROM python:3.10-slim

# Install runtime dependencies for PaddleOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/main.py .

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Note: Models are downloaded on first request (~15MB, ~30s)
# This is unavoidable with PaddlePaddle 2.6.x due to build-time segfaults
# The models are cached in /root/.paddleocr/whl for subsequent requests

# Expose port
EXPOSE 8000

# Health check (increased start period for first model download)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the server with multiple workers for better throughput
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
