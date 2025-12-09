import { Card } from "@/components/ui/card";
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
import { Mail, MoreVertical, UserPlus, UserX, RefreshCw, Eye } from "lucide-react";

interface GuardianCardProps {
  id?: string;
  name: string;
  email: string;
  role: "guardian" | "beneficiary" | "attestor";
  status: "active" | "pending" | "declined";
  fragmentId?: string;
  onReplace?: () => void;
  onRemove?: () => void;
  onViewDetails?: () => void;
  onResendInvite?: () => void;
  onSendReminder?: () => void;
}

export default function GuardianCard({
  id,
  name,
  email,
  role,
  status,
  fragmentId,
  onReplace,
  onRemove,
  onViewDetails,
  onResendInvite,
  onSendReminder,
}: GuardianCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const statusColors = {
    active: "bg-status-online/10 text-status-online border-status-online/20",
    pending: "bg-status-away/10 text-status-away border-status-away/20",
    declined: "bg-status-busy/10 text-status-busy border-status-busy/20",
  };

  const roleColors = {
    guardian: "bg-primary/10 text-primary border-primary/20",
    beneficiary: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    attestor: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-${role}-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/20 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate" data-testid={`text-name-${name.toLowerCase().replace(/\s+/g, "-")}`}>{name}</h4>
            <Badge
              variant="outline"
              className={`${roleColors[role]} text-xs uppercase`}
              data-testid={`badge-role-${role}`}
            >
              {role}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-3 h-3" />
            <span className="truncate">{email}</span>
          </div>
          {fragmentId && (
            <div className="mt-1">
              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                {fragmentId}
              </code>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${statusColors[status]} text-xs uppercase`}
            data-testid={`badge-status-${status}`}
          >
            {status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                data-testid={`button-action-${name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onSendReminder && (
                <DropdownMenuItem onClick={onSendReminder}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Send Reminder
                </DropdownMenuItem>
              )}
              {onViewDetails && (
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {onReplace && (
                <DropdownMenuItem onClick={onReplace}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Replace Guardian
                </DropdownMenuItem>
              )}
              {onResendInvite && status === "pending" && (
                <DropdownMenuItem onClick={onResendInvite}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Resend Invite
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
                    Remove Guardian
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
