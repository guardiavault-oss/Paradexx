import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AcceptInvite() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const token = params.get("token") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({ title: "Invalid Link", description: "Missing token.", variant: "destructive" });
    }
  }, [token, toast]);

  const accept = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const resp = await apiRequest("POST", "/api/guardians/accept", { token, name, email, phone });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed to accept invite");
      toast({ title: "Welcome", description: "You are now an active guardian." });
      setLocation("/login");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to accept invite", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Accept Guardian Invite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="tel" placeholder="Phone (+1…)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button className="w-full" onClick={accept} disabled={loading || !token}>{loading ? "Submitting…" : "Accept Invite"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}


