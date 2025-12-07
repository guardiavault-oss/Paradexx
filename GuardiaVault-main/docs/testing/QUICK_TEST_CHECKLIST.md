# ⚡ Quick Test Checklist (15 minutes)

Use this for rapid smoke testing before deploying or after major changes.

## Critical Path Tests

### ✅ 1. Landing Page (1 min)
- [ ] Page loads
- [ ] Pricing section shows all 3 plans
- [ ] Features match CreateVault page
- [ ] 10-year pricing with 15% discount visible

### ✅ 2. User Registration (2 min)
- [ ] Click "Sign Up"
- [ ] Create account with email/password
- [ ] Redirects to dashboard
- [ ] User stays logged in after refresh

### ✅ 3. Wallet Connection (2 min)
- [ ] Click "Connect Wallet"
- [ ] Wallet modal opens
- [ ] Connect successfully
- [ ] Address appears in navigation

### ✅ 4. Subscription Flow - Stripe (5 min)
1. [ ] Navigate to `/create-vault`
2. [ ] **Select Plan**: Choose Family Plan ($299)
   - [ ] Features are visible
3. [ ] **Select Duration**: Choose 1 Year
   - [ ] Price shows $299
4. [ ] **Select Payment**: Choose Credit Card
5. [ ] **Click Pay**: Redirects to Stripe
6. [ ] **Test Card**: `4242 4242 4242 4242`
7. [ ] **Complete Payment**: Success
8. [ ] **Returns to app**: Can proceed to vault setup

### ✅ 5. Vault Creation (3 min)
- [ ] Enter vault name: "Test Vault"
- [ ] Set check-in: 90 days
- [ ] Set grace period: 7 days
- [ ] Add 3 guardians (min required)
- [ ] Add 1 beneficiary
- [ ] Click "Create Vault"
- [ ] Passphrases displayed

### ✅ 6. Dashboard (2 min)
- [ ] Vault appears on dashboard
- [ ] Dark mode applied
- [ ] Check-in button visible
- [ ] Guardians/Beneficiaries listed

---

## Red Flags 🚨

If any of these fail, stop and fix before proceeding:

- ❌ **Cannot create account** → Database issue
- ❌ **Payment doesn't work** → Stripe/API issue
- ❌ **Vault creation fails** → Critical bug
- ❌ **Dashboard doesn't load** → Auth/routing issue
- ❌ **Hooks error** → React component issue

---

## Test Data

**Test User**:
- Email: `test@example.com`
- Password: `Test1234!`

**Test Card (Stripe)**:
- Number: `4242 4242 4242 4242`
- Expiry: `12/25` (any future date)
- CVC: `123`
- ZIP: `12345`

---

## Quick Commands

```bash
# Check database
docker ps | grep guardiavault-db

# Restart if needed
docker-compose restart postgres

# Check server logs
# (Look at terminal running `pnpm run dev`)

# Check browser console
# (F12 → Console tab)
```

---

**Time: ~15 minutes | Status: [ ] Pass [ ] Fail**

