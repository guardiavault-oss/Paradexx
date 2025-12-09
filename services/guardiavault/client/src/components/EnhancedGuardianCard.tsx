/**
 * Enhanced Guardian Card with expandable details
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
  UserPlus,
  UserX,
  RefreshCw,
  Eye,
  MessageSquare,
  Edit,
  Wallet,
  History,
  Shield,
  Percent,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
// Optimized Ethers import - use optimized imports for better tree-shaking
import { formatEther, BrowserProvider } from "@/lib/ethers-optimized";

interface EnhancedGuardianCardProps {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "guardian" | "beneficiary" | "attestor";
  status: "active" | "pending" | "declined";
  fragmentId?: string;
  walletAddress?: string | null;
  allocationPercent?: number;
  relationship?: string; // e.g., "Spouse", "Sibling", "Friend", "Colleague"
  onReplace?: () => void;
  onRemove?: () => void;
  onViewDetails?: () => void;
  onResendInvite?: () => void;
  onSendReminder?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onChangeHistory?: () => void;
}

export default function EnhancedGuardianCard({
  id,
  name,
  email,
  phone,
  role,
  status,
  fragmentId,
  walletAddress,
  allocationPercent,
  relationship,
  onReplace,
  onRemove,
  onViewDetails,
  onResendInvite,
  onSendReminder,
  onMessage,
  onEdit,
  onChangeHistory,
}: EnhancedGuardianCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [changeHistory, setChangeHistory] = useState<any[]>([]);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const statusColors = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    declined: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const fetchBalance = async () => {
    if (!walletAddress || !window.ethereum) return;
    
    setLoadingBalance(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(walletAddress);
      setBalance(formatEther(bal));
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "EnhancedGuardianCard_fetchBalance",
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
        context: "EnhancedGuardianCard_fetchChangeHistory",
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
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg text-white truncate">{name}</h4>
                <Badge
                  variant="outline"
                  className={`${statusColors[status]} text-xs uppercase px-2 py-0.5`}
                >
                  {status}
                </Badge>
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
              {relationship && (
                <div className="mt-1">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                    {relationship}
                  </Badge>
                </div>
              )}
              {phone && (
                <div className="text-xs text-slate-500 mt-1">{phone}</div>
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
                  {onMessage && (
                    <DropdownMenuItem onClick={onMessage}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </DropdownMenuItem>
                  )}
                  {onSendReminder && (
                    <DropdownMenuItem onClick={onSendReminder}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Send Reminder
                    </DropdownMenuItem>
                  )}
                  {onResendInvite && status === "pending" && (
                    <DropdownMenuItem onClick={onResendInvite}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Resend Invitation
                    </DropdownMenuItem>
                  )}
                  {onViewDetails && (
                    <DropdownMenuItem onClick={onViewDetails}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Technical Details
                    </DropdownMenuItem>
                  )}
                  {onReplace && (
                    <DropdownMenuItem onClick={onReplace}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Replace Guardian
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
                  {/* Allocation Percentage */}
                  {allocationPercent !== undefined && (
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Allocation</span>
                        <span className="text-lg font-bold text-white">{allocationPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${allocationPercent}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
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

                  {/* Technical Details - Hidden by default */}
                  <div className="p-3 glass rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-400">Technical Details</span>
                    </div>
                    {fragmentId && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Recovery Piece ID:</span>
                          <code className="text-xs font-mono text-purple-400 bg-slate-900/50 px-2 py-1 rounded">
                            #{fragmentId.slice(-8)}
                          </code>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                          Secure Key Piece Active
                        </Badge>
                        <p className="text-xs text-slate-500 mt-2">
                          This guardian holds a piece of the recovery key. Multiple pieces are needed to restore access.
                        </p>
                      </div>
                    )}
                  </div>

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
                    {onMessage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onMessage}
                        className="w-full"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    )}
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

