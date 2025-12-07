# 🚀 Stripe Payment Integration - Quick Start

## ✅ What's Already Done

The Stripe payment integration is **fully implemented and ready to use**. You just need to add your API keys!

## 📋 3-Step Setup

### Step 1: Get Your Stripe Keys

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register) (or login if you have an account)
2. Navigate to **Developers > API Keys**
3. Copy your keys:
   - **Secret key**: `sk_test_...` (or `sk_live_...` for production)
   - **Publishable key**: `pk_test_...` (optional for now)

### Step 2: Add to .env File

Create or edit `.env` in your project root:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51S8Jk99WGaMBPmpWL...
STRIPE_PUBLISHABLE_KEY=pk_test_51S8Jk99WGaMBPmpWL...
APP_URL=http://localhost:5000
```

**Important:**
- Use `sk_test_...` for development/testing
- Use `sk_live_...` for production
- Never commit `.env` to git (it's already in `.gitignore`)

### Step 3: Restart Server

```bash
# Stop your server (Ctrl+C)
# Then restart
pnpm run dev
```

## 🎯 Test It Out

1. Visit: `http://localhost:5000/pricing`
2. Click any plan's CTA button
3. You'll be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete payment → Redirects to dashboard

## 💰 Pricing Plans Supported

| Plan | Price | Stripe Amount |
|------|-------|---------------|
| **Starter** | $9.99/month | $9.99 |
| **Guardian+** | $99/year | $99.00 |
| **Vault Pro** | $499/year | $499.00 |

## 🔍 How It Works

```
User clicks plan → /checkout page → Stripe Checkout → Payment → Dashboard
```

1. User selects plan on `/pricing`
2. Redirected to `/checkout?plan=PlanName`
3. Reviews plan details
4. Clicks "Pay Now"
5. Server creates Stripe Checkout Session
6. User redirected to Stripe hosted page
7. User completes payment
8. Redirected back to `/dashboard?payment=success`

## 📊 View Payments

After testing, check your Stripe Dashboard:
- [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- Test payments show "Test mode" badge
- All transaction details are visible

## 🐛 Troubleshooting

**"Stripe is not configured" error:**
- ✅ Check `.env` file exists
- ✅ Verify `STRIPE_SECRET_KEY` is set (no spaces around `=`)
- ✅ Restart server after adding keys

**Payment doesn't work:**
- ✅ Use test keys (`sk_test_...`) for development
- ✅ Use test card: `4242 4242 4242 4242`
- ✅ Check server logs for errors

## 📚 Full Documentation

See [docs/STRIPE_SETUP.md](./docs/STRIPE_SETUP.md) for:
- Detailed setup instructions
- Webhook configuration
- Production deployment guide
- Security best practices

## ✨ You're Ready!

Once you add your Stripe keys to `.env` and restart the server, payments will work immediately. No code changes needed!

