export function LegalDisclaimer() {
  return (
    <div 
      className="text-xs text-muted-foreground/60 max-w-4xl mx-auto leading-relaxed" 
      data-testid="legal-disclaimer"
      style={{ 
        border: 'none',
        backgroundColor: 'transparent',
        padding: 0
      }}
    >
      <p className="mb-0">
        GuardiaVault is a cryptographic time-lock system based on periodic check-ins and multi-party inactivity attestation.
        This system does not provide legal death verification, replace professional estate planning, or create legally binding inheritance transfers.
        You are responsible for consulting qualified legal counsel and understanding your jurisdiction's inheritance laws.
        Use of this service constitutes acceptance of these limitations. GuardiaVault is a cryptographic tool, not legal advice.
      </p>
    </div>
  );
}
