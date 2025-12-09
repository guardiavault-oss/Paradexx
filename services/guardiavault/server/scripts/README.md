# Demo Account Script

This script creates a demo account with full access to test the GuardiaVault platform.

## Demo Account Credentials

- **Email**: `demo@guardiavault.com`
- **Password**: `Demo123!@#`

## Features

The demo account includes:
- ✅ User account with authentication
- ✅ Active subscription (if database is configured)
- ✅ Sample vault for testing

## Usage

Run the script from the project root:

```bash
npx tsx server/scripts/create-demo-account.ts
```

## Database Requirements

For full functionality (including subscription management), you need a PostgreSQL database:

1. Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/guardiavault"
   ```

2. Run the migrations to create the subscriptions table:
   ```bash
   # The subscriptions table should already exist from base_schema.sql
   ```

3. Re-run the script to create the subscription:
   ```bash
   npx tsx server/scripts/create-demo-account.ts
   ```

## Without Database

If you don't have a database configured, the script will:
- ✅ Create the user account (stored in memory)
- ✅ Create a sample vault
- ⚠️ Skip subscription creation (requires database)

The user can still log in and use most features, but subscription checks will return 404.

## Testing the Account

1. Start the server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page:
   ```
   http://localhost:5000/login
   ```

3. Log in with:
   - Email: `demo@guardiavault.com`
   - Password: `Demo123!@#`

4. You should have access to:
   - Dashboard
   - Vault management
   - All premium features (if subscription is active)

## Demo Guardian Information

When creating vaults, you'll need to add guardians. Use these demo emails:

**Quick Demo Guardians:**
- `john.smith@example.com` - John Smith
- `sarah.smith@example.com` - Sarah Smith
- `michael.johnson@example.com` - Michael Johnson

See `demo-guardians.md` for more guardian options.

**Note**: These are demo emails and won't receive actual invitations. They're only for testing the vault setup flow.

## Notes

- The demo account is safe to use for testing
- The password can be changed through the settings page
- If using in-memory storage, data will be lost when the server restarts
- For persistent data, configure a PostgreSQL database

