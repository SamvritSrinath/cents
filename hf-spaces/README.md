---
title: Cents OCR
emoji: 🧾
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Cents OCR Service

PaddleOCR-based receipt scanning API for the Cents expense tracker.

## API Endpoints

### `POST /ocr`
Process a receipt image and extract structured data.

**Request:** `multipart/form-data` with `file` field containing an image.

**Response:**
```json
{
  "merchant": "Target",
  "total": 65.77,
  "date": "2021-06-06",
  "confidence": 0.85
}
```

### `GET /health`
Health check endpoint.
