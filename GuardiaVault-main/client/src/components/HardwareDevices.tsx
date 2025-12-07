/**
 * Hardware Devices Management Component
 * Allows users to register, view, and manage hardware devices
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HardwareDevice {
  id: string;
  deviceId: string;
  deviceName: string | null;
  status: "active" | "offline" | "suspended" | "lost";
  lastPing: string | null;
  alertThresholdMinutes: number | null;
  createdAt: string;
}

interface HardwareDevicesProps {
  onDeviceChange?: () => void;
}

export function HardwareDevices({ onDeviceChange }: HardwareDevicesProps) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [signature, setSignature] = useState("");

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/hardware/devices", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load devices");
      }

      const data = await response.json();
      if (data.success) {
        setDevices(data.devices || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load hardware devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!deviceId || !publicKey || !signature) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setRegistering(true);
      const response = await fetch("/api/hardware/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deviceId,
          deviceName: deviceName || undefined,
          publicKey,
          signature,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Hardware device registered successfully",
        });
        setRegisterDialogOpen(false);
        setDeviceId("");
        setDeviceName("");
        setPublicKey("");
        setSignature("");
        loadDevices();
        onDeviceChange?.();
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Failed to register device",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register device",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!deviceToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/hardware/devices/${deviceToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Device deleted successfully",
        });
        setDeleteDialogOpen(false);
        setDeviceToDelete(null);
        loadDevices();
        onDeviceChange?.();
      } else {
        toast({
          title: "Deletion Failed",
          description: data.message || "Failed to delete device",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete device",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "offline":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "suspended":
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case "lost":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatLastPing = (lastPing: string | null) => {
    if (!lastPing) return "Never";
    const date = new Date(lastPing);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Hardware Devices
              </CardTitle>
              <CardDescription>
                Manage your hardware devices for automatic proof-of-life pings
              </CardDescription>
            </div>
            <Button
              onClick={() => setRegisterDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Register Device
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hardware devices registered</p>
              <p className="text-sm mt-2">
                Register a device to enable automatic proof-of-life pings
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {devices.map((device) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(device.status)}
                          <h3 className="font-semibold">
                            {device.deviceName || device.deviceId}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">
                            {getStatusLabel(device.status)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium">Device ID:</span>{" "}
                            {device.deviceId}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Last ping: {formatLastPing(device.lastPing)}
                          </p>
                          {device.alertThresholdMinutes && (
                            <p>
                              Alert threshold: {device.alertThresholdMinutes}{" "}
                              minutes
                            </p>
                          )}
                          <p className="text-xs">
                            Registered: {new Date(device.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeviceToDelete(device.deviceId);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Device Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Hardware Device</DialogTitle>
            <DialogDescription>
              Register a new hardware device to enable automatic proof-of-life
              pings. The device must provide a valid RSA public key and signature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID *</Label>
              <Input
                id="deviceId"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g., device-12345678"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for your hardware device (min 8 characters)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name (Optional)</Label>
              <Input
                id="deviceName"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., My Hardware Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key (PEM format) *</Label>
              <Textarea
                id="publicKey"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                className="font-mono text-xs"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                RSA public key in PEM format for signature verification
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature">Registration Signature *</Label>
              <Textarea
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Base64 encoded signature"
                className="font-mono text-xs"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Signature of "GuardiaVault Device Registration\nDevice ID: {deviceId || '[device-id]'}\nTimestamp: [current unix timestamp]"
                signed with the device's private key. The timestamp should be the current Unix timestamp (seconds since epoch).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegisterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={registering}>
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Register Device
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Device Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hardware Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this device? This action cannot be
              undone and the device will no longer be able to send pings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

