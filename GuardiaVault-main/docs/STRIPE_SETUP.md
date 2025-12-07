# Stripe Payment Setup Guide

Complete guide for setting up Stripe payment processing in GuardiaVault.

## 🔑 Required Stripe API Keys

You need to add these to your `.env` file (server-side):

```env
# Stripe Secret Key (Server-side only - NEVER expose to frontend)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
# For production, use: sk_live_...

# Stripe Publishable Key (Safe to use in frontend)
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
# For production, use: pk_live_...

# App URL (for redirect URLs)
APP_URL=http://localhost:5000
# For production: https://yourdomain.com
```

## 📝 Step-by-Step Setup

### 1. Create Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a free account
3. Complete account verification

### 2. Get Your API Keys

1. Go to [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)
2. You'll see two keys:

   **Test Mode Keys (for development):**
   - Secret key: `sk_test_...` → Goes in `STRIPE_SECRET_KEY`
   - Publishable key: `pk_test_...` → Goes in `STRIPE_PUBLISHABLE_KEY` (optional for now)

   **Live Mode Keys (for production):**
   - Activate live mode in dashboard
   - Secret key: `sk_live_...`
   - Publishable key: `pk_live_...`

### 3. Add Keys to .env File

Create or edit `.env` in your project root:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51S8Jk99WGaMBPmpWL...
STRIPE_PUBLISHABLE_KEY=pk_test_51S8Jk99WGaMBPmpWL...
APP_URL=http://localhost:5000
```

**For Production:**
```env
STRIPE_SECRET_KEY=sk_live_51S8Jk99WGaMBPmpWL...
STRIPE_PUBLISHABLE_KEY=pk_live_51S8Jk99WGaMBPmpWL...
APP_URL=https://yourdomain.com
```

### 4. Test the Integration

1. Start your server:
   ```bash
   pnpm run dev
   ```

2. Navigate to pricing page:
   ```
   http://localhost:5000/pricing
   ```

3. Select a plan and click "Start Free Trial" or "Upgrade Now"

4. You'll be redirected to Stripe Checkout

5. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

## 💳 Current Pricing Plans

The system supports three pricing tiers:

### Starter Plan
- **Price:** $9.99/month or $119.88/year
- **Stripe Amount:** $9.99 (monthly) or $119.88 (annual)

### Guardian+ Plan
- **Price:** $99/year
- **Stripe Amount:** $99.00

### Vault Pro Plan
- **Price:** $499/year
- **Stripe Amount:** $499.00

## 🔄 Payment Flow

1. User selects plan on `/pricing` page
2. Clicks CTA button → Redirects to `/checkout?plan=PlanName`
3. User reviews plan and selects duration
4. Clicks "Pay Now" → Frontend calls `/api/payments/create-checkout-session`
5. Server creates Stripe Checkout Session
6. User redirected to Stripe hosted checkout page
7. User completes payment
8. Stripe redirects to success URL: `/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`
9. User can now access dashboard

## 📊 Viewing Payments

After a payment is made:

1. Go to [Stripe Dashboard > Payments](https://dashboard.stripe.com/payments)
2. You'll see all transactions
3. Test payments show "Test mode" badge
4. Production payments show full details

## 🧪 Testing with Test Cards

Stripe provides test card numbers for testing:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

Use any:
- Future expiry date (e.g., 12/34)
- Any 3-digit CVC
- Any ZIP code

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Never expose secret keys** - Only use in server-side code
3. **Use test keys for development** - Switch to live keys only in production
4. **Enable webhook signature verification** - For production (see below)
5. **Monitor Stripe Dashboard** - Watch for suspicious activity

## 🌐 Webhook Setup (Optional - for Production)

For production, set up webhooks to handle payment events:

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
5. Copy webhook signing secret to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 🐛 Troubleshooting

### "Stripe is not configured" Error

**Problem:** Server returns this error when trying to create checkout.

**Solution:**
1. Check `.env` file exists in project root
2. Verify `STRIPE_SECRET_KEY` is set
3. Restart server after adding keys
4. Check for typos (no spaces around `=`)

### "No checkout URL returned"

**Problem:** Frontend can't get checkout URL from server.

**Solution:**
1. Check server logs for Stripe errors
2. Verify Stripe secret key is valid
3. Check network tab in browser DevTools
4. Ensure `APP_URL` is set correctly

### Test Cards Not Working

**Problem:** Test card payments fail.

**Solution:**
1. Make sure you're using **test mode** keys (`sk_test_...`)
2. Use exact test card numbers from Stripe docs
3. Check Stripe Dashboard for error details
4. Verify card expiry is in the future

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Test Cards Reference](https://stripe.com/docs/testing#cards)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

## ✅ Checklist

Before going live:

- [ ] Stripe account created and verified
- [ ] Test keys added to `.env` (development)
- [ ] Test payment successful with test card
- [ ] Live keys added to production `.env`
- [ ] `APP_URL` set to production domain
- [ ] Webhook endpoint configured (if using)
- [ ] Error handling tested
- [ ] Success/cancel redirects working

## 🎉 You're Ready!

Once you've added your Stripe keys to `.env` and restarted the server, payments will work automatically. The checkout flow is fully integrated and ready to accept payments!

