"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GetETHPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  const faucets = [
    {
      name: "Sepolia Faucet",
      network: "Sepolia",
      url: "https://www.sepoliafaucet.io/",
      description: "Get testnet ETH for Sepolia network",
    },
    {
      name: "Goerli Faucet",
      network: "Goerli",
      url: "https://goerlifaucet.com/",
      description: "Get testnet ETH for Goerli network",
    },
    {
      name: "Mumbai Faucet",
      network: "Mumbai (Polygon)",
      url: "https://faucet.polygon.technology/",
      description: "Get testnet MATIC for Mumbai network",
    },
  ];

  const handleCopyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast.success("Wallet address copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar username={user?.username} />
      <main className="pl-20 md:pl-64 p-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-4">Get Testnet ETH</h1>
          <p className="text-muted-foreground mb-8">
            Use these faucets to get testnet ETH for development and testing.
          </p>

          {/* Your Wallet Address */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Wallet Address</h2>
            <div className="flex items-center gap-2 bg-secondary/50 p-4 rounded-lg">
              <code className="flex-1 text-sm text-muted-foreground break-all">
                {user?.walletAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                className="shrink-0"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>

          {/* Faucets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faucets.map((faucet) => (
              <div key={faucet.network} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <h3 className="text-lg font-semibold text-foreground mb-2">{faucet.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{faucet.description}</p>
                <p className="text-xs text-primary mb-4 font-medium">{faucet.network}</p>
                <a
                  href={faucet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Visit Faucet
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">How to Use</h3>
            <ol className="space-y-3 text-muted-foreground text-sm">
              <li className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">1.</span>
                <span>Copy your wallet address using the button above</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">2.</span>
                <span>Click on one of the faucet links to visit the faucet website</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">3.</span>
                <span>Paste your wallet address into the faucet form</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">4.</span>
                <span>Complete any verification steps and request testnet ETH</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">5.</span>
                <span>Wait for the transaction to complete (usually 1-2 minutes)</span>
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
