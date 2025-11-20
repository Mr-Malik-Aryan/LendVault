"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AlertCircle, Plus, X, Loader, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNFTs } from "@/hooks/useNFTs";
import { toast } from "sonner";
import { ethers } from "ethers";

// Smart Contract ABI (only the functions we need)
const LENDVAULT_ABI = [
  "function createLoanOffer(address _nftContract, uint256 _tokenId, uint256 _requestedAmount, uint256 _interestRate, uint256 _duration, uint256 _collateralValue) external returns (uint256)",
  "function getLoanOffer(uint256 _offerId) external view returns (tuple(uint256 offerId, address borrower, address nftContract, uint256 tokenId, uint256 requestedAmount, uint256 interestRate, uint256 duration, uint256 collateralValue, bool isActive, bool isFilled, uint256 createdAt))",
  "function getActiveOffers() external view returns (uint256[])",
  "function getUserOffers(address _user) external view returns (uint256[])",
  "event OfferCreated(uint256 indexed offerId, address indexed borrower, address nftContract, uint256 tokenId, uint256 requestedAmount, uint256 interestRate, uint256 duration)"
];

// ERC721 ABI for NFT approval
const ERC721_ABI = [
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function ownerOf(uint256 tokenId) external view returns (address)"
];

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  duration: number;
  status: string;
  createdAt: string;
}

// Transaction status states
enum TxStatus {
  IDLE = "idle",
  APPROVING = "approving",
  APPROVED = "approved",
  CREATING = "creating",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  ERROR = "error"
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
  
  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.IDLE);
  const [txHash, setTxHash] = useState<string>("");
  const [offerId, setOfferId] = useState<string>("");

  // YOUR DEPLOYED CONTRACT ADDRESS - UPDATE THIS!
  const LENDVAULT_CONTRACT_ADDRESS = "0x899054c1aB95d1b9bf15de16C51E3711564bDe67"; // TODO: Replace with your deployed contract

  // Interest rate options
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

  useEffect(() => {
    if (showLoanForm && user?.walletAddress && nfts.length === 0) {
      fetchNFTs(user.walletAddress, "", network);
    }
  }, [showLoanForm, user?.walletAddress, network]);

  const handleOpenLoanForm = () => {
    setShowLoanForm(true);
    setTxStatus(TxStatus.IDLE);
    setTxHash("");
    setOfferId("");
  };

  const handleCloseLoanForm = () => {
    setShowLoanForm(false);
    setLoanAmount("");
    setInterestRate("5");
    setDuration("30");
    setSelectedNFT(null);
    setTxStatus(TxStatus.IDLE);
    setTxHash("");
    setOfferId("");
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!user?.walletAddress) {
      toast.error("User wallet address not found. Please reconnect your wallet.");
      return;
    }
    if (!loanAmount || loanAmount === "0") {
      toast.error("Please enter a valid loan amount");
      return;
    }
    
    // Validate it's a valid number
    try {
      BigInt(loanAmount);
    } catch {
      toast.error("Please enter a valid wei amount (must be a number)");
      return;
    }
    
    if (!selectedNFT) {
      toast.error("Please select an NFT as collateral");
      return;
    }
    if (!selectedNFT.tokenId || !selectedNFT.contractAddress) {
      toast.error("Selected NFT is missing required information");
      return;
    }

    // Get collateral value in Wei (NFT attributes now store Wei values)
    const collateralValueWei = BigInt(
      selectedNFT.metadata.attributes?.[0]?.value || "0"
    );

    if (collateralValueWei === BigInt(0)) {
      toast.error("Selected NFT must have a value attribute");
      return;
    }

    // Calculate max loan amount (80% LTV) - all in Wei
    const loanAmountWei = BigInt(loanAmount);
    const maxLoanAmountWei = (collateralValueWei * BigInt(80)) / BigInt(100); // 80% LTV

    if (loanAmountWei > maxLoanAmountWei) {
      toast.error(
        `Loan amount cannot exceed 80% of collateral value. Maximum: ${maxLoanAmountWei.toString()} Wei`
      );
      return;
    }

    setSubmitting(true);
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to create a loan");
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Verify user is on correct network (Sepolia)
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      console.log("Current chain ID:", chainId);
      
      if (chainId !== 11155111) { // Sepolia chain ID
        toast.error(`Wrong network detected. Please switch to Sepolia testnet in MetaMask.`);
        
        // Attempt to switch to Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
          });
          toast.success("Switched to Sepolia! Please try again.");
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0xaa36a7',
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: {
                      name: 'Sepolia ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['https://sepolia.infura.io/v3/'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                  },
                ],
              });
              toast.success("Sepolia network added! Please try again.");
            } catch (addError) {
              toast.error("Failed to add Sepolia network. Please add it manually in MetaMask.");
            }
          } else {
            toast.error("Failed to switch network. Please switch to Sepolia manually in MetaMask.");
          }
        }
        setSubmitting(false);
        return;
      }

      // Step 1: Approve NFT transfer
      setTxStatus(TxStatus.APPROVING);
      toast.info("Step 1/2: Approving NFT transfer...");
      
      const nftContract = new ethers.Contract(
        selectedNFT.contractAddress,
        ERC721_ABI,
        signer
      );

      // Check if already approved
      const approvedAddress = await nftContract.getApproved(selectedNFT.tokenId);
      
      if (approvedAddress.toLowerCase() !== LENDVAULT_CONTRACT_ADDRESS.toLowerCase()) {
        const approveTx = await nftContract.approve(
          LENDVAULT_CONTRACT_ADDRESS,
          selectedNFT.tokenId
        );
        
        toast.info("Waiting for approval confirmation...");
        await approveTx.wait();
        toast.success("NFT approved! ");
      } else {
        toast.success("NFT already approved! ");
      }

      setTxStatus(TxStatus.APPROVED);

      // Step 2: Create loan offer on smart contract
      setTxStatus(TxStatus.CREATING);
      toast.info("Step 2/2: Creating loan offer on blockchain...");

      const lendVaultContract = new ethers.Contract(
        LENDVAULT_CONTRACT_ADDRESS,
        LENDVAULT_ABI,
        signer
      );

      // Convert values to proper formats
      const requestedAmountWei = BigInt(loanAmount); // Already in Wei
      const collateralValueWeiForContract = collateralValueWei; // Already in Wei from NFT attributes
      const interestRateBps = parseInt(interestRate) * 100; // Convert to basis points (5% = 500)
      const durationSeconds = parseInt(duration) * 24 * 60 * 60;

      console.log("Creating loan offer with params:", {
        nftContract: selectedNFT.contractAddress,
        tokenId: selectedNFT.tokenId,
        requestedAmount: loanAmount + " Wei",
        interestRate: interestRateBps + " bps",
        duration: durationSeconds + " seconds",
        collateralValue: collateralValueWeiForContract.toString() + " Wei"
      });

      // Create loan offer transaction
      const createTx = await lendVaultContract.createLoanOffer(
        selectedNFT.contractAddress,
        selectedNFT.tokenId,
        requestedAmountWei,
        interestRateBps,
        durationSeconds,
        collateralValueWeiForContract
      );

      setTxHash(createTx.hash);
      setTxStatus(TxStatus.CONFIRMING);
      toast.info("Transaction submitted! Waiting for confirmation...");

      // Wait for transaction confirmation
      const receipt = await createTx.wait();
      
      // Extract offerId from event logs
      const offerCreatedEvent = receipt.logs
        .map((log: any) => {
          try {
            return lendVaultContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event && event.name === "OfferCreated");

      const createdOfferId = offerCreatedEvent?.args?.offerId?.toString() || "0";
      setOfferId(createdOfferId);

      console.log("Loan offer created! Offer ID:", createdOfferId);
      console.log("Transaction hash:", receipt.hash);

      setTxStatus(TxStatus.SUCCESS);
      toast.success("Loan offer created successfully");

      // Step 3: Save to database
      const dueDate = new Date(Date.now() + durationSeconds * 1000);
      
      const loanData = {
        walletAddress: user?.walletAddress,
        amount: loanAmount, // Already in Wei
        interestRate: interestRate,
        duration: durationSeconds.toString(),
        collateralType: "NFT",
        collateralId: selectedNFT.tokenId.toString(),
        collateralValue: collateralValueWeiForContract.toString(), // In Wei
        dueDate: dueDate.toISOString(),
        collateralContractAddress: selectedNFT.contractAddress,
        network: "sepolia",
        txHash: receipt.hash,
        offerId: createdOfferId,
        contractAddress: LENDVAULT_CONTRACT_ADDRESS
      };

      const response = await fetch('/api/loans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.warn("Database save failed:", data);
        toast.warning("Loan created on blockchain but failed to save to database");
      } else {
        toast.success("Loan saved to database!");
      }
      
      // Wait 2 seconds to show success state, then close
      setTimeout(() => {
        handleCloseLoanForm();
        
        // Refresh loans list
        fetch(`/api/loans?walletAddress=${user?.walletAddress}`)
          .then(res => res.json())
          .then(data => setLoans(data.borrowedLoans || []))
          .catch(err => console.error("Failed to refresh loans:", err));
      }, 2000);

    } catch (err: any) {
      console.error("Error creating loan:", err);
      setTxStatus(TxStatus.ERROR);
      
      if (err.code === 4001) {
        toast.error("Transaction rejected by user");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        toast.error("Insufficient funds for gas fees");
      } else if (err.message?.includes("user rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(err.message || "Failed to create loan offer");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Small helper to format large Wei numbers with commas for readability
  const formatWei = (raw: string | number) => {
    try {
      const s = String(raw ?? "0");
      const digits = s.replace(/[^0-9]/g, "") || "0";
      return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch {
      return String(raw);
    }
  };

  // Get status message based on transaction status
  const getStatusMessage = () => {
    switch (txStatus) {
      case TxStatus.APPROVING:
        return "Approving NFT transfer...";
      case TxStatus.APPROVED:
        return "NFT approved! Creating loan offer...";
      case TxStatus.CREATING:
        return "Creating loan offer on blockchain...";
      case TxStatus.CONFIRMING:
        return "Waiting for blockchain confirmation...";
      case TxStatus.SUCCESS:
        return "Loan offer created successfully!";
      case TxStatus.ERROR:
        return "Transaction failed";
      default:
        return "Submit Loan Request";
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
                You haven't created any loan requests yet. Click "Request Loan" to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.map((loan: any) => (
                <div key={loan.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-foreground font-mono">
                      {loan.amount} Wei
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
                      <span className="text-foreground font-medium font-mono">{loan.collateralValue} Wei</span>
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
                        if (loan.txHash) {
                          window.open(`https://sepolia.etherscan.io/tx/${loan.txHash}`, '_blank');
                        } else {
                          toast.info("View loan details coming soon!");
                        }
                      }}
                    >
                      View on Etherscan
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
                    disabled={submitting}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Transaction Status Banner */}
                {txStatus !== TxStatus.IDLE && txStatus !== TxStatus.ERROR && (
                  <div className="bg-primary/10 border-b border-primary/20 p-4">
                    <div className="flex items-center gap-3">
                      {txStatus === TxStatus.SUCCESS ? (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <Loader className="w-5 h-5 animate-spin text-primary shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{getStatusMessage()}</p>
                        {txHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View on Etherscan →
                          </a>
                        )}
                        {offerId && (
                          <p className="text-xs text-muted-foreground">Offer ID: {offerId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                      Loan Amount (Wei) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring outline-none font-mono"
                      placeholder="Enter amount in Wei (e.g., 1000000000000000000 = 1 ETH)"
                      required
                      disabled={submitting}
                    />
                    {selectedNFT && (
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Maximum loan amount: {(() => {
                          console.log(selectedNFT)
                          const nftValueWei = BigInt(
                            selectedNFT.metadata.attributes?.[0]?.value || "0"
                          );
                          return ((nftValueWei * BigInt(80)) / BigInt(100)).toString();
                        })()} Wei (80% of collateral value)
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
                          } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="interestRate"
                              value={option.rate}
                              checked={interestRate === option.rate}
                              onChange={(e) => setInterestRate(e.target.value)}
                              className="w-4 h-4 text-primary"
                              disabled={submitting}
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
                      💡 Higher interest rates typically get funded faster
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
                      disabled={submitting}
                    >
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
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
                        <p className="text-muted-foreground mb-3">No NFTs found on Sepolia</p>
                        <Button
                          type="button"
                          onClick={() => fetchNFTs(user?.walletAddress || "", "", "sepolia")}
                          variant="outline"
                          disabled={submitting}
                        >
                          Refresh NFTs
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
                        {nfts.map((nft, index) => {
                          const valueAttribute = nft.metadata.attributes?.[0]?.value|| 0;
                          // NFT metadata value is stored in Wei
                          const weiValue = valueAttribute
                          const formattedWei = formatWei(weiValue);
                          const isSelected = selectedNFT?.tokenId === nft.tokenId && selectedNFT?.contractAddress === nft.contractAddress;
                          
                          return (
                            <div
                              key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
                              onClick={() => !submitting && setSelectedNFT(nft)}
                              className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                                isSelected
                                  ? "border-primary shadow-lg shadow-primary/20"
                                  : "border-border hover:border-primary/50"
                              } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
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
                                <p className="text-gray-400 text-xs">{formattedWei} Wei</p>
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
                            Value: {(() => {
                              const v = selectedNFT.metadata.attributes?.[0]?.value || 0;
                              return `${formatWei(String(v))} Wei`;
                            })()}
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
                          {getStatusMessage()}
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