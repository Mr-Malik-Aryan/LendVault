"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Loan {
  id: string;
  amount: string;
  interestRate: string;
  collateralType: string;
  collateralImageUrl: string | null;
  status: string;
  borrower: {
    username: string;
  };
}

const FeaturedCollections = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      // Create a temporary user ID for fetching (you can adjust this)
      const response = await fetch('/api/loans/explore');
      const data = await response.json();

      if (data.success && data.loans) {
        // Get first 4 active loans with images
        const activeLoans = data.loans
          .filter((loan: Loan) => loan.status === 'ACTIVE' && loan.collateralImageUrl)
          .slice(0, 4);
        setLoans(activeLoans);
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amountWei: string) => {
    const eth = parseFloat(amountWei) / 1e18;
    return eth.toFixed(4);
  };
  if (loading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Active <span className="text-primary">Loan Offers</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore active loan opportunities backed by NFT collateral
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-secondary"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary rounded w-3/4"></div>
                  <div className="h-3 bg-secondary rounded w-1/2"></div>
                  <div className="h-8 bg-secondary rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="container mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Active <span className="text-primary">Loan Offers</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore active loan opportunities backed by NFT collateral
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loans.length > 0 ? (
            loans.map((loan, index) => (
              <Card 
                key={loan.id}
                className="group bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-nft-glow cursor-pointer overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square relative overflow-hidden">
                  {loan.collateralImageUrl ? (
                    <img 
                      src={loan.collateralImageUrl} 
                      alt={loan.collateralType}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-secondary to-card-hover" />
                  )}
                  <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">{loan.interestRate}% APR</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                      {loan.collateralType}
                    </h3>
                    <p className="text-sm text-muted-foreground">by {loan.borrower.username}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="font-semibold text-foreground">{formatAmount(loan.amount)} ETH</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="font-semibold text-primary">{loan.status}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No active loans available at the moment</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
