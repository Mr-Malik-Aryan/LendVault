"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Loan {
  id: string;
  borrowerId: string;
  lenderId: string;
  amount: string;
  interestRate: string;
  duration: number;
  collateralType: string;
  collateralId: string;
  collateralValue: string;
  status: string;
  dueDate: string;
  createdAt: string;
  borrower: {
    id: string;
    username: string;
    walletAddress: string;
    reputation: number;
  };
  amountInEth: number;
  interestRatePercent: number;
  durationInDays: number;
  totalReturn: number;
  profit: number;
  isOwnLoan: boolean;
}

export default function ExplorePage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  // Filter states
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minInterestRate, setMinInterestRate] = useState("");
  const [maxInterestRate, setMaxInterestRate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchLoans();
    }
  }, [user, sortBy, sortOrder]);

  const fetchLoans = async () => {
    try {
      setLoadingLoans(true);
      const params = new URLSearchParams({
        userId: user?.id || "",
      });

      const response = await fetch(`/api/loans?${params}`);
      const data = await response.json();

      console.log("Explore page - API response:", data);

      if (data.success) {
        // Check if allLoans exists and has items
        if (!data.allLoans || data.allLoans.length === 0) {
          console.log("No loans found in database");
          setLoans([]);
          setFilteredLoans([]);
          setLoadingLoans(false);
          return;
        }

        console.log(`Found ${data.allLoans.length} loans`);

        // Process all loans and add computed fields
        const processedLoans = data.allLoans.map((loan: any) => {
          const amountInEth = parseFloat(loan.amount) / 1e18;
          const interestRatePercent = parseFloat(loan.interestRate) / 100;
          const durationInDays = loan.duration / 86400;
          const totalReturn = amountInEth * (1 + (interestRatePercent / 100) * (durationInDays / 365));
          const profit = totalReturn - amountInEth;
          
          return {
            ...loan,
            amountInEth,
            interestRatePercent,
            durationInDays,
            totalReturn,
            profit,
            isOwnLoan: loan.borrowerId === user?.id,
          };
        });

        // Apply sorting
        const sortedLoans = [...processedLoans].sort((a, b) => {
          let aValue, bValue;
          
          if (sortBy === "interestRate") {
            aValue = a.interestRatePercent;
            bValue = b.interestRatePercent;
          } else if (sortBy === "amount") {
            aValue = a.amountInEth;
            bValue = b.amountInEth;
          } else if (sortBy === "duration") {
            aValue = a.durationInDays;
            bValue = b.durationInDays;
          } else {
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
          }
          
          return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
        });

        console.log("Processed loans:", processedLoans);
        console.log("Sorted loans:", sortedLoans);

        setLoans(sortedLoans);
        setFilteredLoans(sortedLoans);
      } else {
        console.error("API returned success: false", data);
        toast.error(data.error || "Failed to fetch loans");
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Error loading loans");
    } finally {
      setLoadingLoans(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loans];

    // Apply interest rate filters
    if (minInterestRate) {
      filtered = filtered.filter(loan => loan.interestRatePercent >= parseFloat(minInterestRate));
    }
    if (maxInterestRate) {
      filtered = filtered.filter(loan => loan.interestRatePercent <= parseFloat(maxInterestRate));
    }

    // Apply amount filters
    if (minAmount) {
      filtered = filtered.filter(loan => loan.amountInEth >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(loan => loan.amountInEth <= parseFloat(maxAmount));
    }

    setFilteredLoans(filtered);
  };

  const resetFilters = () => {
    setMinInterestRate("");
    setMaxInterestRate("");
    setMinAmount("");
    setMaxAmount("");
    setSearchTerm("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setFilteredLoans(loans);
  };

  useEffect(() => {
    let filtered = [...loans];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(loan => 
        loan.borrower.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.borrower.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply numeric filters
    if (minInterestRate) {
      filtered = filtered.filter(loan => loan.interestRatePercent >= parseFloat(minInterestRate));
    }
    if (maxInterestRate) {
      filtered = filtered.filter(loan => loan.interestRatePercent <= parseFloat(maxInterestRate));
    }
    if (minAmount) {
      filtered = filtered.filter(loan => loan.amountInEth >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(loan => loan.amountInEth <= parseFloat(maxAmount));
    }

    setFilteredLoans(filtered);
  }, [searchTerm, minInterestRate, maxInterestRate, minAmount, maxAmount, loans]);

  const handleInvest = async (loan: Loan) => {
    if (loan.isOwnLoan) {
      toast.error("You cannot invest in your own loan");
      return;
    }
    toast.success(`Investing in loan ${loan.id}...`);
    // Implement investment logic here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Explore Loans</h1>
            <p className="text-muted-foreground">
              Discover investment opportunities and earn returns by lending to borrowers.
            </p>
          </div>

          {/* Filters Topbar */}
          <Card className="p-4 mb-6 border-border overflow-visible">
            <div className="space-y-3">
              {/* Row 1 - Search */}
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search by username, wallet, or loan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Row 2 - Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Interest Rate Range */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Interest:</span>
                  <Input
                    type="number"
                    placeholder="Min %"
                    value={minInterestRate}
                    onChange={(e) => setMinInterestRate(e.target.value)}
                    step="0.1"
                    className="w-20 h-9"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max %"
                    value={maxInterestRate}
                    onChange={(e) => setMaxInterestRate(e.target.value)}
                    step="0.1"
                    className="w-20 h-9"
                  />
                </div>

                {/* Amount Range */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Amount:</span>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    step="0.01"
                    className="w-20 h-9"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    step="0.01"
                    className="w-20 h-9"
                  />
                </div>

                <div className="h-6 w-px bg-border"></div>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date</SelectItem>
                    <SelectItem value="interestRate">Interest</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-32 h-9">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">High → Low</SelectItem>
                    <SelectItem value="asc">Low → High</SelectItem>
                  </SelectContent>
                </Select>

                {/* Reset Button */}
                <Button onClick={resetFilters} variant="outline" size="sm" className="h-9 ml-auto">
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Loans Grid */}
          {loadingLoans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse aspect-square flex flex-col">
                  <div className="flex gap-2 mb-3">
                    <div className="w-10 h-10 bg-secondary rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-secondary rounded w-3/4"></div>
                      <div className="h-3 bg-secondary rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="h-3 bg-secondary rounded w-full"></div>
                    <div className="h-3 bg-secondary rounded w-5/6"></div>
                    <div className="h-3 bg-secondary rounded w-4/6"></div>
                    <div className="h-8 bg-secondary rounded w-full mt-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <Card className="p-12 text-center border-border">
              <div className="text-muted-foreground mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-xl font-semibold mb-2">No loans found</h3>
                <p>Try adjusting your filters or check back later for new opportunities.</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredLoans.length} loan{filteredLoans.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
                {filteredLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="group relative w-full max-w-[280px] rounded-2xl bg-gradient-to-br from-card via-card to-secondary p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02]"
                  >
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                    
                    <div className="relative space-y-5">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-secondary text-primary font-semibold">
                              {loan.borrower.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {loan.isOwnLoan && (
                              <Badge className="mb-1.5 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 text-xs font-medium px-2 py-0.5">
                                YOUR LOAN
                              </Badge>
                            )}
                            <h3 className="font-semibold text-foreground text-base">{loan.borrower.username}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Star className="h-4 w-4 fill-primary" />
                          <span className="text-sm font-medium">{loan.borrower.reputation}</span>
                        </div>
                      </div>

                      {/* Loan Details */}
                      <div className="space-y-3.5">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Amount</p>
                          <p className="text-2xl font-bold text-foreground">{loan.amount}Wei</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Interest</p>
                            <p className="text-sm font-semibold text-primary">{loan.interestRatePercent.toFixed(2)}% APR</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Duration</p>
                            <p className="text-sm font-semibold text-foreground">{loan.durationInDays.toFixed(0)} days</p>
                          </div>
                        </div>
                      </div>

                      {/* Status & Collateral */}
                      <div className="pt-3 border-t border-border/50 space-y-3">
                        {loan.isOwnLoan ? (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Status</p>
                            <Badge 
                              className={`
                                font-semibold px-3 py-1
                                ${loan.status === "ACTIVE" 
                                  ? "bg-primary/15 text-primary border-primary/30 shadow-glow" 
                                  : "bg-secondary text-secondary-foreground border-border"
                                }
                              `}
                            >
                              {loan.status}
                            </Badge>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Your Profit</p>
                            <p className="text-sm font-semibold text-green-500">
                              +{loan.profit.toFixed(4)} ETH
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Collateral</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-semibold text-foreground">{loan.collateralType}</p>
                            <p className="text-xs text-muted-foreground">{(parseFloat(loan.collateralValue) / 1e18).toFixed(4)} ETH</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!loan.isOwnLoan && (
                        <Button
                          className="w-full h-9 mt-4"
                          onClick={() => handleInvest(loan)}
                        >
                          Invest Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
