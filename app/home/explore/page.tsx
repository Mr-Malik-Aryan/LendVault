"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ethers } from "ethers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Loader } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InvestModal } from "@/components/Investment";

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
  collateralImageUrl?: string | null;
  status: string;
  dueDate: string;
  createdAt: string;
  txHash: string;
  contractAddress: string;
  offerId: string | null;
  loanId: string | null;
  ltvRatio: number;
  borrower: {
    id: string;
    username: string;
    walletAddress: string;
    reputation: number;
  };
  lender?: {
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
  
  // Investment modal state
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [liquidatingLoanId, setLiquidatingLoanId] = useState<string | null>(null);

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

  const handleInvest = (loan: Loan) => {
    if (loan.isOwnLoan) {
      toast.error("You cannot invest in your own loan");
      return;
    }
    setSelectedLoan(loan);
    setShowInvestModal(true);
  };

  const handleInvestSuccess = () => {
    // Refresh loans list after successful investment
    fetchLoans();
    setShowInvestModal(false);
    setSelectedLoan(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isCurrentUserLender = (loan: Loan) => {
    return loan.lender?.walletAddress?.toLowerCase() === user?.walletAddress?.toLowerCase();
  };

  const isLoanOverdue = (loan: Loan) => {
    const dueDate = new Date(loan.dueDate);
    const now = new Date();
    return now > dueDate && loan.status === "FUNDED";
  };

  const handleLiquidate = async (loan: Loan) => {
    if (!isCurrentUserLender(loan)) {
      toast.error("Only the lender can liquidate this loan");
      return;
    }

    if (!isLoanOverdue(loan)) {
      toast.error("This loan is not yet overdue");
      return;
    }

    if (!loan.loanId) {
      toast.error("Blockchain loan ID not found. This loan may not have been funded yet on the blockchain.");
      console.error("Missing blockchain loan ID for loan:", {
        databaseId: loan.id,
        status: loan.status,
        offerId: loan.offerId
      });
      return;
    }

    setLiquidatingLoanId(loan.id);

    try {
      // Check MetaMask
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to liquidate");
      }

      toast.info("Connecting to wallet...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Verify network (Sepolia)
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== 11155111) {
        toast.error("Please switch to Sepolia testnet in MetaMask");
        setLiquidatingLoanId(null);
        return;
      }

      // Get contract address
      const contractAddress = loan.contractAddress || process.env.NEXT_PUBLIC_LENDVAULT_CONTRACT_ADDRESS;
      
      if (!contractAddress) {
        throw new Error("Contract address not available");
      }

      // Create contract instance
      const LENDVAULT_ABI = [
        "function liquidateLoan(uint256 _loanId) external",
        "function getLoan(uint256 _loanId) external view returns (tuple(uint256 loanId, uint256 offerId, address borrower, address lender, address nftContract, uint256 tokenId, uint256 loanAmount, uint256 interestRate, uint256 startTime, uint256 duration, uint256 dueDate, uint8 status))",
        "event LoanLiquidated(uint256 indexed loanId, address indexed lender, address nftContract, uint256 tokenId)"
      ];

      const lendVaultContract = new ethers.Contract(
        contractAddress,
        LENDVAULT_ABI,
        signer
      );

      const blockchainLoanId = loan.loanId;

      console.log("Attempting to liquidate loan:", {
        databaseLoanId: loan.id,
        blockchainLoanId: blockchainLoanId,
        loanStatus: loan.status,
        dueDate: loan.dueDate,
        isOverdue: new Date() > new Date(loan.dueDate)
      });

      // Verify loan status on blockchain
      toast.info("Verifying loan status on blockchain...");
      
      try {
        const loanDetails = await lendVaultContract.getLoan(blockchainLoanId);
        
        console.log("Loan details from blockchain:", {
          loanId: loanDetails.loanId.toString(),
          borrower: loanDetails.borrower,
          lender: loanDetails.lender,
          dueDate: new Date(Number(loanDetails.dueDate) * 1000).toLocaleString(),
          status: loanDetails.status,
          statusType: typeof loanDetails.status,
          statusNumber: Number(loanDetails.status)
        });

        // Status: 0 = Active, 1 = Repaid, 2 = Liquidated
        // Convert status to number for comparison
        const statusNum = Number(loanDetails.status);
        
        if (statusNum === 1) {
          toast.error(`This loan has already been repaid`);
          console.log("Loan status is REPAID (1)");
          setLiquidatingLoanId(null);
          return;
        }
        
        if (statusNum === 2) {
          toast.error(`This loan has already been liquidated`);
          console.log("Loan status is LIQUIDATED (2)");
          setLiquidatingLoanId(null);
          return;
        }
        
        if (statusNum !== 0) {
          toast.error(`Cannot liquidate: Unexpected loan status (${statusNum})`);
          console.error("Unexpected loan status:", statusNum);
          setLiquidatingLoanId(null);
          return;
        }

        // Check if overdue on blockchain
        const now = Math.floor(Date.now() / 1000);
        const dueDateTimestamp = Number(loanDetails.dueDate);
        
        if (now <= dueDateTimestamp) {
          toast.error("This loan is not yet overdue on the blockchain");
          setLiquidatingLoanId(null);
          return;
        }

      } catch (error) {
        console.error("Error fetching loan details:", error);
        toast.error("Failed to verify loan on blockchain");
        setLiquidatingLoanId(null);
        return;
      }

      // Liquidate the loan
      toast.info("Liquidating loan... Please confirm in MetaMask");

      console.log("Liquidating loan with ID:", blockchainLoanId);

      const liquidateTx = await lendVaultContract.liquidateLoan(blockchainLoanId);

      toast.info("Transaction submitted! Waiting for confirmation...");
      console.log("Transaction hash:", liquidateTx.hash);

      // Wait for confirmation
      const receipt = await liquidateTx.wait();

      console.log("Loan liquidated successfully!");
      console.log("Block number:", receipt.blockNumber);

      toast.success("Loan liquidated successfully! NFT transferred to your wallet 🎉");

      // Update database
      try {
        const updateResponse = await fetch('/api/loans/liquidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanId: loan.id,
            lenderAddress: user?.walletAddress,
            txHash: receipt.hash
          })
        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          console.warn("Database update failed:", updateData);
          toast.warning("Loan liquidated on blockchain but database update failed");
        } else {
          toast.success("Database updated! You now own the collateral NFT.");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        toast.warning("Loan liquidated but failed to update database");
      }

      // Refresh loans list
      setTimeout(() => {
        fetchLoans();
      }, 2000);

    } catch (err: any) {
      console.error("Error liquidating loan:", err);

      if (err.code === 4001) {
        toast.error("Transaction rejected by user");
      } else if (err.message?.includes("user rejected")) {
        toast.error("Transaction rejected by user");
      } else if (err.message?.includes("Loan not overdue")) {
        toast.error("Cannot liquidate: loan is not yet overdue");
      } else if (err.message?.includes("Only lender can liquidate")) {
        toast.error("Only the lender can liquidate this loan");
      } else {
        toast.error(err.message || "Failed to liquidate loan");
      }
    } finally {
      setLiquidatingLoanId(null);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse flex flex-col">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="group relative w-full rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:scale-[1.02]"
                  >
                    {/* Background Image with Overlay */}
                    {loan.collateralImageUrl && (
                      <div className="absolute inset-0">
                        <img
                          src={loan.collateralImageUrl}
                          alt={`${loan.collateralType} NFT`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/60 backdrop-blur-sm" />
                      </div>
                    )}
                    
                    {/* Fallback gradient if no image */}
                    {!loan.collateralImageUrl && (
                      <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-secondary" />
                    )}
                    
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
                    
                    <div className="relative p-6 space-y-5">
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
                        {/* Status - Show for all loans */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Status</p>
                          <Badge 
                            className={`
                              font-semibold px-3 py-1
                              ${loan.status === "ACTIVE" 
                                ? "bg-primary/15 text-primary border-primary/30 shadow-glow" 
                                : loan.status === "FUNDED"
                                ? "bg-green-500/15 text-green-500 border-green-500/30"
                                : loan.status === "REPAID"
                                ? "bg-blue-500/15 text-blue-500 border-blue-500/30"
                                : "bg-secondary text-secondary-foreground border-border"
                              }
                            `}
                          >
                            {loan.status}
                          </Badge>
                        </div>

                        {/* Funded By - Show for funded loans */}
                        {loan.status === "FUNDED" && loan.lender && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Funded By</p>
                            {isCurrentUserLender(loan) ? (
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-primary">You</p>
                                <Badge variant="outline" className="text-xs">Lender</Badge>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm font-semibold text-foreground">{loan.lender.username}</p>
                                <p className="text-xs font-mono text-muted-foreground">
                                  {formatWalletAddress(loan.lender.walletAddress)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Overdue Warning - Show for funded overdue loans */}
                        {isLoanOverdue(loan) && (
                          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-destructive">LOAN OVERDUE</p>
                                <p className="text-xs text-destructive/80">
                                  {isCurrentUserLender(loan) ? "You can now liquidate this loan" : "This loan is past due date"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Profit - Only show for non-own loans that are ACTIVE */}
                        {!loan.isOwnLoan && loan.status === "ACTIVE" && (
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
                        loan.status === "FUNDED" ? (
                          isCurrentUserLender(loan) && isLoanOverdue(loan) ? (
                            <Button
                              className="w-full h-9 mt-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              onClick={() => handleLiquidate(loan)}
                              disabled={liquidatingLoanId === loan.id}
                            >
                              {liquidatingLoanId === loan.id ? (
                                <span className="flex items-center gap-2">
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Liquidating...
                                </span>
                              ) : (
                                "Liquidate Loan"
                              )}
                            </Button>
                          ) : (
                            <Button
                              className="w-full h-9 mt-4"
                              disabled
                              variant="outline"
                            >
                              {isCurrentUserLender(loan) ? "Funded by You" : "Funded"}
                            </Button>
                          )
                        ) : loan.status === "ACTIVE" ? (
                          <Button
                            className="w-full h-9 mt-4"
                            onClick={() => handleInvest(loan)}
                          >
                            Invest Now
                          </Button>
                        ) : (
                          <Button
                            className="w-full h-9 mt-4"
                            disabled
                            variant="outline"
                          >
                            {loan.status}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Investment Modal */}
      {showInvestModal && selectedLoan && (
        <InvestModal
          loan={selectedLoan}
          onClose={() => {
            setShowInvestModal(false);
            setSelectedLoan(null);
          }}
          onSuccess={handleInvestSuccess}
          currentUserAddress={user?.walletAddress}
        />
      )}
    </div>
  );
}
