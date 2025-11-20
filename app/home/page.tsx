"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar username={user?.username} />
      
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-bold">
              <span className="text-foreground">Lend</span>
              <span className="text-primary">Vault</span>
            </h1>
            <Button
              onClick={logout}
              variant="outline"
              className="text-foreground border-border hover:bg-muted"
            >
              Logout
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <h2 className="text-5xl font-bold text-foreground mb-4">
                Welcome Home, {user?.username}! 🎉
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                You are successfully authenticated
              </p>
              
              <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto">
                <p className="text-foreground mb-4">
                  <span className="text-muted-foreground">Username:</span>
                  <br />
                  <span className="text-primary font-semibold">{user?.username}</span>
                </p>
                <p className="text-foreground">
                  <span className="text-muted-foreground">Wallet Address:</span>
                  <br />
                  <span className="text-primary font-mono text-sm break-all">
                    {user?.walletAddress}
                  </span>
                </p>
              </div>

              <p className="text-muted-foreground mt-12">
                More features coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
