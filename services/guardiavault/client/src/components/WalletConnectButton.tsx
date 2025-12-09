import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Wallet, Loader2, LogOut, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface WalletConnectButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function WalletConnectButton({
  variant = "default",
  size = "default",
  className = "",
}: WalletConnectButtonProps) {
  const { isWalletConnected, isConnecting, user, walletAddress, connectWallet, disconnectWallet } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum;

  // Show install MetaMask button if not installed
  if (!isMetaMaskInstalled) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => window.open("https://metamask.io/download/", "_blank")}
        className={className}
        data-testid="button-install-metamask"
      >
        <Wallet className="w-4 h-4" />
        Install MetaMask
      </Button>
    );
  }

  // Show wallet address if connected - as dropdown menu
  // Check both isWalletConnected and that we have an address to display
  if (isWalletConnected && walletAddress) {
    const addr = walletAddress;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            data-testid="button-wallet-address"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {addr.slice(0, 6)}...{addr.slice(-4)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-72 bg-slate-900 border border-slate-700/50 backdrop-blur-xl shadow-2xl"
        >
          <DropdownMenuLabel className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold">Wallet Connected</span>
            </div>
          </DropdownMenuLabel>
          
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Wallet className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-1">Address</p>
                <p className="text-sm font-mono text-white truncate">{addr}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyAddress(addr)}
                className="flex-1 h-9 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 text-white transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://etherscan.io/address/${addr}`, "_blank")}
                className="flex-1 h-9 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 text-white transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View
              </Button>
            </div>
          </div>
          
          <DropdownMenuSeparator className="bg-white/10" />
          
          <DropdownMenuItem
            onClick={async () => {
              await disconnectWallet();
            }}
            className="mx-2 my-2 rounded-lg text-red-400 focus:text-red-300 focus:bg-red-500/10 hover:bg-red-500/10 cursor-pointer transition-all"
            data-testid="button-disconnect-wallet"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Show connect wallet button if not connected
  return (
    <Button
      variant={variant}
      size={size}
      onClick={connectWallet}
      disabled={isConnecting}
      className={className}
      data-testid="button-connect-wallet"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}
