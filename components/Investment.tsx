"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";

// Get contract address from environment variable
const LENDVAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LENDVAULT_CONTRACT_ADDRESS;

if (!LENDVAULT_CONTRACT_ADDRESS) {
  throw new Error("NEXT_PUBLIC_LENDVAULT_CONTRACT_ADDRESS is not set in environment variables");
}

// Smart Contract ABI for lender functions
const LENDVAULT_ABI = [
  "function fundLoanOffer(uint256 _offerId) external payable",
  "function getLoanOffer(uint256 _offerId) external view returns (tuple(uint256 offerId, address borrower, address nftContract, uint256 tokenId, uint256 requestedAmount, uint256 interestRate, uint256 duration, uint256 collateralValue, bool isActive, bool isFilled, uint256 createdAt))",
  "event LoanFunded(uint256 indexed loanId, uint256 indexed offerId, address indexed lender, address borrower, uint256 amount)"
];

interface LoanOffer {
  id: string;
  borrowerId: string;
  borrower: {
    username: string;
    walletAddress: string;
  };
  amount: string;
  interestRate: string;
  duration: number;
  collateralType: string;
  collateralId: string;
  collateralValue: string;
  ltvRatio: number;
  status: string;
  dueDate: string;
  txHash: string;
  contractAddress: string;
  offerId: string | null; // ✅ BLOCKCHAIN OFFER ID
  createdAt: string;
}

interface InvestModalProps {
  loan: LoanOffer;
  onClose: () => void;
  onSuccess: () => void;
  currentUserAddress?: string;
}

enum TxStatus {
  IDLE = "idle",
  CHECKING = "checking",
  FUNDING = "funding",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  ERROR = "error"
}

export function InvestModal({ loan, onClose, onSuccess, currentUserAddress }: InvestModalProps) {
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.IDLE);
  const [txHash, setTxHash] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Calculate investment details
  const loanAmountWei = BigInt(loan.amount);
  const loanAmountEth = Number(ethers.formatEther(loanAmountWei));
  const interestRatePercent = parseFloat(loan.interestRate);
  const durationDays = Math.floor(loan.duration / (24 * 60 * 60));
  const collateralValueWei = BigInt(loan.collateralValue);
  const collateralValueEth = Number(ethers.formatEther(collateralValueWei));
  
  // Calculate expected return
  const yearlyInterest = loanAmountEth * (interestRatePercent / 100);
  const dailyInterest = yearlyInterest / 365;
  const totalInterest = dailyInterest * durationDays;
  const totalReturn = loanAmountEth + totalInterest;

  // Format Wei with commas
  const formatWei = (wei: string) => {
    return wei.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleInvest = async () => {
    if (!currentUserAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if user is trying to fund their own loan (database check)
    if (loan.borrower.walletAddress.toLowerCase() === currentUserAddress.toLowerCase()) {
      toast.error("You cannot fund your own loan offer");
      console.error("User trying to fund own loan:", {
        borrower: loan.borrower.walletAddress,
        currentUser: currentUserAddress
      });
      return;
    }

    // ✅ CRITICAL: Check if offerId exists
    if (!loan.offerId) {
      toast.error("This loan is missing blockchain offer ID. Cannot fund.");
      console.error("Loan missing offerId:", loan);
      return;
    }

    setSubmitting(true);

    try {
      // Check MetaMask
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to invest");
      }

      setTxStatus(TxStatus.CHECKING);
      toast.info("Checking wallet and network...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Verify network (Sepolia)
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== 11155111) {
        toast.error("Please switch to Sepolia testnet in MetaMask");
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
          toast.success("Switched to Sepolia! Please try again.");
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://sepolia.infura.io/v3/'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }],
              });
            } catch (addError) {
              toast.error("Failed to add Sepolia network");
            }
          }
        }
        setSubmitting(false);
        return;
      }

      // Check balance
      const balance = await provider.getBalance(currentUserAddress);
      if (balance < loanAmountWei) {
        toast.error(`Insufficient balance. You need at least ${ethers.formatEther(loanAmountWei)} ETH`);
        setSubmitting(false);
        return;
      }

      // Get contract - use contract address from loan data, fallback to constant
      const contractAddress = loan.contractAddress || LENDVAULT_CONTRACT_ADDRESS;
      
      if (!contractAddress) {
        throw new Error("Contract address not available");
      }
      
      console.log("Using contract address:", contractAddress);
      
      const lendVaultContract = new ethers.Contract(
        contractAddress,
        LENDVAULT_ABI,
        signer
      );

      // ✅ Use the offerId from the loan data
      const offerId = loan.offerId;

      // Verify loan offer is still active
      setTxStatus(TxStatus.CHECKING);
      toast.info("Verifying loan offer on blockchain...");

      console.log("Fetching offer details for offerId:", offerId);

      try {
        const offerDetails = await lendVaultContract.getLoanOffer(offerId);
        
        console.log("Offer details from blockchain:", {
          offerId: offerDetails.offerId.toString(),
          borrower: offerDetails.borrower,
          isActive: offerDetails.isActive,
          isFilled: offerDetails.isFilled,
          requestedAmount: offerDetails.requestedAmount.toString()
        });
        
        // Double-check borrower address from blockchain
        if (offerDetails.borrower.toLowerCase() === currentUserAddress.toLowerCase()) {
          toast.error("You cannot fund your own loan offer (verified on blockchain)");
          console.error("Borrower address from blockchain matches current user:", {
            borrower: offerDetails.borrower,
            currentUser: currentUserAddress
          });
          setSubmitting(false);
          return;
        }
        
        if (!offerDetails.isActive) {
          toast.error("This loan offer is no longer active on the blockchain");
          setSubmitting(false);
          return;
        }

        if (offerDetails.isFilled) {
          toast.error("This loan offer has already been funded by another lender");
          setSubmitting(false);
          return;
        }

        // Verify the amount matches
        if (offerDetails.requestedAmount.toString() !== loanAmountWei.toString()) {
          toast.error("Loan amount mismatch between database and blockchain");
          console.error("Amount mismatch:", {
            database: loanAmountWei.toString(),
            blockchain: offerDetails.requestedAmount.toString()
          });
          setSubmitting(false);
          return;
        }

      } catch (error) {
        console.error("Error fetching offer details:", error);
        toast.error("Failed to verify loan offer on blockchain. The offer may not exist.");
        setSubmitting(false);
        return;
      }

      // Fund the loan offer
      setTxStatus(TxStatus.FUNDING);
      toast.info("Funding loan offer... Please confirm in MetaMask");

      console.log("Funding loan with:", {
        offerId: offerId,
        amount: ethers.formatEther(loanAmountWei) + " ETH",
        amountWei: loanAmountWei.toString(),
        contractAddress: contractAddress
      });

      const fundTx = await lendVaultContract.fundLoanOffer(offerId, {
        value: loanAmountWei
      });

      setTxHash(fundTx.hash);
      setTxStatus(TxStatus.CONFIRMING);
      toast.info("Transaction submitted! Waiting for confirmation...");

      // Wait for confirmation
      const receipt = await fundTx.wait();

      console.log("Loan funded successfully!");
      console.log("Transaction hash:", receipt.hash);
      console.log("Block number:", receipt.blockNumber);

      // Extract loanId from LoanFunded event
      let blockchainLoanId = null;
      try {
        const loanFundedEvent = receipt.logs
          .map((log: any) => {
            try {
              return lendVaultContract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((event: any) => event && event.name === "LoanFunded");

        if (loanFundedEvent) {
          blockchainLoanId = loanFundedEvent.args?.loanId?.toString();
          console.log("Blockchain Loan ID extracted:", blockchainLoanId);
        } else {
          console.warn("LoanFunded event not found in receipt logs");
        }
      } catch (eventError) {
        console.error("Error extracting loanId from event:", eventError);
      }

      setTxStatus(TxStatus.SUCCESS);
      toast.success("Loan funded successfully! 🎉");

      // Update database
      try {
        const updateResponse = await fetch('/api/loans/fund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loanId: loan.id,
            lenderAddress: currentUserAddress,
            txHash: receipt.hash,
            offerId: offerId,
            blockchainLoanId: blockchainLoanId
          })
        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          console.warn("Database update failed:", updateData);
          toast.warning("Loan funded on blockchain but database update failed");
        } else {
          toast.success("Database updated!");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        toast.warning("Loan funded but failed to update database");
      }

      // Wait 2 seconds then close and refresh
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Error funding loan:", err);
      setTxStatus(TxStatus.ERROR);

      if (err.code === 4001) {
        toast.error("Transaction rejected by user");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        toast.error("Insufficient funds for loan amount + gas fees");
      } else if (err.message?.includes("user rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(err.message || "Failed to fund loan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusMessage = () => {
    switch (txStatus) {
      case TxStatus.CHECKING:
        return "Checking loan offer...";
      case TxStatus.FUNDING:
        return "Funding loan...";
      case TxStatus.CONFIRMING:
        return "Confirming transaction...";
      case TxStatus.SUCCESS:
        return "Loan funded successfully!";
      case TxStatus.ERROR:
        return "Transaction failed";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-foreground">Invest in Loan</h2>
          <button
            onClick={onClose}
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
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View on Etherscan <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {txStatus === TxStatus.ERROR && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Transaction Failed</p>
                <p className="text-xs text-destructive/80">Please try again or check your wallet</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Borrower Info */}
          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">BORROWER</h3>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{loan.borrower.username}</p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {loan.borrower.walletAddress}
              </p>
            </div>
          </div>

          {/* Loan Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Loan Details</h3>
            
            {/* Blockchain Info */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground">Blockchain Offer ID:</span>
                <span className="font-mono text-foreground font-semibold">
                  {loan.offerId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Smart Contract:</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${loan.contractAddress || LENDVAULT_CONTRACT_ADDRESS || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {((loan.contractAddress || LENDVAULT_CONTRACT_ADDRESS || '')).slice(0, 6)}...{((loan.contractAddress || LENDVAULT_CONTRACT_ADDRESS || '')).slice(-4)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {formatWei(loan.amount)} Wei
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ≈ {loanAmountEth.toFixed(4)} ETH
                </p>
              </div>

              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Expected Return</p>
                <p className="text-2xl font-bold text-green-500">
                  {totalReturn.toFixed(4)} ETH
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  +{totalInterest.toFixed(4)} ETH profit
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="text-foreground font-semibold">{loan.interestRate}% APR</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Loan Duration:</span>
                <span className="text-foreground font-semibold">{durationDays} days</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="text-foreground font-semibold">
                  {new Date(loan.dueDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">LTV Ratio:</span>
                <span className="text-foreground font-semibold">
                  {(loan.ltvRatio * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Collateral Info */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Collateral Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground font-medium">{loan.collateralType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token ID:</span>
                <span className="text-foreground font-medium font-mono">#{loan.collateralId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value:</span>
                <span className="text-foreground font-medium font-mono">
                  {formatWei(loan.collateralValue)} Wei
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value (ETH):</span>
                <span className="text-foreground font-medium">
                  ≈ {collateralValueEth.toFixed(4)} ETH
                </span>
              </div>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Investment Risk</p>
                <p className="text-xs text-muted-foreground">
                  • If the borrower defaults, you will receive the NFT collateral instead of repayment
                </p>
                <p className="text-xs text-muted-foreground">
                  • Ensure the collateral value justifies your investment
                </p>
                <p className="text-xs text-muted-foreground">
                  • This is a peer-to-peer transaction with no intermediary guarantees
                </p>
              </div>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-secondary/30 border border-border rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Investment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You send:</span>
                <span className="text-foreground font-bold">{loanAmountEth.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive (after {durationDays} days):</span>
                <span className="text-green-500 font-bold">{totalReturn.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted-foreground">Your profit:</span>
                <span className="text-green-500 font-semibold">+{totalInterest.toFixed(4)} ETH ({((totalInterest / loanAmountEth) * 100).toFixed(2)}%)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvest}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {getStatusMessage() || "Processing..."}
                </span>
              ) : (
                `Fund ${loanAmountEth.toFixed(4)} ETH`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export button component for easy use
interface InvestButtonProps {
  loan: LoanOffer;
  onSuccess: () => void;
  currentUserAddress?: string;
  className?: string;
}

export function InvestButton({ loan, onSuccess, currentUserAddress, className }: InvestButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className={className || "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"}
      >
        Invest Now
      </Button>

      {showModal && (
        <InvestModal
          loan={loan}
          onClose={() => setShowModal(false)}
          onSuccess={onSuccess}
          currentUserAddress={currentUserAddress}
        />
      )}
    </>
  );
}