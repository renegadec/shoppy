# Digital Shop 🛒

A simple digital products shop accepting cryptocurrency payments via NOWPayments.

## Features

- 🛍️ Clean, responsive product catalog
- 💳 Crypto payments (USDT, BTC, ETH, and more)
- 📱 Telegram notifications for new orders
- 🚀 Easy deployment to Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required:
- `NOWPAYMENTS_API_KEY` - Get from [NOWPayments Dashboard](https://account.nowpayments.io/api-keys)
- `NEXT_PUBLIC_BASE_URL` - Your domain (e.g., `https://shop.yourdomain.com`)

Optional (for notifications):
- `TELEGRAM_BOT_TOKEN` - Create via [@BotFather](https://t.me/BotFather)
- `TELEGRAM_CHAT_ID` - Get via [@userinfobot](https://t.me/userinfobot)
- `NOWPAYMENTS_IPN_SECRET` - For webhook verification

### 3. Configure NOWPayments Webhook

In your [NOWPayments Dashboard](https://account.nowpayments.io):
1. Go to Settings → IPN (Instant Payment Notification)
2. Set IPN Callback URL to: `https://your-domain.com/api/webhook`
3. Generate and save your IPN Secret

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your shop.

## Deployment to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

### Connect Your Domain

In Vercel:
1. Go to Project Settings → Domains
2. Add your domain from Namecheap
3. Update Namecheap DNS to point to Vercel

## Customization

### Adding Products

Edit `data/products.json` to add or modify products.

### Styling

Tailwind CSS is used for styling. Modify `tailwind.config.js` or component classes as needed.

### Branding

Update the header/footer in `app/layout.jsx` with your shop name and branding.

## Order Flow

1. Customer browses products
2. Customer clicks "Buy Now" and enters contact info
3. Customer is redirected to NOWPayments to pay
4. NOWPayments sends webhook on payment confirmation
5. You receive Telegram notification with customer details
6. You manually deliver the product via customer's preferred contact method

## License

MIT
