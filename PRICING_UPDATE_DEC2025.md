# Paradex Wallet - Pricing Update (December 2025)

## Summary of Changes

All pricing has been updated to be more competitive and sustainable. The changes include tiered swap fees based on subscription level, reduced yield fees, and the addition of a Lifetime Pass option.

---

## 🔄 Swap Fees (Updated)

| Tier | Previous | New | Discount |
|------|----------|-----|----------|
| **Free** | 0.79% | **0.5%** | - |
| **Pro** | 0.79% | **0.35%** | 30% off |
| **Elite** | 0.79% | **0.2%** | 60% off |
| **Lifetime** | N/A | **0.15%** | 70% off |

**Rationale:** Uniswap charges 0.3%, so our Elite/Lifetime tiers are now competitive while Free tier is still reasonable.

---

## 📈 Yield Fees (Updated)

| Service | Previous | New |
|---------|----------|-----|
| Yield Vault | 1% | **0.75%** |
| Yield Adapters | 1% | **0.75%** |

**Rationale:** More competitive with industry standard (Yearn charges 2%, Beefy charges 0.5-4.5%).

---

## 💳 Subscription Pricing (Updated)

### Free Plan - $0/month
- Basic wallet & transactions
- Email support
- **0.5% swap fee**

### Pro Plan - $19.99/month (was $9.99)
- All Free features
- Priority support
- Advanced analytics
- Gas optimization
- Whale tracking
- Multi-wallet support
- Portfolio insights
- Price alerts
- **0.35% swap fee (30% savings)**
- **Annual: $199.99/year (save $40)**

### Elite Plan - $49.99/month (was $29.99)
- All Pro features
- MEV protection
- Honeypot detection
- Rug detection
- DeFi aggregation
- API access
- White glove support
- Smart Will advanced
- Tax reporting
- Custom strategies
- **0.2% swap fee (60% savings)**
- **Annual: $499.99/year (save $100)**

### Lifetime Pass - $499 one-time (NEW!)
- All Elite features **forever**
- Lowest swap fee (0.15%)
- Early access to new features
- Founding member badge
- Priority support forever
- All future features included
- **Savings: $600+/year vs Elite subscription**

---

## 💎 Premium Add-ons (One-Time Purchases)

| Feature | Price | Description |
|---------|-------|-------------|
| Sniper Bot | $49 | Automated token launch sniping |
| Whale Alerts Pro | $29 | Real-time whale movement notifications |
| Private Node | $99 | Privacy-focused transaction routing |
| MEV Protection Plus | $39 | Enhanced MEV protection with Flashbots |
| Inheritance Protocol | $149 | Crypto inheritance and vault protection |
| Multi-Sig Templates | $79 | Pre-built multi-signature vault templates |
| Manual Death Verification | $199 | Human-verified death certificate processing |
| Exit Strategies | $69 | Automated profit-taking and stop-loss |

### Complete Bundle - $349 (40% discount)
All 8 premium features - lifetime access

---

## 📁 Files Modified

### Backend Services
- `src/backend/services/swap-fee.service.ts` - Tiered fee structure with SubscriptionTier support
- `src/backend/services/yield-adapters.service.ts` - Reduced yield fee to 0.75%
- `src/backend/services/yield-vault.service.ts` - Reduced yield fee to 0.75%

### Routes
- `src/backend/routes/auth.routes.ts` - Updated SUBSCRIPTION_TIERS with new pricing and features
- `src/backend/routes/premium.routes.ts` - Added Lifetime Pass checkout and benefits

### Frontend
- `src/components/transaction/TransactionStatusPanel.tsx` - Updated default fee display

### Documentation
- `services/guardiavault/docs/STRIPE_SETUP.md` - Updated pricing documentation
- `src/backend/scripts/test-sepolia-swap.ts` - Updated test output

---

## 🚀 Deployment Notes

1. **Smart Contracts**: No changes needed - fees are handled at the application layer
2. **Stripe**: Create new price IDs in Stripe dashboard for updated subscription tiers
3. **Database**: Run migration to add `lifetime_pass` column to users table if not exists
4. **Environment Variables**: Ensure `STRIPE_SECRET_KEY` is configured for production

---

## 💰 Revenue Model

### Free Users
- 0.5% swap fee on all transactions

### Pro Subscribers ($19.99/mo)
- Subscription revenue: $19.99/mo per user
- 0.35% swap fee (reduced but still generating revenue)

### Elite Subscribers ($49.99/mo)
- Subscription revenue: $49.99/mo per user
- 0.2% swap fee (low but significant on high volume)

### Lifetime Pass Holders ($499 one-time)
- One-time revenue: $499
- 0.15% swap fee (lowest rate, incentivizes high volume trading)
- Break-even vs Elite: ~10 months of Elite subscription

### Additional Revenue Streams
- Yield fees: 0.75% on all yield earnings
- Premium add-ons: $29-$199 one-time purchases
- Complete bundle: $349 one-time

---

## ✅ Checklist for Mainnet Deployment

- [ ] Update Stripe price IDs in production
- [ ] Create Stripe products for Lifetime Pass
- [ ] Test checkout flows in staging
- [ ] Update marketing pages with new pricing
- [ ] Notify existing users of pricing changes (30-day notice for increases)
- [ ] Monitor conversion rates after launch
