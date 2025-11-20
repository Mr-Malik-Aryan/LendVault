"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AlertCircle, Plus, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNFTs } from "@/hooks/useNFTs";
import { toast } from "sonner";

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
  const [showLoanForm, setShowLoanForm] = useState(false);
  const { nfts, loading: nftsLoading, fetchNFTs } = useNFTs();
  const [network, setNetwork] = useState("sepolia");
  
  // Form state
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("5");
  const [duration, setDuration] = useState("30");
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Interest rate options with approval time estimates
  const interestRateOptions = [
    { rate: "5", label: "5% APR", approvalTime: "Slower approval (~2-3 days)" },
    { rate: "10", label: "10% APR", approvalTime: "Moderate approval (~1-2 days)" },
    { rate: "15", label: "15% APR", approvalTime: "Fast approval (~12-24 hours)" },
    { rate: "20", label: "20% APR", approvalTime: "Very fast approval (~6-12 hours)" },
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoansLoading(true);
        const response = await fetch(`/api/loans?walletAddress=${user?.walletAddress}`);
        if (!response.ok) throw new Error('Failed to fetch loans');
        const data = await response.json();
        setLoans(data.borrowedLoans || []);
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

  // Fetch NFTs when form is opened
  useEffect(() => {
    if (showLoanForm && user?.walletAddress && nfts.length === 0) {
      fetchNFTs(user.walletAddress, "", network);
    }
  }, [showLoanForm, user?.walletAddress, network]);

  const handleOpenLoanForm = () => {
    setShowLoanForm(true);
  };

  const handleCloseLoanForm = () => {
    setShowLoanForm(false);
    setLoanAmount("");
    setInterestRate("5");
    setDuration("30");
    setSelectedNFT(null);
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!user?.walletAddress) {
      toast.error("User wallet address not found. Please reconnect your wallet.");
      return;
    }
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      toast.error("Please enter a valid loan amount");
      return;
    }
    if (!selectedNFT) {
      toast.error("Please select an NFT as collateral");
      return;
    }

    // Validate selectedNFT has required fields
    console.log("Selected NFT full object:", JSON.stringify(selectedNFT, null, 2));
    
    if (!selectedNFT.tokenId || selectedNFT.tokenId === 'undefined' || !selectedNFT.contractAddress) {
      toast.error("Selected NFT is missing required information (tokenId or contractAddress)");
      console.error("Invalid NFT selected:", selectedNFT);
      console.error("TokenId:", selectedNFT.tokenId);
      console.error("ContractAddress:", selectedNFT.contractAddress);
      return;
    }
    console.log("Selected NFT for collateral:", selectedNFT);
    // Get collateral value
    const collateralValue = parseFloat(
      selectedNFT.metadata.attributes?.find((attr: any) => 
        attr.trait_type?.toLowerCase().includes('value') || 
        attr.trait_type?.toLowerCase().includes('rarity')
      )?.value || "0"
    );

    if (collateralValue === 0) {
      toast.error("Selected NFT must have a value attribute");
      return;
    }

    // Validate 80% LTV
    const loanAmountFloat = parseFloat(loanAmount);
    const maxLoanAmount = collateralValue * 0.8;

    if (loanAmountFloat > maxLoanAmount) {
      toast.error(
        `Loan amount cannot exceed 80% of collateral value. Maximum: ${maxLoanAmount.toFixed(4)} ETH`
      );
      return;
    }

    setSubmitting(true);
    
    try {
      // Calculate due date
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60;
      const dueDate = new Date(Date.now() + durationInSeconds * 1000);
      
      // Ensure tokenId is a string
      const collateralId = String(selectedNFT.tokenId);
      
      const loanData = {
        walletAddress: user?.walletAddress,
        amount: loanAmount,
        interestRate: interestRate,
        duration: durationInSeconds.toString(),
        collateralType: "NFT",
        collateralId: collateralId,
        collateralValue: collateralValue.toString(),
        dueDate: dueDate.toISOString(),
        collateralContractAddress: selectedNFT.contractAddress,
        network: network,
      };

      console.log("Creating loan with data:", JSON.stringify(loanData, null, 2));
      console.log("User data:", user);
      console.log("Selected NFT:", selectedNFT);
      console.log("Collateral value:", collateralValue);
      
      const response = await fetch('/api/loans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      });

      const data = await response.json();
      
      console.log("Loan creation response:", JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error("Loan creation failed:", data);
        throw new Error(data.error || data.details || 'Failed to create loan');
      }
      
      toast.success("Loan request created successfully!");
      handleCloseLoanForm();
      
      // Refresh loans list
      const loansResponse = await fetch(`/api/loans?walletAddress=${user?.walletAddress}`);
      if (loansResponse.ok) {
        const loansData = await loansResponse.json();
        setLoans(loansData.borrowedLoans || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create loan request");
    } finally {
      setSubmitting(false);
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
        <div className="max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">My Loan Requests</h1>
              <p className="text-muted-foreground">
                View and manage your active loan requests and agreements.
              </p>
            </div>
            <Button 
              onClick={handleOpenLoanForm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Request Loan
            </Button>
          </div>

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
              {loans.map((loan: any) => (
                <div key={loan.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      {loan.amount} ETH
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      loan.status === 'ACTIVE' ? 'bg-primary/10 text-primary' :
                      loan.status === 'REPAID' ? 'bg-green-500/10 text-green-500' :
                      loan.status === 'DEFAULTED' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <span className="text-foreground font-medium">{loan.interestRate}% APR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-foreground font-medium">{Math.floor(loan.duration / (24 * 60 * 60))} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collateral:</span>
                      <span className="text-foreground font-medium font-mono">#{loan.collateralId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collateral Value:</span>
                      <span className="text-foreground font-medium">{loan.collateralValue} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="text-foreground font-medium">
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // TODO: Implement view details
                        toast.info("View loan details coming soon!");
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loan Request Form Modal */}
          {showLoanForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-foreground">Request a Loan</h2>
                  <button
                    onClick={handleCloseLoanForm}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmitLoan} className="p-6 space-y-6">
                  {/* Wallet Address Display */}
                  <div className="bg-secondary/50 border border-border rounded-lg p-4">
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      Your Wallet Address
                    </label>
                    <div className="font-mono text-sm text-foreground break-all">
                      {user?.walletAddress}
                    </div>
                  </div>

                  {/* Loan Amount */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Loan Amount (ETH) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring outline-none"
                      placeholder="Enter amount in ETH"
                      required
                    />
                    {selectedNFT && (
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Maximum loan amount: {(parseFloat(
                          selectedNFT.metadata.attributes?.find((attr: any) => 
                            attr.trait_type?.toLowerCase().includes('value') || 
                            attr.trait_type?.toLowerCase().includes('rarity')
                          )?.value || "0"
                        ) * 0.8).toFixed(4)} ETH (80% of collateral value)
                      </p>
                    )}
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Interest Rate (APR) <span className="text-destructive">*</span>
                    </label>
                    <div className="space-y-3">
                      {interestRateOptions.map((option) => (
                        <label
                          key={option.rate}
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                            interestRate === option.rate
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="interestRate"
                              value={option.rate}
                              checked={interestRate === option.rate}
                              onChange={(e) => setInterestRate(e.target.value)}
                              className="w-4 h-4 text-primary"
                            />
                            <div>
                              <p className="font-semibold text-foreground">{option.label}</p>
                              <p className="text-sm text-muted-foreground">{option.approvalTime}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Higher interest rates typically get funded faster as they're more attractive to lenders
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Loan Duration (Days) <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring outline-none"
                      required
                    >
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
                    </select>
                  </div>

                  {/* Network Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Network <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring outline-none"
                    >
                      <option value="sepolia">Sepolia Testnet</option>
                      <option value="goerli">Goerli Testnet</option>
                      <option value="mumbai">Mumbai (Polygon Testnet)</option>
                      <option value="hardhat">Hardhat (Local)</option>
                    </select>
                  </div>

                  {/* NFT Collateral Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select NFT Collateral <span className="text-destructive">*</span>
                    </label>
                    
                    {nftsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted-foreground">Loading your NFTs...</span>
                      </div>
                    ) : nfts.length === 0 ? (
                      <div className="bg-secondary/50 border border-border rounded-lg p-6 text-center">
                        <p className="text-muted-foreground mb-3">No NFTs found on this network</p>
                        <Button
                          type="button"
                          onClick={() => fetchNFTs(user?.walletAddress || "", "", network)}
                          variant="outline"
                        >
                          Refresh NFTs
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
                        {nfts.map((nft, index) => {
                          const valueAttribute = nft.metadata.attributes?.find((attr: any) => 
                            attr.trait_type?.toLowerCase().includes('value') || 
                            attr.trait_type?.toLowerCase().includes('rarity')
                          );
                          const ethValue = valueAttribute?.value || '0';
                          const isSelected = selectedNFT?.tokenId === nft.tokenId && selectedNFT?.contractAddress === nft.contractAddress;
                          
                          return (
                            <div
                              key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
                              onClick={() => setSelectedNFT(nft)}
                              className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                                isSelected
                                  ? "border-primary shadow-lg shadow-primary/20"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {nft.image ? (
                                <div className="w-full h-32 bg-secondary overflow-hidden">
                                  <img
                                    src={nft.image}
                                    alt={nft.metadata.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-32 bg-secondary flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">No Image</span>
                                </div>
                              )}
                              <div className="bg-black p-2">
                                <p className="text-white text-xs font-semibold truncate">
                                  {nft.metadata.name || `#${nft.tokenId}`}
                                </p>
                                <p className="text-gray-400 text-xs">{ethValue} ETH</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected NFT Summary */}
                  {selectedNFT && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Selected Collateral</h4>
                      <div className="flex items-center gap-3">
                        {selectedNFT.image && (
                          <img
                            src={selectedNFT.image}
                            alt={selectedNFT.metadata.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{selectedNFT.metadata.name}</p>
                          <p className="text-sm text-muted-foreground">Token ID: {selectedNFT.tokenId}</p>
                          <p className="text-sm text-primary font-semibold">
                            Value: {selectedNFT.metadata.attributes?.find((attr: any) => 
                              attr.trait_type?.toLowerCase().includes('value') || 
                              attr.trait_type?.toLowerCase().includes('rarity')
                            )?.value || '0'} ETH
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleCloseLoanForm}
                      variant="outline"
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      disabled={submitting || !selectedNFT}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        "Submit Loan Request"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
