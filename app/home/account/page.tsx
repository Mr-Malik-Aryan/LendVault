"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  const handleCopyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      toast.success("Wallet address copied to clipboard!");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
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
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Account</h1>
          <p className="text-muted-foreground mb-8">
            View and manage your account settings and profile information.
          </p>

          {/* Profile Section */}
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Profile Information</h2>
            
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Username
                </label>
                <div className="bg-secondary/50 border border-border rounded-lg p-4">
                  <p className="text-lg text-foreground font-medium">{user?.username}</p>
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Wallet Address
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-secondary/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground break-all font-mono">
                      {user?.walletAddress}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopyAddress}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Member Since */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Member Since
                </label>
                <div className="bg-secondary/50 border border-border rounded-lg p-4">
                  <p className="text-foreground">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-muted-foreground text-sm mb-2">Total Borrowed</p>
              <p className="text-3xl font-bold text-foreground">
                {user?.totalBorrowed || 0} ETH
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-muted-foreground text-sm mb-2">Total Lent</p>
              <p className="text-3xl font-bold text-primary">
                {user?.totalLent || 0} ETH
              </p>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">Account Actions</h2>
            
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
