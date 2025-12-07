# Legal Documents Setup

All legal documents have been created in the `legal/` directory.

## Files Created

1. **PRIVACY_POLICY.md** - GDPR/CCPA compliant privacy policy
2. **TERMS_OF_SERVICE.md** - Comprehensive terms of service
3. **DISCLAIMER.md** - Legal disclaimers for crypto platform
4. **RISK_DISCLOSURE.md** - Comprehensive risk disclosure
5. **REFUND_POLICY.md** - Subscription refund policy
6. **COOKIE_POLICY.md** - Cookie usage and tracking policy
7. **SECURITY_POLICY.md** - Security measures and practices
8. **DMCA_POLICY.md** - Copyright infringement policy
9. **ACCESSIBILITY_POLICY.md** - WCAG 2.1 compliance policy
10. **LICENSE_AGREEMENT.md** - Software license terms

## Frontend Integration

A legal documents page has been created at `client/src/pages/Legal.tsx` that provides navigation to all legal documents.

## Next Steps

1. **Review with Attorney**: Have all documents reviewed by a qualified attorney
2. **Update Placeholders**: Replace placeholder information:
   - Email addresses (legal@guardiavault.com, etc.)
   - Business address
   - Jurisdiction information
   - Arbitration organization
3. **Add Routes**: Add routes in `App.tsx`:
   ```tsx
   <Route path="/legal" component={Legal} />
   <Route path="/legal/privacy" component={PrivacyPolicy} />
   <Route path="/legal/terms" component={TermsOfService} />
   // ... etc
   ```
4. **Link in Footer**: Add links to legal documents in footer
5. **Add to Signup/Checkout**: Include links during signup and checkout flows
6. **Acceptance Checkbox**: Add "I agree to Terms and Privacy Policy" checkbox

## Important Notes

- These are **templates** - must be reviewed by attorney
- Replace all placeholder text with actual information
- Ensure compliance with local laws in your jurisdiction
- Update "Last Updated" dates when making changes
- Consider jurisdiction-specific requirements

## Contact

For legal questions, contact: legal@guardiavault.com

