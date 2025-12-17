# Expense Tracker App - Technical Specification & Planning Document

## Project Overview
A free, privacy-first expense tracking and budgeting application with client-side receipt scanning, automated categorization, data visualizations, and cross-platform support (Web, iOS, Android, Desktop). Designed to scale while maintaining zero infrastructure costs and maximum data security with no external data exfiltration pathways.

## Core Requirements

### Functional Features
- **Receipt Scanning & OCR**: Capture receipts via camera/upload, extract merchant, date, amount, items
- **Manual Entry**: Quick expense input with category selection
- **Category Management**: Predefined + custom categories with subcategories
- **Budget Tracking**: Set budgets per category, track spending against limits
- **Data Visualization**: Dashboards with spending trends, category breakdowns, time-series analysis
- **Search & Filter**: Advanced filtering by date range, category, merchant, amount
- **Export Data**: CSV/PDF reports for expense records
- **Multi-currency Support**: Handle multiple currencies with conversion rates

### Cross-Platform Requirements
- **Web Dashboard**: Responsive design (desktop, tablet, mobile browsers)
- **iOS App**: Native feel using cross-platform framework
- **Android App**: Native feel using cross-platform framework
- **Desktop App**: Optional Electron/Tauri wrapper for offline support

---

## Technical Architecture Decisions

### Infrastructure & Hosting (100% Free Tier Strategy)

#### Recommended Stack: Supabase + Vercel + Cloudflare
This combination provides the most generous free tiers with no credit card required initially.

##### **Database & Backend: Supabase (Free Forever Tier)**
- **Database**: 500MB PostgreSQL storage
- **Storage**: 1GB for receipt images
- **Bandwidth**: 5GB/month
- **API Requests**: Unlimited (with rate limits)
- **Auth**: Unlimited users
- **Realtime**: 200 concurrent connections
- **Edge Functions**: 500K invocations/month
- **Cost**: $0/month permanently
- **Upgrade Path**: $25/month for 8GB DB when needed

##### **Frontend Hosting: Vercel (Hobby Tier - Free Forever)**
- **Bandwidth**: 100GB/month
- **Build Minutes**: 6,000 minutes/month
- **Serverless Functions**: 100GB-hours
- **Edge Functions**: 500K invocations/month
- **Domains**: Unlimited custom domains
- **Deployments**: Unlimited
- **Preview Deployments**: Unlimited
- **DDoS Protection**: Included
- **SSL**: Automatic, free
- **Cost**: $0/month permanently
- **Upgrade Path**: $20/month per user for team features

##### **CDN & Static Assets: Cloudflare (Free Tier)**
- **CDN Bandwidth**: Unlimited (!)
- **DNS**: Unlimited queries
- **DDoS Protection**: Unmetered
- **SSL/TLS**: Free certificates
- **Cache**: Global edge network (300+ cities)
- **Page Rules**: 3 free rules
- **Workers**: 100K requests/day (for edge computing)
- **R2 Storage**: 10GB (alternative to Supabase Storage)
- **Images**: 100K transformations/month
- **Cost**: $0/month permanently
- **Why**: Offload static assets, reduce Vercel bandwidth usage

##### **Alternative: Cloudflare Pages (Instead of Vercel)**
- **Bandwidth**: Unlimited (!)
- **Build Minutes**: 500 builds/month
- **Concurrent Builds**: 1
- **Functions**: 100K requests/day
- **Cost**: $0/month permanently
- **Trade-off**: Less build minutes than Vercel, but unlimited bandwidth
- **Recommendation**: Use Vercel for development, consider Cloudflare Pages if bandwidth becomes an issue

#### Complete Free Hosting Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUESTS                             │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare CDN (Free - Unlimited Bandwidth)                │
│  • Cache static assets (JS, CSS, images, fonts)             │
│  • DDoS protection                                           │
│  • SSL termination                                           │
│  • Edge caching (300+ global locations)                     │
└─────────────────────────────────────────────────────────────┘
                             ↓
                    ┌────────┴────────┐
                    │                 │
         ┌──────────▼────────┐   ┌───▼──────────────┐
         │  Vercel (Free)    │   │ Cloudflare R2    │
         │  • Next.js App    │   │ (Free - 10GB)    │
         │  • API Routes     │   │ • Receipt Images │
         │  • Edge Functions │   │ • Exports/PDFs   │
         │  100GB bandwidth  │   │ • Backups        │
         └──────────┬────────┘   └──────────────────┘
                    │
         ┌──────────▼────────┐
         │ Supabase (Free)   │
         │ • PostgreSQL 500MB│
         │ • Auth (unlimited)│
         │ • Realtime        │
         │ • Edge Functions  │
         │ • Storage (1GB)   │
         └───────────────────┘
```

#### Free Services Breakdown by Function

##### **1. Static Asset Hosting (Images, Fonts, Icons)**
**Primary: Cloudflare R2 + CDN (Free)**
- 10GB storage
- Unlimited egress (no bandwidth charges!)
- Custom domain support
- Automatic image optimization with Cloudflare Images (100K/month free)

**Alternative: jsDelivr (Free, Open Source CDN)**
- Unlimited bandwidth for open source projects
- GitHub integration (serve from repo)
- Use for: App icons, static images, fonts
- URL format: `https://cdn.jsdelivr.net/gh/username/repo@version/file.png`

**Configuration**:
```javascript
// next.config.js - Optimize image loading
module.exports = {
  images: {
    domains: ['r2.your-domain.com', 'cdn.jsdelivr.net'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 year
  },
}
```

##### **2. Database Hosting**
**Supabase (Free - 500MB)**
- Optimize with these strategies to stay under 500MB:
  - Store receipt images in R2, not Supabase Storage
  - Use integer IDs instead of UUIDs where possible (saves 8 bytes per row)
  - Compress JSON columns with PostgreSQL compression
  - Archive old data (>2 years) to cold storage
  - Use materialized views instead of storing aggregated data

**Expected Storage at 1K Users**:
```
Users:        1,000 × 500 bytes  = 0.5 MB
Categories:   50 × 200 bytes     = 0.01 MB
Expenses:     50K × 300 bytes    = 15 MB
Budgets:      5K × 200 bytes     = 1 MB
Sessions:     2K × 400 bytes     = 0.8 MB
Indexes:                         = ~20 MB
Total:                          ≈ 37 MB (7.4% of limit)
```

**Scaling to 10K Users**: ~370MB (74% of limit) - Still well within free tier

##### **3. File Storage (Receipts, Exports)**
**Cloudflare R2 (Free - 10GB, Zero Egress Fees)**
```javascript
// Upload receipt to R2 from client
async function uploadReceipt(file: File, userId: string) {
  // Compress image first (client-side)
  const compressed = await compressImage(file, {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.7,
    format: 'webp'
  });
  
  // Generate presigned URL from Supabase Edge Function
  const { data: uploadUrl } = await supabase.functions.invoke('get-upload-url', {
    body: { userId, filename: file.name }
  });
  
  // Upload directly to R2 (bypasses Supabase bandwidth limits)
  await fetch(uploadUrl, {
    method: 'PUT',
    body: compressed,
    headers: { 'Content-Type': 'image/webp' }
  });
}
```

**Why R2 over Supabase Storage**:
- 10GB vs 1GB free storage
- Zero egress fees (Supabase charges for downloads)
- Better for high-traffic assets
- S3-compatible API (easy migration path)

**Alternative: Backblaze B2 (Free - 10GB storage, 1GB/day egress)**

##### **4. Email Service (Transactional)**
**Resend (Free - 3K emails/month) - RECOMMENDED**
- Modern API, great DX
- 100 emails/day on free tier
- Custom domains supported
- No credit card required

**Alternative: SendGrid (Free - 100 emails/day)**

**Alternative: Supabase + SMTP (Completely Free)**
- Use Supabase Edge Functions + Gmail SMTP relay
- Limited to 100 emails/day per Gmail account
- Good for low-volume notifications

##### **5. Analytics & Monitoring**
**Plausible Community Edition (Self-hosted on Vercel - Free)**
- Deploy on Vercel as Docker container
- Uses PostgreSQL (can share Supabase instance)
- Privacy-focused, GDPR compliant
- No cookies, no tracking across sites

**Alternative: Umami (Free, Self-hosted)**
- Lighter than Plausible
- Deploy on Vercel with Supabase PostgreSQL
- Open source, privacy-focused

**Alternative: PostHog (Free - 1M events/month)**
- More features than Plausible
- Self-hosted or cloud
- Session replay, feature flags

**For Uptime Monitoring: BetterStack (Free)**
- 10 monitors
- 3-minute check intervals
- Status page
- Incident management

##### **6. Error Tracking**
**Sentry (Free - 5K errors/month)**
- Source maps support
- Release tracking
- Performance monitoring (limited)

**Alternative: GlitchTip (Free, Self-hosted)**
- Sentry-compatible API
- Deploy on Vercel + Supabase
- Unlimited events

##### **7. Cron Jobs & Background Tasks**
**GitHub Actions (Free - 2,000 minutes/month)**
```yaml
# .github/workflows/nightly.yml
name: Nightly Jobs
on:
  schedule:
    - cron: '0 2 * * *' # 2 AM UTC daily
jobs:
  refresh-materialized-views:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://your-api.vercel.app/cron/refresh-views \
          -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Alternative: Vercel Cron (Free with Hobby plan)**
```javascript
// app/api/cron/refresh-views/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Refresh materialized views
  await supabase.rpc('refresh_all_views');
  return Response.json({ success: true });
}
```

```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/refresh-views",
    "schedule": "0 2 * * *" // 2 AM daily
  }]
}
```

##### **8. Search Functionality**
**PostgreSQL Full-Text Search (Free - Built-in)**
```sql
-- Add search index
CREATE INDEX idx_expenses_search ON expenses 
USING gin(to_tsvector('english', merchant || ' ' || description));

-- Search query
SELECT * FROM expenses 
WHERE to_tsvector('english', merchant || ' ' || description) 
@@ to_tsquery('english', 'grocery');
```

**Alternative: Meilisearch (Self-hosted on Railway - Free)**
- Railway Free Tier: 500 hours/month
- Better search UX than PostgreSQL FTS
- Typo tolerance, filtering, faceting

##### **9. CI/CD Pipeline**
**GitHub Actions (Free - 2,000 minutes/month)**
- More than enough for typical projects
- Linux runners only on free tier
- Use caching to reduce build times

**Build Time Optimization**:
```yaml
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}
```

##### **10. DNS Hosting**
**Cloudflare (Free - Unlimited queries)**
- Fastest DNS globally
- DDoS protection
- DNSSEC support
- API for programmatic updates

**Alternative: Vercel DNS (Free with domains)**

##### **11. Certificate Management**
**Let's Encrypt via Vercel/Cloudflare (Free)**
- Automatic certificate issuance
- Auto-renewal every 90 days
- Wildcard certificates supported

##### **12. Object Storage for Backups**
**Cloudflare R2 (Already allocated in file storage)**

**Alternative: Supabase Storage (1GB free)**
- Use for database backups only
- Compress with gzip
- Rotate weekly backups (keep 4 weeks max)

```javascript
// Automated backup script (runs via GitHub Actions)
async function backupDatabase() {
  const { data } = await supabase.rpc('pg_dump_custom_format');
  const compressed = gzip(data);
  
  // Upload to R2
  await uploadToR2(`backups/db-${Date.now()}.gz`, compressed);
  
  // Delete backups older than 30 days
  await cleanupOldBackups(30);
}
```

##### **13. Rate Limiting**
**Upstash Redis (Free - 10K commands/day)**
- Serverless Redis
- Perfect for rate limiting
- Global edge deployment

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for");
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }
  // ... handle request
}
```

**Alternative: Vercel Edge Config (Free - 512 KB)**
- Store rate limit state at the edge
- Ultra-low latency
- 50M reads/month free

##### **14. Secret Management**
**Vercel Environment Variables (Free)**
- Encrypted at rest
- Available in all deployments
- Support for preview/production separation

**GitHub Secrets (Free)**
- For CI/CD workflows
- Encrypted, never exposed in logs

##### **15. Container Registry (Future: Desktop App)**
**GitHub Container Registry (Free - 500MB storage, unlimited pulls)**
- If you build Docker images for desktop app
- Integrated with GitHub Actions

---

#### Complete Cost Breakdown at Scale

| Service | Free Tier Limit | 1K Users | 10K Users | 100K Users |
|---------|----------------|----------|-----------|------------|
| **Supabase DB** | 500MB | 37MB (7%) | 370MB (74%) | 3.7GB* |
| **Cloudflare R2** | 10GB | 2GB (20%) | 20GB* | 200GB* |
| **Vercel Bandwidth** | 100GB | 15GB (15%) | 150GB* | 1.5TB* |
| **Cloudflare CDN** | Unlimited | ∞ | ∞ | ∞ |
| **Upstash Redis** | 10K cmds/day | 3K (30%) | 30K* | 300K* |
| **Resend Email** | 3K/month | 500 (17%) | 5K* | 50K* |
| **Total Cost** | $0 | **$0** | **$0** | **~$50/mo** |

*Requires paid tier

**Breakpoint Analysis**:
- **0-5K users**: Completely free
- **5K-20K users**: $25-50/month (upgrade Supabase + R2)
- **20K+ users**: Consider revenue model or sponsorship

---

#### Free Tier Optimization Strategies

##### **1. Aggressive Caching**
```javascript
// Cloudflare Worker for intelligent caching
export default {
  async fetch(request) {
    const cache = caches.default;
    
    // Cache static assets for 1 year
    if (request.url.includes('/static/')) {
      const cacheKey = new Request(request.url);
      let response = await cache.match(cacheKey);
      
      if (!response) {
        response = await fetch(request);
        response = new Response(response.body, response);
        response.headers.set('Cache-Control', 'max-age=31536000');
        await cache.put(cacheKey, response.clone());
      }
      return response;
    }
    
    return fetch(request);
  }
}
```

##### **2. Image Optimization Pipeline**
```typescript
// Compress on upload (client-side)
async function optimizeImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1600;
      
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/webp', 0.7);
    };
  });
}
```

##### **3. Database Connection Pooling**
```typescript
// Reuse Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: true },
  global: {
    headers: { 'x-application-name': 'expense-tracker' }
  }
});
```

##### **4. Lazy Loading & Code Splitting**
```typescript
// Next.js dynamic imports
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Don't render on server
});

const ReceiptScanner = dynamic(() => import('@/components/ReceiptScanner'), {
  loading: () => <ScannerSkeleton />
});
```

##### **5. Edge Functions for Performance**
```typescript
// Supabase Edge Function for geolocation-based currency
// Runs at Cloudflare edge, zero latency
Deno.serve(async (req) => {
  const country = req.headers.get('cf-ipcountry');
  const currency = COUNTRY_CURRENCY_MAP[country] || 'USD';
  
  return new Response(JSON.stringify({ currency }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

---

## API Design & Backend Architecture

### API Style Decision: GraphQL vs REST

#### GraphQL (Recommended)
- **Use Case Fit**: Perfect for dashboards requiring multiple data aggregations
- **Benefits**: 
  - Single endpoint reduces API calls
  - Client-driven data fetching (mobile bandwidth efficiency)
  - Strongly typed schema with auto-generated documentation
  - Real-time subscriptions (Supabase supports GraphQL via pg_graphql)
- **Considerations**: 
  - Query complexity limits needed to prevent abuse
  - Caching strategy more complex (use persisted queries)
  - N+1 query problem (use DataLoader pattern)

#### REST Alternative
- **Use Case**: Simpler caching, better for CRUD operations
- **Implementation**: RESTful endpoints with OpenAPI/Swagger docs
- **Caching**: Easier with standard HTTP cache headers

**Decision**: Use GraphQL for primary API with REST fallback for webhooks/OCR processing

---

### API Design Principles

#### Performance Optimization
1. **Caching Strategy**
   - Redis/Upstash for API response caching (free tier: 10K commands/day)
   - Client-side caching with React Query/SWR (stale-while-revalidate)
   - CDN caching for static assets (Vercel Edge Network)
   - Database query result caching (materialized views for aggregations)

2. **Database Optimization**
   - Proper indexing on frequently queried columns (user_id, date, category_id)
   - Partial indexes for filtered queries
   - Database connection pooling (Supabase Supavisor)
   - Pagination with cursor-based navigation (avoid offset pagination)
   - Aggregate tables for dashboard queries (denormalization strategy)

3. **Query Performance**
   - Use database functions for complex aggregations
   - Batch requests to reduce round trips
   - Lazy loading for non-critical data
   - Implement query result streaming for large datasets

#### Idempotency & Reliability
- **Idempotency Keys**: UUID-based keys for mutations (expense creation, updates)
- **Retry Logic**: Exponential backoff for failed requests
- **Optimistic Updates**: UI updates before server confirmation
- **Conflict Resolution**: Last-write-wins with timestamp tracking or CRDT approach

### Security & Privacy-First Architecture

#### Zero Exfiltration Design Principles
- **No Third-Party Analytics**: Self-hosted analytics only (PostHog self-hosted or Plausible)
- **No External API Calls**: All OCR processing client-side, no data sent to external services
- **No CDN for User Data**: Static assets only on CDN, user data stays in Supabase
- **Client-Side Encryption**: End-to-end encryption option for sensitive data
- **Local-First Approach**: IndexedDB/SQLite for offline-first experience
- **Minimal Dependencies**: Audit all npm packages for data exfiltration risks

#### CI/CD Security Checks
```yaml
# .github/workflows/security.yml
name: Security Audit

on: [push, pull_request]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      # Dependency vulnerability scanning
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=high
      
      # Check for known malicious packages
      - run: npx audit-ci --high
      
      # Scan for secrets in code
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          
      # Check for suspicious network calls
      - name: Network Call Detection
        run: |
          grep -r "fetch\|axios\|XMLHttpRequest" src/ \
          | grep -v "localhost\|supabase.co\|vercel.app" \
          || echo "No suspicious external calls found"
          
      # License compliance
      - run: npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC"
      
      # SAST scanning
      - uses: github/codeql-action/init@v2
      - uses: github/codeql-action/analyze@v2
```

#### Runtime Security Measures
- **Content Security Policy (CSP)**: Strict CSP headers blocking external resources
- **Subresource Integrity (SRI)**: Hash verification for CDN assets
- **Network Monitoring**: Log all API calls, alert on unexpected domains
- **Permission Auditing**: Minimal camera/storage permissions, explicit user consent
- **Certificate Pinning**: For mobile apps, prevent MITM attacks
- **Stateful Auth Options**:
  1. Supabase Auth (JWT with refresh tokens, built-in)
  2. NextAuth.js (session-based, supports multiple providers)
  3. Clerk (developer-friendly, generous free tier)

- **Security Measures**:
  - Row Level Security (RLS) policies in Supabase
  - HTTPS-only communication
  - Rate limiting (Vercel Pro: built-in, or Upstash Ratelimit)
  - Input validation and sanitization
  - CORS configuration for web/mobile apps
  - Secure file upload validation (receipt images)

#### Supabase RLS Policies
```sql
-- Example: Users can only access their own expenses
CREATE POLICY "Users can view own expenses"
ON expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
ON expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Shared household expenses (future feature)
CREATE POLICY "Household members can view shared expenses"
ON expenses FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = expenses.household_id
    AND user_id = auth.uid()
  )
);
```

---

## Tech Stack Recommendations

### Frontend
- **Framework**: Next.js 14+ (App Router)
  - Server Components for performance
  - Built-in API routes
  - Excellent Vercel integration
  
- **Mobile**: React Native with Expo
  - Single codebase for iOS/Android
  - EAS Build for native compilation
  - Expo Router for navigation
  - Alternative: Flutter (better performance, steeper learning curve)

- **Desktop**: Tauri (lighter than Electron)
  - Rust backend for native performance
  - Smaller bundle size
  - Alternative: Electron if team prefers Node.js

- **State Management**: Zustand or Jotai (lightweight)
  - Avoid Redux complexity unless needed
  - React Query for server state

- **UI Library**: 
  - shadcn/ui + Tailwind CSS (web)
  - Native Base or React Native Paper (mobile)
  - Ensure consistent design system across platforms

- **Data Visualization**: Recharts or Nivo (responsive, performant)
  - Avoid heavy libraries like D3 unless needed
  - Consider Victory Native for React Native

## OCR Implementation: Client-Side Only

### Platform-Specific OCR Solutions

#### iOS (Native Performance)
```swift
// Using Apple Vision Framework (iOS 13+)
import Vision
import UIKit

func recognizeText(from image: UIImage, completion: @escaping (String?) -> Void) {
    guard let cgImage = image.cgImage else { return }
    
    let request = VNRecognizeTextRequest { request, error in
        guard let observations = request.results as? [VNRecognizedTextObservation] else {
            completion(nil)
            return
        }
        
        let recognizedText = observations.compactMap { observation in
            observation.topCandidates(1).first?.string
        }.joined(separator: "\n")
        
        completion(recognizedText)
    }
    
    // Configure for maximum accuracy
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["en-US"]
    
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try? handler.perform([request])
}
```

**Capabilities**:
- ✅ Offline, on-device processing
- ✅ Highly accurate (90%+ for printed text)
- ✅ Fast (< 1s per receipt)
- ✅ Zero cost
- ✅ Privacy-preserving (no network calls)
- ✅ Supports multiple languages

#### Android (ML Kit)
```kotlin
// Using Google ML Kit Text Recognition v2
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

fun recognizeText(bitmap: Bitmap, callback: (String?) -> Unit) {
    val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    val image = InputImage.fromBitmap(bitmap, 0)
    
    recognizer.process(image)
        .addOnSuccessListener { visionText ->
            val recognizedText = visionText.text
            callback(recognizedText)
        }
        .addOnFailureListener { e ->
            callback(null)
        }
}
```

**Capabilities**:
- ✅ On-device processing (no Google API calls)
- ✅ Free and offline
- ✅ Automatic text block detection
- ✅ High accuracy for receipts
- ✅ Latin and Devanagari script support

#### Web (Tesseract.js + Web ML)
```typescript
// Using Tesseract.js for browser-based OCR
import Tesseract from 'tesseract.js';

async function recognizeText(imageFile: File): Promise<string> {
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: m => console.log(m) // Progress tracking
  });
  
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();
  
  return text;
}

// Alternative: Use Web ML API (experimental, better performance)
async function recognizeTextWebML(imageBlob: Blob): Promise<string> {
  if ('ml' in navigator) {
    // Use browser's native ML capabilities when available
    // Falls back to Tesseract.js
  }
  return recognizeText(imageBlob as File);
}
```

**Capabilities**:
- ✅ Works in all modern browsers
- ✅ Completely client-side
- ✅ ~2-5s processing time (acceptable for web)
- ✅ Progressive Web App support
- ⚠️ Lower accuracy than native (80-85%)
- ⚠️ Larger bundle size (~2MB for language data)

**Optimization**: Load Tesseract worker lazily, use WebAssembly, cache language data

#### React Native Bridge (Unified API)
```typescript
// Unified OCR interface for React Native
import { NativeModules, Platform } from 'react-native';

interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
}

export async function scanReceipt(imagePath: string): Promise<OCRResult> {
  if (Platform.OS === 'ios') {
    return await NativeModules.VisionOCR.recognizeText(imagePath);
  } else if (Platform.OS === 'android') {
    return await NativeModules.MLKitOCR.recognizeText(imagePath);
  } else {
    // Web fallback
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const text = await recognizeText(blob as File);
    return { text, confidence: 0.8, blocks: [] };
  }
}
```

### Receipt Data Extraction Pipeline

After OCR, extract structured data using regex + heuristics (client-side):

```typescript
interface ReceiptData {
  merchant: string | null;
  total: number | null;
  date: Date | null;
  items: Array<{ name: string; price: number }>;
  currency: string;
}

function parseReceipt(ocrText: string): ReceiptData {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract total (look for patterns like $XX.XX or Total: XX.XX)
  const totalRegex = /(?:total|amount|sum)[:\s]*\$?(\d+\.\d{2})/i;
  const totalMatch = ocrText.match(totalRegex);
  const total = totalMatch ? parseFloat(totalMatch[1]) : null;
  
  // Extract date (MM/DD/YYYY, DD-MM-YYYY, etc.)
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const dateMatch = ocrText.match(dateRegex);
  const date = dateMatch ? new Date(dateMatch[1]) : null;
  
  // Extract merchant (usually first line or largest text)
  const merchant = lines[0] || null;
  
  // Extract line items (heuristic: line with $ and price)
  const items = lines
    .map(line => {
      const match = line.match(/(.+?)\s+\$?(\d+\.\d{2})/);
      if (match) {
        return { name: match[1].trim(), price: parseFloat(match[2]) };
      }
      return null;
    })
    .filter(Boolean) as Array<{ name: string; price: number }>;
  
  return { merchant, total, date, items, currency: 'USD' };
}
```

### Handling OCR Errors & User Corrections

```typescript
// Allow users to correct OCR mistakes
interface OCRReview {
  originalText: string;
  correctedData: Partial<ReceiptData>;
  userConfirmed: boolean;
}

// Store corrections to improve future parsing (optional ML model training)
function learnFromCorrection(review: OCRReview) {
  // Option 1: Store locally for pattern matching
  // Option 2: Federated learning (future enhancement)
  // Option 3: Rule-based improvements
}
```

### Performance Benchmarks (Client-Side OCR)

| Platform | Processing Time | Accuracy | Bundle Size Impact |
|----------|----------------|----------|-------------------|
| iOS (Vision) | 0.5-1.5s | 90-95% | Native (0 KB) |
| Android (ML Kit) | 0.8-2s | 88-93% | ~10 MB (bundled) |
| Web (Tesseract.js) | 2-5s | 80-85% | ~2 MB (lazy loaded) |

**User Experience**:
- Show real-time camera preview with text detection overlay
- Provide visual feedback (bounding boxes around detected text)
- Allow manual cropping before OCR
- Support manual entry if OCR fails

---
- **API Layer**: GraphQL Yoga or Apollo Server
- **OCR Processing** (Client-Side Only):
  - iOS: VNRecognizeTextRequest (Apple Vision Framework)
  - Android: ML Kit Text Recognition (Google)
  - Web: Tesseract.js or Web ML APIs
  - Zero backend cost, privacy-first, offline capable
  
- **File Storage**: 
  - Supabase Storage (1GB free)
  - Cloudflare R2 (10GB free, no egress fees)
  
- **Background Jobs**: 
  - Vercel Cron Jobs (for nightly aggregations)
  - Quirrel.dev or Inngest (for complex workflows)
  - pg_cron extension in Supabase for DB-level jobs

### Database Schema Design
```sql
-- Core tables with optimization considerations
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category_id UUID REFERENCES categories(id),
  merchant TEXT,
  description TEXT,
  receipt_url TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_user_created ON expenses(user_id, created_at DESC);

-- Materialized view for dashboard aggregations (refresh nightly)
CREATE MATERIALIZED VIEW user_spending_summary AS
SELECT 
  user_id,
  category_id,
  DATE_TRUNC('month', expense_date) as month,
  SUM(amount) as total_spent,
  COUNT(*) as expense_count
FROM expenses
GROUP BY user_id, category_id, DATE_TRUNC('month', expense_date);

CREATE INDEX idx_spending_summary ON user_spending_summary(user_id, month);
```

---

## Testing Strategy

### Testing Pyramid
1. **Unit Tests** (70%): Jest + React Testing Library
   - Component logic, utility functions
   - Database functions and stored procedures
   
2. **Integration Tests** (20%): Vitest or Jest with MSW
   - API endpoints with mocked database
   - Authentication flows
   
3. **E2E Tests** (10%): Playwright or Cypress
   - Critical user journeys (signup, add expense, view dashboard)
   - Mobile: Detox or Maestro

### Test Coverage Goals
- Minimum 80% coverage for business logic
- 100% coverage for financial calculations (critical)
- Visual regression testing with Chromatic (optional)

### Testing Environments
- **Local**: Docker Compose with Postgres + Redis
- **CI**: GitHub Actions with database service containers
- **Staging**: Supabase preview branch + Vercel preview deployment

---

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run test:e2e
      
  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}
      
  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: npm run db:migrate # Run database migrations
```

### Release Management
- **Versioning**: Semantic versioning (semver)
- **Changelog**: Automated with conventional commits + changelog generator
- **Mobile Releases**: 
  - EAS Submit for automatic App Store/Play Store submissions
  - Beta testing via TestFlight and Google Play Internal Testing
- **Database Migrations**: 
  - Use Supabase CLI or Prisma Migrate
  - Rollback strategy for failed migrations
  - Blue-green deployment for zero-downtime

### Automated Tasks
1. **Nightly Jobs** (Vercel Cron):
   - Refresh materialized views (dashboard aggregations)
   - Clean up old receipts (archival strategy)
   - Currency exchange rate updates
   - Generate monthly spending reports

2. **Weekly Jobs**:
   - Database vacuum and analyze (Supabase maintenance)
   - Backup verification
   - Security dependency updates (Dependabot)

---

## Performance Targets

### Web Application
- **First Contentful Paint (FCP)**: < 1.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Lighthouse Score**: > 90 (all categories)

### Mobile Application
- **App Launch Time**: < 2s (cold start)
- **Screen Transitions**: < 100ms
- **API Response Time**: < 500ms (p95)
- **Bundle Size**: < 50MB (iOS), < 30MB (Android)

### API Performance
- **Response Time**: < 200ms (p95) for simple queries
- **Throughput**: 100+ requests/second
- **Database Query Time**: < 50ms (p95)
- **OCR Processing**: < 5s for standard receipt

---

## UI/UX Requirements

### Design Principles
- **Mobile-First**: Design for smallest screen, enhance for larger
- **Accessibility**: WCAG 2.1 AA compliance
- **Dark Mode**: Support system theme preference
- **Offline Support**: Progressive Web App with service worker
- **Loading States**: Skeleton screens, optimistic updates
- **Error Handling**: Friendly error messages with recovery actions

### Cross-Platform Consistency
- Shared design tokens (colors, spacing, typography)
- Platform-specific UI patterns where appropriate
  - iOS: Bottom navigation, swipe gestures
  - Android: Material Design principles, FAB
  - Web: Responsive layout with sidebar navigation

### Professional Aesthetics
- Modern, clean interface with ample whitespace
- Consistent color palette (consider Tailwind default + brand colors)
- Smooth animations and transitions (60fps)
- Data visualization with accessible color schemes
- Responsive typography scales

---

## Additional Considerations

### Data Privacy & Compliance
- GDPR compliance (data export, deletion)
- Encrypted storage for sensitive data
- Privacy policy and terms of service
- User consent for OCR/ML processing

### Scalability Path
- Database partitioning strategy (by user, by date)
- Read replicas for dashboard queries (Supabase Pro)
- CDN for global performance (Vercel Edge)
- Microservices extraction for OCR processing

### Monitoring & Observability
- Error tracking: Sentry (free tier: 5K events/month)
- Analytics: Plausible or PostHog (privacy-friendly)
- Performance monitoring: Vercel Analytics
- Logging: Structured logging with log levels
- Uptime monitoring: BetterStack or UptimeRobot

### Feature Flags & Rollouts
- LaunchDarkly or GrowthBook for feature toggles
- Gradual rollouts for risky features
- A/B testing for UI/UX improvements

---

## Implementation Phases

### Phase 1: MVP (2-3 months)
- User authentication (email + password)
- Manual expense entry with categories
- Basic dashboard with spending overview
- Web application only
- Simple budget tracking

### Phase 2: Core Features (1-2 months)
- Receipt scanning and OCR
- Advanced filtering and search
- Data export (CSV/PDF)
- Mobile app (iOS + Android)
- Enhanced visualizations

### Phase 3: Advanced Features (1-2 months)
- Recurring expenses
- Budget alerts and notifications
- Multi-currency support
- Household/shared expenses
- Desktop application

### Phase 4: Optimization & Polish (Ongoing)
- Performance optimization
- Advanced analytics and insights
- Machine learning for categorization
- Bank integration (Plaid API)
- Premium features for monetization

---

## Cost Projections (Free Tier Limits)

| Service | Free Tier | Estimated Usage (1K users) | Overage? |
|---------|-----------|----------------------------|----------|
| Supabase DB | 500MB | ~400MB (with optimization) | No |
| Supabase Storage | 1GB | ~800MB (compressed receipts) | No |
| Vercel Bandwidth | 100GB | ~40GB | No |
| Vercel Functions | 100 hours | ~60 hours | No |
| **OCR Processing** | N/A | **$0 (client-side)** | **No** |

**Cost Savings**: By eliminating server-side OCR, the app saves approximately **$150-300/month** at 1K users (assuming 2-3 receipts per user per month at $1.50 per 1K images).

---

## Questions for Refinement

1. **User Base**: Expected initial users? Growth projections?
2. **OCR Language Support**: English-only initially, or multi-language from start?
3. **Monetization**: Remain free forever? Optional premium features for advanced users?
4. **Integration Priorities**: Future bank APIs (Plaid)? Export to accounting software?
5. **Collaboration Features**: Shared household budgets? Multi-user accounts?
6. **Localization**: Support for multiple languages? Regional date/currency formats?
7. **Backup Strategy**: User-initiated backups? Encrypted cloud backup option?
8. **Open Source**: Plan to open-source for community auditing and contributions?

---

## Next Steps

Use this document as a foundation for:
1. Creating detailed technical design documents
2. Setting up project repositories and infrastructure
3. Defining API contracts (GraphQL schema or OpenAPI spec)
4. Designing database schema and RLS policies
5. Creating wireframes and UI mockups
6. Establishing testing and CI/CD pipelines
7. Planning sprint milestones and deliverables