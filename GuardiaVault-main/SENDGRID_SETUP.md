# SendGrid Setup Instructions

## 1. Add API Key to Environment

Add your SendGrid API key to your `.env` file:

```env
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=noreply@guardiavault.com
```

**Important:** 
- Replace `noreply@guardiavault.com` with your verified sender email in SendGrid
- You must verify your sender email in SendGrid before sending emails

## 2. Verify Sender Email in SendGrid

1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter your email address and complete verification
4. Use that verified email as `SENDGRID_FROM_EMAIL`

## 3. Test Your First Email

### Option A: Using the Test Endpoint

```bash
# Send test email to your email address
curl -X POST http://localhost:5000/api/test/sendgrid \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

### Option B: Using Node.js Script

Create a file `test-sendgrid.js`:

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey('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');

const msg = {
  to: 'your-email@example.com', // Change to your email
  from: 'noreply@guardiavault.com', // Must be verified in SendGrid
  subject: 'Hello from GuardiaVault!',
  text: 'Hello from GuardiaVault!\n\nThis is a test email sent via SendGrid.',
  html: '<h1>Hello from GuardiaVault!</h1><p>This is a test email sent via SendGrid.</p>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent successfully!');
  })
  .catch((error) => {
    console.error('Error sending email:', error);
  });
```

Run it:
```bash
node test-sendgrid.js
```

## 4. How It Works

The email service (`server/services/email.ts`) now:
1. **First tries SendGrid** if `SENDGRID_API_KEY` is set
2. **Falls back to SMTP** if SendGrid fails or isn't configured
3. **Simulates sending** if neither is configured (development mode)

## 5. Production Setup

For production (Railway/Netlify):
1. Add `SENDGRID_API_KEY` to your environment variables
2. Add `SENDGRID_FROM_EMAIL` with your verified sender email
3. Restart your server

The service will automatically use SendGrid once the API key is configured!

