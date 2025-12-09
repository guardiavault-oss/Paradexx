/**
 * Party types with extended fields
 * Some fields are stored as JSON metadata or in separate tables
 */

import type { Party } from "@shared/schema";

export interface ExtendedParty extends Omit<Party, "role" | "status"> {
  role: "guardian" | "beneficiary" | "attestor";
  status: "pending" | "active" | "declined" | "inactive";
  
  // Extended fields (may be stored in metadata or separate tables)
  walletAddress?: string | null;
  fragmentId?: string | null;
  
  // Beneficiary-specific fields
  isNonprofit?: boolean;
  nonprofitName?: string | null;
  nonprofitEIN?: string | null;
  nonprofitWebsite?: string | null;
  allocatedAssets?: string[];
  letterToBeneficiary?: string | null;
  allocationPercent?: number;
  allocatedAmount?: number; // In ETH
}

export interface PartyChangeHistory {
  id: string;
  date: Date;
  action: string;
  by: string;
  details?: string;
}

