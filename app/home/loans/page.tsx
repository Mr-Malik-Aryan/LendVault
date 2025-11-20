"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AlertCircle } from "lucide-react";

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  duration: number;
  status: string;
  createdAt: string;
}

export default function LoansPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoansLoading(true);
        // TODO: Implement API call to fetch loans
        // const response = await fetch(`/api/loans?walletAddress=${user?.walletAddress}`);
        // if (!response.ok) throw new Error('Failed to fetch loans');
        // const data = await response.json();
        // setLoans(data.loans);
        setLoans([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch loans");
      } finally {
        setLoansLoading(false);
      }
    };

    if (isAuthenticated && user?.walletAddress) {
      fetchLoans();
    }
  }, [isAuthenticated, user?.walletAddress]);

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
        <div className="max-w-6xl">
          <h1 className="text-4xl font-bold text-foreground mb-4">My Loan Requests</h1>
          <p className="text-muted-foreground mb-8">
            View and manage your active loan requests and agreements.
          </p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-8 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Error</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {loansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-secondary rounded w-1/2 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-secondary rounded w-full"></div>
                    <div className="h-3 bg-secondary rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">No Loan Requests Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't created any loan requests yet. Head to your NFTs to create one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.map((loan) => (
                <div key={loan.id} className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {loan.amount} ETH
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <span className="text-foreground font-medium">{loan.interestRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-foreground font-medium">{loan.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${loan.status === 'ACTIVE' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {loan.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
