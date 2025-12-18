"""
cents OCR Service - PaddleOCR-based receipt scanning.

FastAPI microservice that provides OCR capabilities for receipt parsing.
Uses PaddleOCR for state-of-the-art accuracy on varied receipt formats and logos.
"""

import io
import re
from functools import lru_cache
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import numpy as np


# ============================================================================
# Models
# ============================================================================

class LineItem(BaseModel):
    """Individual item from receipt."""
    name: str
    price: float


class OCRResult(BaseModel):
    """Parsed receipt data returned from OCR processing."""
    merchant: Optional[str] = None
    total: Optional[float] = None
    subtotal: Optional[float] = None
    date: Optional[str] = None
    currency: str = "USD"
    items: list[LineItem] = []
    raw_text: str = ""
    confidence: float = 0.0


# ============================================================================
# App Setup
# ============================================================================

app = FastAPI(
    title="cents OCR Service",
    description="PaddleOCR-based receipt scanning for expense tracking",
    version="0.1.0"
)

# Allow CORS from Next.js dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add your production domains here
        # "https://your-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# PaddleOCR Initialization (Cached)
# ============================================================================

@lru_cache(maxsize=1)
def get_ocr_engine():
    """
    Get cached PaddleOCR engine instance.
    Using lru_cache ensures the model is loaded only once.
    """
    from paddleocr import PaddleOCR
    
    # Initialize with English language
    # Using PP-OCRv3 mobile models for faster inference
    # det_model_dir/rec_model_dir can specify custom models
    ocr = PaddleOCR(
        use_angle_cls=True,
        lang='en',
        use_gpu=False,
        show_log=False,
        # Use lighter/faster models
        det_model_dir=None,  # Uses default v3 det
        rec_model_dir=None,  # Uses default v4 rec (most accurate)
        cls_model_dir=None,  # Uses default cls
        # Performance tuning
        det_db_thresh=0.3,   # Lower = more text detected
        det_db_box_thresh=0.5,
        det_db_unclip_ratio=1.6,
        use_space_char=True,
    )
    return ocr


# ============================================================================
# Receipt Parsing Logic
# ============================================================================

# Known merchant patterns for recognition - ordered by specificity
KNOWN_MERCHANTS = [
    # Multi-word names (highest priority - least likely false positive)
    (r'\bwhole\s*foods\b', 'Whole Foods'),
    (r'\btrader\s*joe\'?s?\b', "Trader Joe's"),
    (r'\bhome\s*depot\b', 'Home Depot'),
    (r'\bbest\s*buy\b', 'Best Buy'),
    (r'\bburger\s*king\b', 'Burger King'),
    (r'\btaco\s*bell\b', 'Taco Bell'),
    (r'\bpanera\s*bread\b', 'Panera Bread'),
    (r'\bchick[\-\s]?fil[\-\s]?a\b', 'Chick-fil-A'),
    (r'\bdollar\s*(tree|general)\b', 'Dollar Store'),
    
    # Unique brand names
    (r'\bcostco\b', 'Costco'),
    (r'\bwalmart\b', 'Walmart'),
    (r'\bmcdonald\'?s?\b', "McDonald's"),
    (r'\bchipotle\b', 'Chipotle'),
    (r'\bwalgreen\'?s?\b', 'Walgreens'),
    (r'\bnordstrom\b', 'Nordstrom'),
    (r'\bsafeway\b', 'Safeway'),
    (r'\bkroger\b', 'Kroger'),
    (r'\bpublix\b', 'Publix'),
    (r'\bdunkin\'?\b', "Dunkin'"),
    (r'\bikea\b', 'IKEA'),
    
    # Common names - check these ONLY in header to avoid product matches
    (r'\btarget\b', 'Target'),
    (r'\bstarbucks\b', 'Starbucks'),  # Often appears as products on other receipts
    (r'\bamazon\b', 'Amazon'),
    (r'\baldi\b', 'Aldi'),
    (r'\bsubway\b', 'Subway'),
    (r'\bcvs\b', 'CVS'),
    (r'\b7[\-\s]?eleven\b', '7-Eleven'),
]

# Merchants that commonly appear as PRODUCTS on other receipts
# These should only match in the header section
PRODUCT_CONFLICT_MERCHANTS = {'Starbucks', 'Target'}


def extract_merchant(text: str, lines: list[str]) -> tuple[Optional[str], float]:
    """
    Extract merchant name from OCR text.
    
    Strategy:
    1. Check for unique brand indicators ANYWHERE in text (Target Circle, Costco Wholesale, etc.)
    2. Check first 5 lines for known merchant patterns (highest confidence)
    3. For merchants that often appear as products, ONLY check header
    4. Check full text for other known patterns
    5. Use first substantial line as fallback
    
    Returns: (merchant_name, confidence_boost)
    """
    # Brand-specific indicators that ONLY appear on that store's receipts
    brand_indicators = [
        (r'\btarget\s*circle\b', 'Target'),  # Target Circle loyalty program
        (r'\bcostco\s*wholesale\b', 'Costco'),
        (r'\bwalmart\s*associate\b', 'Walmart'),
        (r'\bstarbucks\s*rewards\b', 'Starbucks'),
        (r'\bmcdonalds\s*app\b', "McDonald's"),
        (r'\bchick[\-\s]?fil[\-\s]?a\s*one\b', 'Chick-fil-A'),
        (r'\bkroger\s*plus\b', 'Kroger'),
        (r'\bpublix\s*pharmacy\b', 'Publix'),
        (r'\bcvs\s*extracare\b', 'CVS'),
        (r'\bwalgreens\s*balance\b', 'Walgreens'),
    ]
    
    # Check for brand indicators in FULL text (these are unambiguous)
    for pattern, name in brand_indicators:
        if re.search(pattern, text, re.IGNORECASE):
            return name, 0.40  # Very high confidence
    
    # First, check the TOP of the receipt (lines 0-5) for known merchants
    header_text = '\n'.join(lines[:5]) if len(lines) >= 5 else '\n'.join(lines)
    
    # Check for "WHOLESALE" which strongly indicates Costco
    if re.search(r'\bwholesale\b', header_text, re.IGNORECASE):
        return 'Costco', 0.35
    
    # Check header for all merchant patterns
    for pattern, name in KNOWN_MERCHANTS:
        if re.search(pattern, header_text, re.IGNORECASE):
            return name, 0.35  # High confidence - found in header
    
    # For non-conflicting merchants, also check full text
    for pattern, name in KNOWN_MERCHANTS:
        if name in PRODUCT_CONFLICT_MERCHANTS:
            continue  # Skip these - they might be products
        if re.search(pattern, text, re.IGNORECASE):
            return name, 0.20  # Medium confidence - found in body
    
    # Fallback: first line that looks like a store name
    for line in lines[:5]:
        line = line.strip()
        # Skip lines that are mostly numbers, dates, or too short
        if len(line) < 3:
            continue
        if re.match(r'^[\d\s\-\/\.\:\#]+$', line):
            continue
        if re.match(r'^(total|subtotal|tax|cash|card|change|date|time|member)', line, re.IGNORECASE):
            continue
        # Use this line as merchant
        return line[:40], 0.1
    
    return None, 0.0


def extract_total(text: str) -> tuple[Optional[float], float]:
    """
    Extract total amount from receipt text.
    
    Returns: (total_amount, confidence_boost)
    """
    patterns = [
        # Explicit TOTAL patterns (highest confidence)
        (r'\*{2,4}\s*TOTAL\s*[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b', 0.40),  # **TOTAL or ****TOTAL (Costco)
        (r'\bGRAND\s*TOTAL\s*[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b', 0.38),
        (r'\bTOTAL\s*[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b', 0.35),
        (r'\bAMOUNT\s*(?:DUE)?\s*[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b', 0.30),
        (r'\bBALANCE\s*[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b', 0.25),
        # Dollar amount at end of TOTAL line
        (r'TOTAL.*?([\d,]+\.\d{2})\s*$', 0.30),
        # VISA/payment amount (often the actual total paid)
        (r'\bVISA\s+([\d,]+\.\d{2})\b', 0.25),
        (r'\bAMOUNT:\s*\$?([\d,]+\.\d{2})\b', 0.25),
    ]
    
    for pattern, conf in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            try:
                value = float(match.group(1).replace(',', ''))
                if 1 <= value <= 10000:  # Reasonable range
                    return value, conf
            except ValueError:
                continue
    
    # Fallback: find largest dollar amount
    amounts = re.findall(r'(\d{1,4}\.\d{2})', text)
    if amounts:
        values = [float(a) for a in amounts if 5 <= float(a) <= 10000]
        if values:
            return max(values), 0.15
    
    return None, 0.0


def extract_subtotal(text: str) -> Optional[float]:
    """Extract subtotal amount from receipt text."""
    patterns = [
        r'\bSUBTOTAL\s*[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b',
        r'\bSUB\s*TOTAL\s*[:\s]*\$?\s*([\d,]+\.?\d{0,2})\b',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                value = float(match.group(1).replace(',', ''))
                if 1 <= value <= 10000:
                    return value
            except ValueError:
                continue
    
    return None


def extract_date(text: str) -> tuple[Optional[str], float]:
    """
    Extract date from receipt text.
    
    Returns: (date_string in YYYY-MM-DD format, confidence_boost)
    """
    patterns = [
        # MM/DD/YYYY or MM-DD-YYYY (most common US format)
        (r'(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\s+\d{1,2}:\d{2}', 'MDY_TIME'),  # With time = high conf
        (r'(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})', 'MDY'),
        (r'(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b', 'MDY_SHORT'),
        # YYYY-MM-DD (ISO format)
        (r'(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})', 'YMD'),
        # Month DD, YYYY
        (r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})', 'NAMED'),
    ]
    
    now = datetime.now()
    five_years_ago = now - timedelta(days=5*365)
    
    for pattern, fmt in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                if fmt == 'YMD':
                    year, month, day = match.groups()
                    parsed = datetime(int(year), int(month), int(day))
                elif fmt in ('MDY', 'MDY_TIME'):
                    month, day, year = match.groups()
                    parsed = datetime(int(year), int(month), int(day))
                elif fmt == 'MDY_SHORT':
                    month, day, year = match.groups()
                    year = '20' + year  # Assume 20xx for 2-digit years
                    parsed = datetime(int(year), int(month), int(day))
                elif fmt == 'NAMED':
                    month_str, day, year = match.groups()
                    parsed = datetime.strptime(f"{month_str} {day}, {year}", "%b %d, %Y")
                else:
                    continue
                
                # Validate date is reasonable (within 5 years past to 30 days future)
                if five_years_ago <= parsed <= now + timedelta(days=30):
                    conf = 0.18 if fmt == 'MDY_TIME' else 0.15
                    return parsed.strftime('%Y-%m-%d'), conf
            except (ValueError, TypeError):
                continue
    
    return None, 0.0


def extract_line_items(lines: list[str]) -> list[LineItem]:
    """Extract individual line items from receipt."""
    items = []
    
    # Pattern: item name followed by price (with optional tax indicator)
    item_pattern = r'^(.{3,35}?)\s+([\d,]+\.\d{2})\s*[A-Z]?$'
    
    for line in lines:
        line = line.strip()
        # Skip total/subtotal lines
        if re.search(r'(total|subtotal|tax|change|cash|card|payment|balance|visa|amount)', line, re.IGNORECASE):
            continue
        
        match = re.match(item_pattern, line)
        if match:
            name = match.group(1).strip()
            try:
                price = float(match.group(2).replace(',', ''))
                if 0 < price < 1000 and len(name) >= 2:
                    items.append(LineItem(name=name, price=price))
            except ValueError:
                continue
    
    return items


def parse_receipt_text(ocr_results: list, raw_text: str) -> OCRResult:
    """
    Parse OCR results into structured receipt data.
    
    Args:
        ocr_results: Raw PaddleOCR output
        raw_text: Concatenated text from OCR
    
    Returns:
        OCRResult with extracted fields
    """
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    confidence = 0.0
    
    # Extract fields
    merchant, merchant_conf = extract_merchant(raw_text, lines)
    confidence += merchant_conf
    
    total, total_conf = extract_total(raw_text)
    confidence += total_conf
    
    subtotal = extract_subtotal(raw_text)
    
    date, date_conf = extract_date(raw_text)
    confidence += date_conf
    
    items = extract_line_items(lines)
    confidence += min(len(items) * 0.02, 0.15)  # Cap item bonus
    
    # Cap total confidence at 1.0
    confidence = min(confidence, 1.0)
    
    return OCRResult(
        merchant=merchant,
        total=total,
        subtotal=subtotal,
        date=date,
        currency="USD",
        items=items,
        raw_text=raw_text,
        confidence=confidence,
    )


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "cents-ocr", "engine": "paddleocr"}


@app.get("/health")
async def health():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy"}


@app.post("/ocr", response_model=OCRResult)
async def process_receipt(file: UploadFile = File(...)):
    """
    Process a receipt image and extract structured data.
    
    Args:
        file: Image file (JPEG, PNG, etc.)
    
    Returns:
        OCRResult with extracted merchant, total, date, items
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read and convert image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary (handles PNG with alpha, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array for PaddleOCR
        img_array = np.array(image)
        
        # Run OCR - PaddleOCR 2.7.x uses ocr() method
        ocr = get_ocr_engine()
        result = ocr.ocr(img_array, cls=True)
        
        # Extract text from results
        # PaddleOCR 2.7.x returns: [[box, (text, confidence)], ...]
        text_lines = []
        if result and result[0]:
            for line in result[0]:
                if line and len(line) >= 2:
                    text_content = line[1][0] if isinstance(line[1], tuple) else line[1]
                    text_lines.append(text_content)
        
        raw_text = '\n'.join(text_lines)
        
        # Log for debugging
        print(f"PaddleOCR extracted {len(text_lines)} lines:")
        for i, line in enumerate(text_lines[:25]):  # Show first 25 lines
            print(f"  {i+1}: {line}")
        
        # Parse the text
        parsed = parse_receipt_text(result, raw_text)
        
        return parsed
        
    except Exception as e:
        print(f"OCR Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
