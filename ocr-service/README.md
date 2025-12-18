# cents OCR Service

PaddleOCR-based receipt scanning microservice for the cents expense tracker.

## Quick Start with Docker

```bash
# Build and run
docker compose up --build

# Or build manually
docker build -t cents-ocr .
docker run -p 8000:8000 cents-ocr
```

The server will be available at `http://localhost:8000`.

## Local Development (without Docker)

Requires Python 3.10-3.12 and a Linux/macOS arm64 environment (PaddleOCR has limited platform support).

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv sync

# Run the server
uv run uvicorn main:app --reload --port 8000
```

## API Endpoints

### `GET /`
Health check endpoint. Returns service status.

### `GET /health`
Health check for container orchestration.

### `POST /ocr`
Process a receipt image and extract structured data.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` - Image file (JPEG, PNG)

**Response:**
```json
{
  "merchant": "Target",
  "total": 65.77,
  "subtotal": 61.52,
  "date": "2021-06-06",
  "currency": "USD",
  "items": [
    {"name": "MORNIF MEAT", "price": 3.79},
    {"name": "NASOYA VEGET", "price": 4.49}
  ],
  "raw_text": "...",
  "confidence": 0.85
}
```

## Testing

```bash
# Test with curl
curl -X POST "http://localhost:8000/ocr" \
  -H "accept: application/json" \
  -F "file=@receipt.jpg"

# Interactive API docs
open http://localhost:8000/docs
```

## Deployment Options

Since this is a containerized Python service, you can deploy to:

| Platform | Command / Notes |
|----------|-----------------|
| **Railway** | `railway up` |
| **Fly.io** | `fly launch && fly deploy` |
| **Render** | Connect GitHub repo, select Docker |
| **Google Cloud Run** | `gcloud run deploy` |
| **AWS ECS/Fargate** | Push to ECR, create task definition |

### Environment Variables

- `PORT` - Server port (default: 8000)
- Add your production domain to CORS in `main.py`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App (Vercel)                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ReceiptScanner.tsx                              │   │
│  │  - Captures image                                │   │
│  │  - Sends to OCR API                              │   │
│  │  - Displays parsed results                       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ POST /ocr (multipart/form-data)
                          ▼
┌─────────────────────────────────────────────────────────┐
│  OCR Service (Railway/Fly.io/Cloud Run)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  FastAPI + PaddleOCR                             │   │
│  │  - Receives image                                │   │
│  │  - Runs OCR                                      │   │
│  │  - Parses receipt text                           │   │
│  │  - Returns structured JSON                       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Performance Notes

| Scenario | Latency |
|----------|---------|
| First request (models cached) | ~3-5s |
| Subsequent requests | ~1-2s |
| With GPU (paid tier) | <500ms |

### Optimizations Applied

1. **Pre-baked models** - Models are downloaded during Docker build, not at runtime
2. **Multiple workers** - 2 uvicorn workers for concurrent requests
3. **Tuned detection** - Optimized thresholds for receipt text

### Render Deployment

1. Connect your GitHub repo to Render
2. Select "Docker" as the runtime
3. Set build context to `./ocr-service`
4. Set Dockerfile path to `./ocr-service/Dockerfile`
5. Add env var: `NEXT_PUBLIC_OCR_API_URL=https://your-service.onrender.com` to Vercel
