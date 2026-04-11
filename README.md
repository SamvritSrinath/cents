# Expensely (web)

Next.js dashboard for **Cents** expense tracking: expenses, categories, budgets, and exports against the same Supabase project as the mobile app.

## Related repos

- **Mobile:** [cents-app](../cents-app) (Expo) — pair with this repo via a multi-root workspace (see `cents-app/cents.code-workspace`).
- **OCR:** Hugging Face Space and `ocr-service/` in this tree (see mobile docs `docs/07-ocr-service.md` in cents-app).

## Setup

- Node.js 20.x
- Copy environment variables from your Supabase project (URL + anon key for client; follow project conventions for any server secrets).
- Install and run per the package manager defined in this repo (`npm install`, `npm run dev`, etc.).

## Categories

Default categories (`is_default = true`, shared `categories` rows) are loaded together with user-owned categories so expense labels resolve on Vercel the same way as on mobile.

## License

See repository license file when present.
