/**
 * Legacy Messages Management Page
 * Allows users to create, edit, and manage legacy letters for beneficiaries
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Mail, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAppSidebar } from "@/components/EnhancedAppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { motion } from "framer-motion";
import "../design-system.css";

interface LegacyMessage {
  id: string;
  vaultId: string;
  beneficiaryId: string | null;
  type: "letter";
  title: string;
  content: string | null;
  fileUrl: string | null;
  status: "draft" | "ready" | "delivered";
  createdAt: string;
}

export default function LegacyMessages() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<LegacyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedVault, setSelectedVault] = useState<string>("");
  const [vaults, setVaults] = useState<Array<{ id: string; name: string }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    type: "letter" as const,
    title: "",
    content: "",
    beneficiaryId: "",
  });

  useEffect(() => {
    loadVaults();
  }, []);

  useEffect(() => {
    if (selectedVault) {
      loadMessages(selectedVault);
    }
  }, [selectedVault]);

  const loadVaults = async () => {
    try {
      const res = await window.fetch("/api/vaults");
      if (res.ok) {
        const data = await res.json();
        setVaults(data.vaults || []);
        if (data.vaults && data.vaults.length > 0) {
          setSelectedVault(data.vaults[0].id);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load vaults",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (vaultId: string) => {
    setLoading(true);
    try {
      const res = await window.fetch(`/api/vaults/${vaultId}/legacy-messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedVault || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await window.fetch(`/api/vaults/${selectedVault}/legacy-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "letter",
          title: formData.title,
          content: formData.content,
          beneficiaryId: formData.beneficiaryId || null,
        }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Message created successfully",
        });
        setShowCreateForm(false);
        setFormData({ type: "letter", title: "", content: "", beneficiaryId: "" });
        loadMessages(selectedVault);
      } else {
        throw new Error("Failed to create message");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create message",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await window.fetch(`/api/legacy-messages/${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Message deleted",
        });
        loadMessages(selectedVault);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      ready: "default",
      delivered: "outline",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (vaults.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You need to create a vault first before adding legacy messages.
            </p>
            <Button onClick={() => setLocation("/vaults")}>
              Create Vault
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <EnhancedAppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <DashboardHeader />
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Premium Mesh Gradient Background */}
          <div className="mesh-gradient" />
          <div className="noise-overlay" />
          
          {/* Animated Orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute right-0 bottom-0 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          <div className="relative z-10 container max-w-6xl mx-auto px-6 py-8">
            {/* Premium Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold display-font heading-glow mb-3 flex items-center gap-3">
                    <Mail className="w-10 h-10 text-pink-400" />
                    Legacy Messages
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Create legacy letters for your beneficiaries
                  </p>
                </div>
              </div>
            </motion.div>

      <div className="mb-6">
        <Label htmlFor="vault-select">Select Vault</Label>
        <Select value={selectedVault} onValueChange={setSelectedVault}>
          <SelectTrigger id="vault-select" className="w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {vaults.map((vault) => (
              <SelectItem key={vault.id} value={vault.id}>
                {vault.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!showCreateForm ? (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="mb-6"
        >
          <Plus className="mr-2 w-4 h-4" />
          Create New Message
        </Button>
      ) : (
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Create New Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Message title"
                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary/50"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-white">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Write your message..."
                rows={6}
                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary focus-visible:border-primary/50"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Save className="mr-2 w-4 h-4" />
                Create
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ type: "letter", title: "", content: "", beneficiaryId: "" });
                }}
              >
                <X className="mr-2 w-4 h-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">Loading messages...</div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No messages yet. Create your first message above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {messages.map((message) => (
            <Card key={message.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-500" />
                    <CardTitle className="text-lg">{message.title}</CardTitle>
                  </div>
                  {getStatusBadge(message.status)}
                </div>
              </CardHeader>
              <CardContent>
                {message.content && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                    {message.content}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(message.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(message.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

