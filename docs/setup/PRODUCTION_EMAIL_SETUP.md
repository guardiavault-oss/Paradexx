# Production Email Setup Guide

## Current Status

✅ **Configuration:**
- **Primary Email Provider: Resend** (API key configured)
- Email sending is asynchronous (non-blocking)
- SendGrid available as fallback
- Rate limiting reduced to 30 seconds
- Dev mode hints removed
- Production-ready error handling
- Production-ready error handling

## Email Delivery

**Current Setup:** Using Resend as primary email provider
- Fast delivery (usually < 30 seconds)
- Reliable API
- Good developer experience
- SendGrid available as fallback if needed

## Solutions

### Option 1: Upgrade SendGrid Plan (Recommended for Production)
1. Upgrade to SendGrid's **Essentials** or **Pro** plan
2. Benefits:
   - Faster delivery (usually < 1 minute)
   - Higher rate limits
   - Priority processing
   - Better deliverability

### Option 2: Switch to Resend (Recommended for Better Performance)
1. Get a Resend API key from https://resend.com
2. Add to `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
3. Benefits:
   - Faster delivery (usually < 30 seconds)
   - Better developer experience
   - More generous free tier
   - Modern API

### Option 3: Use Both (Best for Production)
Configure both providers with Resend as primary:
1. Add both API keys to `.env`
2. The system will try Resend first, fallback to SendGrid
3. Provides redundancy and faster delivery

## Configuration

### Current Email Provider Priority:
1. **Resend Connector** (if available)
2. **Resend API Key** (if `RESEND_API_KEY` is set)
3. **SendGrid** (if `SENDGRID_API_KEY` is set)
4. **Console Logging** (development fallback)

### Environment Variables:
```env
# Primary (Configured)
RESEND_API_KEY=re_8oenEQkQ_2KcNiX51ykfWr2y8mr1XGgoe

# Fallback (Optional)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=help@guardiavault.com

# Default
FROM_EMAIL=Paradex <noreply@aldvra.resend.app>
```

## Testing Email Delivery

1. **Check Backend Logs:**
   - Look for `[EMAIL] SendGrid accepted email in Xms`
   - Check for any error messages

2. **Monitor Delivery Times:**
   - Note when email is sent (backend log)
   - Note when email is received
   - Calculate delay

3. **Test with Resend:**
   - Add `RESEND_API_KEY` to `.env`
   - Restart backend
   - Test email delivery
   - Compare delivery times

## Production Checklist

- [ ] Email provider configured (Resend or SendGrid)
- [ ] API keys set in `.env`
- [ ] From email address verified
- [ ] Email templates tested
- [ ] Delivery times acceptable (< 1 minute)
- [ ] Error handling tested
- [ ] Fallback provider configured (optional)
- [ ] Monitoring/logging in place

## Quick Fix for Immediate Production

To get faster email delivery right now:

1. **Add Resend API Key:**
   ```bash
   # Get free API key from https://resend.com
   # Add to .env:
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

2. **Restart Backend:**
   ```bash
   npm run dev:backend
   ```

3. **Test:**
   - Request verification code
   - Check delivery time (should be < 30 seconds)

## Support

If emails are still delayed after switching providers:
1. Check email provider dashboard for rate limits
2. Verify API keys are correct
3. Check spam folder
4. Review backend logs for errors
5. Consider email provider's status page

---

**Note:** The 5-minute delay is a SendGrid free tier limitation, not a code issue. The code is optimized for production and will work much better with a paid email provider or Resend.

