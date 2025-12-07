# 🧪 Complete Testing Guide for GuardiaVault

This guide will help you test every feature of the platform to ensure everything works correctly.

---

## 📋 Pre-Testing Setup

### 1. Environment Setup
```bash
# Make sure database is running
docker ps | grep guardiavault-db

# If not running, start it
docker-compose up -d postgres

# Verify environment variables are set
# Check .env file has:
# - DATABASE_URL
# - STRIPE_SECRET_KEY (test key for testing)
# - STRIPE_PUBLISHABLE_KEY (test key)
# - VITE_WALLETCONNECT_PROJECT_ID (optional for wallet testing)
```

### 2. Start the Application
```bash
# Terminal 1: Start server
pnpm run dev

# Terminal 2: Start client (if separate)
cd client && pnpm run dev
```

### 3. Test Accounts & Cards
- **Stripe Test Cards**:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - Use any future expiry date and any CVC

---

## ✅ Testing Checklist

### Phase 1: Landing Page & Pricing

#### Test 1.1: Landing Page Load
- [ ] Navigate to `http://localhost:5000` (or your dev URL)
- [ ] Page loads without errors
- [ ] Navigation bar is visible
- [ ] All sections render (Hero, Features, Pricing, FAQ)

#### Test 1.2: Pricing Section
- [ ] Scroll to pricing section
- [ ] Three plans are visible: Solo, Family, Pro/Investor
- [ ] Each plan shows:
  - [ ] 1 Year price ($99, $299, $599)
  - [ ] 10 Year price with 15% discount badge
  - [ ] Plan description
  - [ ] Feature list with checkmarks
- [ ] "Prepay & Protect" button is clickable on each plan

#### Test 1.3: Feature Verification
- [ ] **Solo Plan** shows:
  - [ ] "Protect 1 wallet"
  - [ ] "2-of-3 key fragments"
  - [ ] "Standard beneficiary setup"
- [ ] **Family Plan** shows:
  - [ ] "Up to 5 wallets"
  - [ ] "Multiple beneficiaries"
  - [ ] "Guardian management"
- [ ] **Pro/Investor Plan** shows:
  - [ ] "Unlimited wallets (or larger limit)"
  - [ ] "Priority support"
  - [ ] "Advanced remediations"

---

### Phase 2: Wallet Connection

#### Test 2.1: Connect Wallet (Unauthenticated)
- [ ] Click "Connect Wallet" in navigation
- [ ] Wallet modal appears (MetaMask/Web3Modal)
- [ ] Select wallet and approve connection
- [ ] Wallet address appears in navigation
- [ ] Wallet connected banner shows (if implemented)

#### Test 2.2: Connect Wallet (Authenticated)
- [ ] Log in to account
- [ ] Click "Connect Wallet" in dashboard
- [ ] Wallet connects successfully
- [ ] Connected address is saved/displayed

---

### Phase 3: Authentication Flow

#### Test 3.1: User Registration (New Account)
- [ ] Click "Sign Up" or navigate to `/signup`
- [ ] Enter email address
- [ ] Enter password (minimum requirements met)
- [ ] Submit registration
- [ ] Success message appears
- [ ] User is redirected to dashboard
- [ ] User session is created (check cookies)

#### Test 3.2: User Login
- [ ] Navigate to `/login`
- [ ] Enter registered email and password
- [ ] Submit login
- [ ] Success message appears
- [ ] Redirected to dashboard
- [ ] User data is displayed correctly

#### Test 3.3: Logout
- [ ] Click "Logout" button in navigation
- [ ] User is logged out
- [ ] Session is cleared
- [ ] Redirected to home page
- [ ] Wallet connection is cleared

---

### Phase 4: Subscription & Payment Flow

#### Test 4.1: Navigate to Vault Creation
- [ ] Log in to account
- [ ] Connect wallet
- [ ] Navigate to `/create-vault` or click "Create Vault"
- [ ] Subscription step is visible (Step 1)

#### Test 4.2: Plan Selection
- [ ] **Solo Plan Selection**:
  - [ ] Click Solo Plan radio button
  - [ ] Plan is selected (highlighted)
  - [ ] Features are visible:
    - [ ] "Protect 1 wallet"
    - [ ] "2-of-3 key fragments"
    - [ ] "Standard beneficiary setup"
  - [ ] Price updates to $99/year

- [ ] **Family Plan Selection**:
  - [ ] Click Family Plan radio button
  - [ ] Plan is selected
  - [ ] Features visible: "Up to 5 wallets", etc.
  - [ ] Price updates to $299/year

- [ ] **Pro/Investor Plan Selection**:
  - [ ] Click Pro/Investor Plan radio button
  - [ ] Plan is selected
  - [ ] Features visible: "Unlimited wallets", etc.
  - [ ] Price updates to $599/year

#### Test 4.3: Duration Selection
- [ ] **1 Year Selection**:
  - [ ] Click "1 Year" radio button
  - [ ] Pricing shows 1 year total (no discount)
  - [ ] Payment summary shows correct amount

- [ ] **10 Year Selection**:
  - [ ] Click "10 Years" radio button
  - [ ] "15% OFF" badge is visible
  - [ ] Original price is crossed out
  - [ ] Discounted price is shown
  - [ ] Discount amount is calculated correctly
    - Solo: $990 → $841.50 (15% off)
    - Family: $2,990 → $2,541.50
    - Pro: $5,990 → $5,091.50

#### Test 4.4: Payment Method Selection
- [ ] **Stripe Payment**:
  - [ ] Click "Credit Card" payment method
  - [ ] Card is highlighted/selected
  - [ ] Button shows "Pay $X with Credit Card"

- [ ] **Crypto Payment**:
  - [ ] Click "Cryptocurrency" payment method
  - [ ] Card is highlighted/selected
  - [ ] Button shows "Create Subscription (X ETH)"

#### Test 4.5: Stripe Payment Flow
1. **Select Plan & Payment**:
   - [ ] Select any plan (e.g., Family Plan)
   - [ ] Select duration (1 year or 10 years)
   - [ ] Select "Credit Card" payment method
   - [ ] Click "Pay $X with Credit Card"

2. **Stripe Checkout**:
   - [ ] Redirected to Stripe checkout page
   - [ ] Enter test card: `4242 4242 4242 4242`
   - [ ] Enter any future expiry (e.g., 12/25)
   - [ ] Enter any CVC (e.g., 123)
   - [ ] Enter email address
   - [ ] Click "Pay"

3. **Payment Success**:
   - [ ] Payment is processed
   - [ ] Redirected back to application
   - [ ] Success message is shown
   - [ ] Subscription is created
   - [ ] Can proceed to next step

#### Test 4.6: Crypto Payment Flow
1. **Select Plan & Payment**:
   - [ ] Select any plan
   - [ ] Select duration
   - [ ] Select "Cryptocurrency" payment method
   - [ ] Click "Create Subscription (X ETH)"

2. **Wallet Transaction**:
   - [ ] MetaMask (or wallet) popup appears
   - [ ] Transaction details are correct
   - [ ] Amount matches calculated ETH value
   - [ ] Approve transaction

3. **Transaction Confirmation**:
   - [ ] Transaction is submitted
   - [ ] "Transaction Submitted" alert appears
   - [ ] Hash is displayed
   - [ ] Wait for confirmation
   - [ ] "Transaction confirmed" message appears
   - [ ] Subscription is active
   - [ ] Can proceed to next step

#### Test 4.7: Payment Summary Verification
For each plan/duration combination, verify:
- [ ] Monthly rate (USD) is correct
- [ ] Prepaid months (12 or 120) is correct
- [ ] Discount (if 10 years) is calculated correctly
- [ ] Total payment (USD) is correct
- [ ] ETH equivalent is shown
- [ ] All calculations match expectations

**Test Combinations**:
- [ ] Solo Plan - 1 Year: $99
- [ ] Solo Plan - 10 Years: $841.50 (15% off $990)
- [ ] Family Plan - 1 Year: $299
- [ ] Family Plan - 10 Years: $2,541.50
- [ ] Pro Plan - 1 Year: $599
- [ ] Pro Plan - 10 Years: $5,091.50

---

### Phase 5: Vault Creation Flow

#### Test 5.1: Vault Setup (Step 2)
- [ ] Complete subscription step
- [ ] Click "Next" button
- [ ] Vault Setup form appears

**Vault Configuration**:
- [ ] Enter vault name (minimum 3 characters)
- [ ] Set check-in interval (1-365 days)
- [ ] Set grace period (1-90 days)
- [ ] Form validation works (required fields)
- [ ] Can proceed to next step

#### Test 5.2: Guardians (Step 3)
- [ ] Navigate to Guardians step
- [ ] Add at least 3 guardians
- [ ] For each guardian, enter:
  - [ ] Name (minimum 2 characters)
  - [ ] Email (valid email format)
  - [ ] Phone (optional)
- [ ] Form validates email format
- [ ] Can add up to 5 guardians
- [ ] Can remove guardians
- [ ] Cannot proceed with less than 3 guardians
- [ ] Can proceed to next step with 3+ guardians

#### Test 5.3: Beneficiaries (Step 4)
- [ ] Navigate to Beneficiaries step
- [ ] Add at least 1 beneficiary
- [ ] For each beneficiary, enter:
  - [ ] Name
  - [ ] Email
  - [ ] Phone (optional)
- [ ] Form validation works
- [ ] Can add multiple beneficiaries
- [ ] Can remove beneficiaries
- [ ] Cannot proceed without at least 1 beneficiary

#### Test 5.4: Review & Submit
- [ ] Navigate to Review step (if implemented)
- [ ] All entered information is displayed
- [ ] Click "Create Vault" or "Submit"
- [ ] Loading state is shown
- [ ] Vault is created successfully
- [ ] Success message appears

#### Test 5.5: Passphrase Display
- [ ] After vault creation, passphrase screen appears
- [ ] Guardian passphrases are displayed
- [ ] Each guardian has unique passphrase
- [ ] Master secret is shown
- [ ] Can copy passphrases
- [ ] Can download/export passphrases (if implemented)
- [ ] "Close" button returns to dashboard

---

### Phase 6: Dashboard Functionality

#### Test 6.1: Dashboard Load
- [ ] Navigate to `/dashboard`
- [ ] Dashboard loads without errors
- [ ] Dark mode is applied
- [ ] Sidebar is visible and styled correctly
- [ ] Vault overview is displayed

#### Test 6.2: Vault Display
- [ ] If vault exists:
  - [ ] Vault name is displayed
  - [ ] Status is shown (active/pending/etc.)
  - [ ] Last check-in date is displayed
  - [ ] Days remaining until next check-in
  - [ ] Status cards show correct information

#### Test 6.3: Wallet Connection on Dashboard
- [ ] If wallet not connected:
  - [ ] Alert shows "Connect Your Wallet"
  - [ ] WalletConnectButton is visible
  - [ ] Can connect wallet from dashboard
- [ ] After connection:
  - [ ] Alert disappears
  - [ ] Check-in button becomes available

#### Test 6.4: Check-In Functionality
- [ ] Connect wallet
- [ ] Click "I'm Alive - Check In" button
- [ ] Wallet popup appears
- [ ] Transaction is approved
- [ ] Check-in is recorded
- [ ] Last check-in date updates
- [ ] Days remaining resets

#### Test 6.5: Guardians & Beneficiaries Display
- [ ] Guardians section shows:
  - [ ] List of all guardians
  - [ ] Guardian status (active/pending/declined)
  - [ ] Guardian email/contact info
  - [ ] Fragment ID (if applicable)
- [ ] Beneficiaries section shows:
  - [ ] List of all beneficiaries
  - [ ] Beneficiary status
  - [ ] Contact information

#### Test 6.6: Navigation
- [ ] Sidebar toggle works
- [ ] Navigation links work
- [ ] "Logout" button works
- [ ] Wallet connection status persists

---

### Phase 7: Edge Cases & Error Handling

#### Test 7.1: Invalid Input
- [ ] Try to submit form with invalid email
- [ ] Try to submit with missing required fields
- [ ] Try to add guardian with invalid email
- [ ] Error messages appear correctly

#### Test 7.2: Network Errors
- [ ] Disconnect internet
- [ ] Try to create subscription
- [ ] Try to create vault
- [ ] Appropriate error messages shown

#### Test 7.3: Wallet Errors
- [ ] Try to create subscription without wallet connected
- [ ] Try to check in without wallet connected
- [ ] Decline wallet transaction
- [ ] Error messages are clear

#### Test 7.4: Payment Errors
- [ ] Use declined card: `4000 0000 0000 0002`
- [ ] Payment fails gracefully
- [ ] Error message is shown
- [ ] User can retry payment

#### Test 7.5: Database Errors
- [ ] Stop PostgreSQL container
- [ ] Try to register/login
- [ ] Appropriate error message shown
- [ ] In-memory fallback works (if implemented)

---

### Phase 8: Cross-Browser & Responsive Testing

#### Test 8.1: Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] All features work in each browser

#### Test 8.2: Responsive Design
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667, 414x896)
- [ ] All elements are visible and functional
- [ ] Navigation works on mobile
- [ ] Forms are usable on small screens

---

### Phase 9: Data Persistence

#### Test 9.1: Session Persistence
- [ ] Log in
- [ ] Refresh page
- [ ] Still logged in
- [ ] Data persists

#### Test 9.2: Database Persistence
- [ ] Create vault
- [ ] Log out
- [ ] Log back in
- [ ] Vault data is still there
- [ ] All guardians/beneficiaries are saved

#### Test 9.3: Wallet Connection Persistence
- [ ] Connect wallet
- [ ] Refresh page
- [ ] Wallet still connected (if implemented)

---

### Phase 10: Performance & UX

#### Test 10.1: Loading States
- [ ] Loading indicators show during API calls
- [ ] Buttons show disabled state during processing
- [ ] Transaction confirmation shows progress

#### Test 10.2: Error Messages
- [ ] All error messages are user-friendly
- [ ] No technical jargon in user-facing errors
- [ ] Errors provide actionable next steps

#### Test 10.3: Success Messages
- [ ] Success toasts appear
- [ ] Messages are clear and informative
- [ ] User knows what to do next

---

## 🔍 Verification Checklist

### Landing Page Matches CreateVault
- [ ] Plan names match exactly
- [ ] Prices match exactly ($99, $299, $599)
- [ ] Features list matches exactly
- [ ] 10-year discount (15%) matches
- [ ] Descriptions match

### Payment Integration
- [ ] Stripe checkout redirects correctly
- [ ] Stripe success redirects back
- [ ] Crypto payment uses correct contract/address
- [ ] Payment amounts are correct

### Database Integration
- [ ] Users are saved to database
- [ ] Vaults are saved to database
- [ ] Subscriptions are tracked
- [ ] Data persists across restarts

---

## 🐛 Common Issues & Solutions

### Issue: "Wallet connection unavailable"
**Solution**: 
- Check `VITE_WALLETCONNECT_PROJECT_ID` is set
- Ensure wallet extension is installed
- Check browser console for errors

### Issue: "Database connection failed"
**Solution**:
- Verify PostgreSQL container is running: `docker ps`
- Check `DATABASE_URL` in `.env`
- Restart container: `docker-compose restart postgres`

### Issue: "Stripe checkout not working"
**Solution**:
- Verify Stripe keys are in `.env`
- Use test keys (sk_test_... and pk_test_...)
- Check Stripe Dashboard for test mode

### Issue: "React hooks error"
**Solution**:
- Ensure all hooks are called before any early returns
- Check for conditional hook calls
- Verify component structure

### Issue: "Subscription not activating"
**Solution**:
- Check transaction hash on block explorer
- Verify smart contract address is correct
- Check if subscription limits are met

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________
Environment: [ ] Development [ ] Staging [ ] Production

Phase 1: Landing Page & Pricing
Status: [ ] Pass [ ] Fail [ ] Partial
Notes: ________________________________

Phase 2: Wallet Connection
Status: [ ] Pass [ ] Fail [ ] Partial
Notes: ________________________________

Phase 3: Authentication
Status: [ ] Pass [ ] Fail [ ] Partial
Notes: ________________________________

Phase 4: Subscription & Payment
Status: [ ] Pass [ ] Fail [ ] Partial
Notes: ________________________________

Phase 5: Vault Creation
Status: [ ] Pass [ ] Fail [ ] Partial
Notes: ________________________________

Phase 6: Dashboard
Status: [ ] Pass [ ] Fail [ ] Partial
Notes: ________________________________

Critical Issues Found: ________________________________
________________________________

Recommendations: ________________________________
________________________________
```

---

## 🚀 Quick Smoke Test (5 minutes)

If you need a quick test, run these critical paths:

1. ✅ Landing page loads → Pricing visible
2. ✅ Click "Prepay & Protect" → Checkout page loads
3. ✅ Register new account → Dashboard loads
4. ✅ Connect wallet → Wallet connects
5. ✅ Create vault → Subscription step shows plans
6. ✅ Select plan → Features and pricing display correctly
7. ✅ Select Stripe payment → Stripe checkout opens
8. ✅ Complete payment → Returns to app

---

## 📚 Additional Testing Resources

- **Stripe Test Mode**: https://stripe.com/docs/testing
- **MetaMask Test Network**: Use Sepolia or local Hardhat network
- **Database Tools**: Use `pgAdmin` or `DBeaver` to verify data
- **Browser DevTools**: Check Network, Console, and Application tabs

---

**Remember**: Test like a user! Think about what they would do and what could go wrong.

