# CPU-only PaddleOCR service. Prefer linux/amd64 for broad paddle wheel support.
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml main.py ./

RUN pip install --no-cache-dir \
    "fastapi>=0.104.0" \
    "uvicorn[standard]>=0.24.0" \
    "paddlepaddle==2.6.2" \
    "paddleocr==2.7.3" \
    "python-multipart>=0.0.6" \
    "pillow>=10.0.0" \
    "setuptools>=65.0.0" \
    "numpy<2.0.0"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
