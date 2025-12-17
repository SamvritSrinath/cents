# Cents

A privacy-first expense tracking and budgeting web application with a premium dark-mode UI inspired by Copilot Money and Robinhood.

![Cents](https://img.shields.io/badge/Status-MVP-green) ![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- 🔒 **Privacy-First**: Your financial data stays yours. No third-party tracking.
- 💰 **Expense Tracking**: Log expenses with categories, merchants, and notes
- 📊 **Visual Insights**: Beautiful charts and graphs to understand your spending
- 📈 **Budget Tracking**: Set budgets and monitor progress with visual indicators
- 🌙 **Dark Mode**: Premium dark-mode-first design with emerald accent
- 🚀 **Fast**: Built with Next.js 14 and Server Components

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: Supabase Auth (email/password)
- **Charts**: Recharts
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cents.git
   cd cents
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

The database schema is managed through Supabase migrations. If you need to set up a new project:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. The migrations create:
   - `profiles` - User profiles extending auth.users
   - `categories` - Expense categories (default + custom)
   - `expenses` - Expense entries
   - `budgets` - Monthly budgets per category
3. Row Level Security (RLS) ensures users can only access their own data

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, signup)
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── layout.tsx        # Root layout with dark mode
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   └── expenses/         # Expense management components
├── lib/
│   ├── supabase/        # Supabase client configuration
│   └── utils.ts         # Utility functions
├── types/
│   └── database.ts      # TypeScript types for Supabase
└── middleware.ts         # Auth middleware for route protection
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Design inspiration from [Copilot Money](https://copilot.money) and [Robinhood](https://robinhood.com)
- Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [Tailwind CSS](https://tailwindcss.com)
