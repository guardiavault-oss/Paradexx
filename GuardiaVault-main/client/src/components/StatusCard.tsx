import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle: string;
  status: "active" | "warning" | "critical" | "inactive";
}

export default function StatusCard({
  icon: Icon,
  title,
  value,
  subtitle,
  status,
}: StatusCardProps) {
  const statusColors = {
    active: "bg-status-online/10 text-status-online border-status-online/20",
    warning: "bg-status-away/10 text-status-away border-status-away/20",
    critical: "bg-status-busy/10 text-status-busy border-status-busy/20",
    inactive: "bg-status-offline/10 text-status-offline border-status-offline/20",
  };

  return (
    <Card className="p-6 hover-elevate" data-testid={`card-status-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <Badge
          variant="outline"
          className={`${statusColors[status]} uppercase text-xs font-semibold`}
          data-testid={`badge-status-${status}`}
        >
          {status}
        </Badge>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-3xl font-bold font-display" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </Card>
  );
}
