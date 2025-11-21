"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wallet, TrendingUp, TrendingDown, FileText, CheckCircle, Clock, Image as ImageIcon } from "lucide-react";

interface LoanStats {
  totalBorrowed: number;
  totalLent: number;
  activeBorrowedLoans: number;
  activeLentLoans: number;
  fundedLoans: number;
  repaidLoans: number;
  nftsAsCollateral: number;
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [stats, setStats] = useState<LoanStats>({
    totalBorrowed: 0,
    totalLent: 0,
    activeBorrowedLoans: 0,
    activeLentLoans: 0,
    fundedLoans: 0,
    repaidLoans: 0,
    nftsAsCollateral: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.walletAddress) return;

      try {
        setLoadingStats(true);
        const response = await fetch(`/api/loans?walletAddress=${user.walletAddress}`);
        if (!response.ok) throw new Error("Failed to fetch loans");
        
        const data = await response.json();
        const borrowedLoans = data.borrowedLoans || [];
        const lentLoans = data.lentLoans || [];

        // Calculate stats
        const totalBorrowed = borrowedLoans.reduce((sum: number, loan: any) => 
          sum + (parseFloat(loan.amount) || 0), 0
        );
        
        const totalLent = lentLoans.reduce((sum: number, loan: any) => 
          sum + (parseFloat(loan.amount) || 0), 0
        );

        const activeBorrowed = borrowedLoans.filter((loan: any) => 
          loan.status === "ACTIVE" || loan.status === "FUNDED"
        ).length;

        const activeLent = lentLoans.filter((loan: any) => 
          loan.status === "FUNDED"
        ).length;

        const funded = borrowedLoans.filter((loan: any) => 
          loan.status === "FUNDED"
        ).length;

        const repaid = borrowedLoans.filter((loan: any) => 
          loan.status === "REPAID"
        ).length;

        // Count unique NFTs used as collateral
        const nftSet = new Set(borrowedLoans.map((loan: any) => 
          `${loan.collateralContractAddress}-${loan.collateralId}`
        ));

        setStats({
          totalBorrowed,
          totalLent,
          activeBorrowedLoans: activeBorrowed,
          activeLentLoans: activeLent,
          fundedLoans: funded,
          repaidLoans: repaid,
          nftsAsCollateral: nftSet.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (isAuthenticated && user?.walletAddress) {
      fetchStats();
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

  const formatWei = (wei: number): string => {
    if (wei === 0) return "0";
    const weiString = wei.toString();
    return weiString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar username={user?.username} />
      
      <main className="pl-20 md:pl-64 p-8">
        <div className="max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-foreground">My </span>
                <span className="text-primary">Account</span>
              </h1>
              <p className="text-muted-foreground">Overview of your lending and borrowing activity</p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="text-foreground border-border hover:bg-muted"
            >
              Logout
            </Button>
          </div>

          {/* Profile Card */}
          <Card className="bg-card border-border p-6 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-2xl">
                  {user?.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-1">{user?.username}</h2>
               
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-mono break-all">{user?.walletAddress}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="bg-card border-border p-6 animate-pulse">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-secondary rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Borrowing Stats */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Borrowing Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Borrowed</p>
                      <Wallet className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground font-mono">{formatWei(stats.totalBorrowed)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Wei</p>
                  </Card>

                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Active Loans</p>
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.activeBorrowedLoans}</p>
                    <p className="text-xs text-muted-foreground mt-1">Loans in progress</p>
                  </Card>

                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Funded Loans</p>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.fundedLoans}</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently funded</p>
                  </Card>

                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">NFTs as Collateral</p>
                      <ImageIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.nftsAsCollateral}</p>
                    <p className="text-xs text-muted-foreground mt-1">Unique NFTs used</p>
                  </Card>
                </div>
              </div>

              {/* Lending Stats */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-primary" />
                  Lending Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Lent</p>
                      <Wallet className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground font-mono">{formatWei(stats.totalLent)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Wei</p>
                  </Card>

                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Active Investments</p>
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.activeLentLoans}</p>
                    <p className="text-xs text-muted-foreground mt-1">Loans funded</p>
                  </Card>

                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Repaid Loans</p>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.repaidLoans}</p>
                    <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
                  </Card>

                  <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Loans</p>
                      <FileText className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {stats.activeBorrowedLoans + stats.repaidLoans}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
