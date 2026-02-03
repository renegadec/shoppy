# Shoppy - Digital Products Store

A digital products store accepting crypto payments via NOWPayments, with a full admin dashboard.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **Payments**: NOWPayments (crypto)

## Features

- 🛒 Product catalog with dynamic pricing
- 💳 Crypto payments (USDT, BTC, ETH, etc.)
- 📦 Order tracking with unique order IDs
- 👥 Customer management
- 📊 Admin dashboard with analytics
- 🔔 Telegram notifications for orders

## Setup

### 1. Clone and install

```bash
git clone https://github.com/renegadec/shoppy.git
cd shoppy
npm install
```

### 2. Set up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the URI (use "Transaction" mode for serverless)

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random 32+ char string (run `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `NOWPAYMENTS_API_KEY` - From NOWPayments dashboard
- `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` - For order notifications

### 4. Initialize database

```bash
# Push schema to database
npm run db:push

# Seed with admin user and sample products
npm run db:seed
```

### 5. Run development server

```bash
npm run dev
```

Visit:
- Store: http://localhost:3000
- Admin: http://localhost:3000/admin

Default admin login (change immediately!):
- Email: admin@shoppy.co.zw
- Password: changeme123

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Note: Run `npm run db:push` and `npm run db:seed` after first deploy to set up the database.

## Admin Dashboard

Access at `/admin` after logging in:

- **Dashboard** - Revenue stats, recent orders
- **Orders** - View/filter orders, mark as delivered
- **Products** - Add/edit/delete products
- **Customers** - View customer list and order history

## API Routes

- `POST /api/checkout` - Create payment
- `POST /api/webhook` - NOWPayments webhook
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product

Admin routes (authenticated):
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/orders` - Orders CRUD
- `/api/admin/products` - Products CRUD
- `/api/admin/customers` - Customers list

## License

MIT
