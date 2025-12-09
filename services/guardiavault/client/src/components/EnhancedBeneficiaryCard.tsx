/**
 * Enhanced Beneficiary Card with expandable details
 * Shows allocation %, on-chain balances, edit history, and actions
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { logError } from "@/utils/logger";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  MoreVertical,
  UserX,
  Edit,
  Wallet,
  History,
  Percent,
  ExternalLink,
  Gift,
  Coins,
  Heart,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
// Optimized Ethers import - use optimized imports for better tree-shaking
import { formatEther, BrowserProvider } from "@/lib/ethers-optimized";

interface EnhancedBeneficiaryCardProps {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isNonprofit?: boolean;
  allocationPercent?: number;
  allocatedAmount?: number; // In ETH
  allocatedAssets?: string[];
  walletAddress?: string | null;
  letterToBeneficiary?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
  onAllocateAssets?: () => void;
  onViewLetter?: () => void;
  onChangeHistory?: () => void;
}

export default function EnhancedBeneficiaryCard({
  id,
  name,
  email,
  phone,
  isNonprofit,
  allocationPercent,
  allocatedAmount,
  allocatedAssets = [],
  walletAddress,
  letterToBeneficiary,
  onEdit,
  onRemove,
  onAllocateAssets,
  onViewLetter,
  onChangeHistory,
}: EnhancedBeneficiaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const fetchBalance = async () => {
    if (!walletAddress || !window.ethereum) return;
    
    setLoadingBalance(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(walletAddress);
      setBalance(formatEther(bal));
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "EnhancedBeneficiaryCard_fetchBalance",
        walletAddress,
      });
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchChangeHistory = async () => {
    try {
      const response = await fetch(`/api/parties/${id}/history`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setChangeHistory(data.history.map((h: any) => ({
          date: new Date(h.date),
          action: h.action,
          by: h.by,
          details: h.details,
        })));
      } else {
        // Fallback to empty if API fails
        setChangeHistory([]);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "EnhancedBeneficiaryCard_fetchChangeHistory",
        partyId: id,
      });
      setChangeHistory([]);
    }
  };

  const handleExpand = () => {
    if (!expanded) {
      if (walletAddress) fetchBalance();
      fetchChangeHistory();
    }
    setExpanded(!expanded);
  };

  return (
    <Card className="glass-card hover:bg-white/5 transition-all">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-pink-500/20">
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg text-white truncate">{name}</h4>
                {isNonprofit && (
                  <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/20 text-xs">
                    <Heart className="w-3 h-3 mr-1" />
                    Nonprofit
                  </Badge>
                )}
                {allocationPercent !== undefined && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                    <Percent className="w-3 h-3 mr-1" />
                    {allocationPercent}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="w-3 h-3" />
                <span className="truncate">{email}</span>
              </div>
              {phone && (
                <div className="text-xs text-slate-500 mt-1">{phone}</div>
              )}
              {allocatedAssets.length > 0 && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                    <Gift className="w-3 h-3 mr-1" />
                    {allocatedAssets.length} asset{allocatedAssets.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-white/10">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                  )}
                  {onAllocateAssets && (
                    <DropdownMenuItem onClick={onAllocateAssets}>
                      <Coins className="w-4 h-4 mr-2" />
                      Allocate Assets
                    </DropdownMenuItem>
                  )}
                  {onViewLetter && (
                    <DropdownMenuItem onClick={onViewLetter}>
                      <FileText className="w-4 h-4 mr-2" />
                      {letterToBeneficiary ? "Edit Letter" : "Write Letter"}
                    </DropdownMenuItem>
                  )}
                  {onRemove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={onRemove}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExpand}
                  className="text-slate-400 hover:text-white"
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0 space-y-4 border-t border-white/10">
                  {/* Allocation Percentage & Amount */}
                  {(allocationPercent !== undefined || allocatedAmount !== undefined) && (
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Allocation</span>
                        <div className="text-right">
                          {allocationPercent !== undefined && (
                            <span className="text-lg font-bold text-white mr-2">{allocationPercent}%</span>
                          )}
                          {allocatedAmount !== undefined && (
                            <div className="text-sm text-emerald-400">
                              {allocatedAmount.toFixed(4)} ETH
                            </div>
                          )}
                        </div>
                      </div>
                      {allocationPercent !== undefined && (
                        <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden mt-2">
                          <motion.div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${allocationPercent}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wallet Balance */}
                  {walletAddress && (
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-slate-400">Wallet Balance</span>
                        </div>
                        <a
                          href={`https://etherscan.io/address/${walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          View on Etherscan
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {loadingBalance ? (
                        <Skeleton className="h-6 w-24 bg-slate-800/50" />
                      ) : balance ? (
                        <div className="text-2xl font-bold text-white">
                          {parseFloat(balance).toFixed(4)} ETH
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchBalance}
                          className="w-full"
                        >
                          Load Balance
                        </Button>
                      )}
                      <div className="text-xs text-slate-500 mt-1 font-mono break-all">
                        {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                      </div>
                    </div>
                  )}

                  {/* Allocated Assets */}
                  {allocatedAssets.length > 0 && (
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-slate-400">Allocated Assets</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {allocatedAssets.slice(0, 5).map((asset, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {asset}
                          </Badge>
                        ))}
                        {allocatedAssets.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{allocatedAssets.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Letter Status */}
                  {letterToBeneficiary && (
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-slate-400">Personal Letter</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Letter included • {letterToBeneficiary.length} characters
                      </p>
                    </div>
                  )}

                  {/* Change History */}
                  {changeHistory.length > 0 && (
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">Recent Changes</span>
                        </div>
                        {onChangeHistory && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onChangeHistory}
                            className="text-xs h-6"
                          >
                            View All
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {changeHistory.slice(0, 3).map((change, idx) => (
                          <div key={idx} className="text-xs text-slate-400 border-l-2 border-white/10 pl-2">
                            <div className="text-white">{change.action}</div>
                            <div className="text-slate-500">
                              {change.date.toLocaleDateString()} • {change.by}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="w-full"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {onAllocateAssets && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAllocateAssets}
                        className="w-full"
                      >
                        <Coins className="w-3 h-3 mr-1" />
                        Allocate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

