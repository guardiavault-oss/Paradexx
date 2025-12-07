/**
 * Paradox Wallet - Features Index
 * Central export for all advanced features
 */

// Portfolio & Analytics
export { PortfolioAnalytics } from "./PortfolioAnalytics";
export type { PortfolioAnalyticsProps } from "./PortfolioAnalytics";

// Transaction & Fee Components
export {
  FeeBreakdown,
  InlineFeeDisplay,
  FEE_RATES,
} from "./FeeBreakdown";
export type { FeeBreakdownProps } from "./FeeBreakdown";

// User Guides
export {
  FirstTransactionGuide,
  useFirstTransactionGuide,
} from "./FirstTransactionGuide";
export type { FirstTransactionGuideProps } from "./FirstTransactionGuide";

// Token Management
export { CustomTokenImport } from "./CustomTokenImport";
export type { CustomTokenImportProps } from "./CustomTokenImport";

// dApp Store
export { CuratedDappLauncher } from "./CuratedDappLauncher";
export type { CuratedDappLauncherProps } from "./CuratedDappLauncher";

// Help & Support
export { HelpCenter } from "./HelpCenter";
export type { HelpCenterProps } from "./HelpCenter";

// Gas Management
export { GasManager } from "./GasManager";
export type { GasManagerProps } from "./GasManager";

// Legal Pages
export { LegalPages } from "./LegalPages";
export type { LegalPagesProps } from "./LegalPages";