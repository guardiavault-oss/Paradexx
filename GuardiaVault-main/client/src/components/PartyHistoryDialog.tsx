/**
 * Party Change History Dialog Component
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logError } from "@/utils/logger";

interface PartyChangeHistory {
  id: string;
  date: Date | string;
  action: string;
  by: string;
  details?: string;
}

interface PartyHistoryDialogProps {
  partyId?: string;
  partyName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartyHistoryDialog({
  partyId,
  partyName,
  open,
  onOpenChange,
}: PartyHistoryDialogProps) {
  const [history, setHistory] = useState<PartyChangeHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && partyId) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [open, partyId]);

  const fetchHistory = async () => {
    if (!partyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/parties/${partyId}/history`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(
          data.history.map((h: any) => ({
            ...h,
            date: new Date(h.date),
          }))
        );
      } else {
        setHistory([]);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "PartyHistoryDialog_fetchHistory",
        partyId,
      });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Change History</DialogTitle>
          <DialogDescription>
            View all changes for {partyName || "this party"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 bg-slate-800/50" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No change history available
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((change) => (
                <div key={change.id} className="p-3 glass rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{change.action}</span>
                    <span className="text-xs text-slate-400">
                      {typeof change.date === "string"
                        ? new Date(change.date).toLocaleDateString()
                        : change.date.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    By: {change.by}
                    {change.details && (
                      <span className="ml-2">• {change.details}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

