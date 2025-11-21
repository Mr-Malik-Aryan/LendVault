"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader, Upload, CheckCircle } from "lucide-react";
import { ethers } from "ethers";

// Add these constants at the top
const TESTNET_NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "";
const TESTNET_NFT_ABI = [
  "function safeMint(string memory uri) public returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function supportsInterface(bytes4 interfaceId) public view returns (bool)",
];

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

interface MintFormData {
  name: string;
  description: string;
  value: string;
  image: File | null;
}

// Transaction status states for minting
enum MintStatus {
  IDLE = "idle",
  UPLOADING_IMAGE = "uploading_image",
  UPLOADING_METADATA = "uploading_metadata",
  MINTING = "minting",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  ERROR = "error"
}

export default function MintNFTPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Mint form states
  const [mintFormData, setMintFormData] = useState<MintFormData>({
    name: "",
    description: "",
    value: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  
  // Transaction state
  const [mintStatus, setMintStatus] = useState<MintStatus>(MintStatus.IDLE);
  const [txHash, setTxHash] = useState<string>("");
  const [tokenId, setTokenId] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Image upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMintFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Pinata
  const uploadImageToPinata = async (image: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", image);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY || "",
          pinata_secret_api_key: PINATA_SECRET_KEY || "",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to Pinata");
      }

      const data = await response.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (err) {
      throw new Error(`Pinata upload failed: ${err}`);
    }
  };

  // Upload metadata to Pinata
  const uploadMetadataToPinata = async (
    metadata: Record<string, any>
  ): Promise<string> => {
    try {
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY || "",
          pinata_secret_api_key: PINATA_SECRET_KEY || "",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error("Failed to upload metadata to Pinata");
      }

      const data = await response.json();
      return `ipfs://${data.IpfsHash}`;
    } catch (err) {
      throw new Error(`Pinata metadata upload failed: ${err}`);
    }
  };

  // Mint NFT handler
  const handleMintNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    setMintError(null);
    setMintSuccess(null);
    setMinting(true);
    setMintStatus(MintStatus.IDLE);
    setTxHash("");
    setTokenId("");

    try {
      // Validate form data
      if (!mintFormData.name || !mintFormData.description || !mintFormData.value || !mintFormData.image) {
        throw new Error("Please fill in all fields and select an image");
      }

      // Check MetaMask
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Verify network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 11155111) {
        throw new Error("Please switch to Sepolia testnet");
      }

      // Step 1: Upload image to Pinata
      setMintStatus(MintStatus.UPLOADING_IMAGE);
      console.log("Uploading image to Pinata...");
      const imageIpfsUrl = await uploadImageToPinata(mintFormData.image);

      // Step 2: Create and upload metadata to Pinata
      setMintStatus(MintStatus.UPLOADING_METADATA);
      console.log("Creating metadata...");
      const metadata = {
        name: mintFormData.name,
        description: mintFormData.description,
        image: imageIpfsUrl,
        attributes: [
          {
            trait_type: "Value",
            value: mintFormData.value,
          },
        ],
      };

      const metadataIpfsUrl = await uploadMetadataToPinata(metadata);
      console.log("Metadata uploaded:", metadataIpfsUrl);

      // Step 3: Mint NFT on contract
      setMintStatus(MintStatus.MINTING);
      console.log("Minting NFT on blockchain...");
      
      if (!TESTNET_NFT_CONTRACT_ADDRESS) {
        throw new Error("NFT contract address not configured. Please check your .env file.");
      }

      const nftContract = new ethers.Contract(
        TESTNET_NFT_CONTRACT_ADDRESS,
        TESTNET_NFT_ABI,
        signer
      );

      // Mint the NFT (mints to msg.sender automatically)
      console.log("Calling safeMint...");
      const tx = await nftContract.safeMint(metadataIpfsUrl);
      console.log("✓ Transaction sent:", tx.hash);

      // Set transaction hash and wait for confirmation
      setTxHash(tx.hash);
      setMintStatus(MintStatus.CONFIRMING);
      console.log("Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✓ NFT minted successfully!");

      // Extract token ID from receipt
      try {
        const transferEvent = receipt.logs
          .map((log: any) => {
            try {
              return nftContract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find((event: any) => event && event.name === "Transfer");

        if (transferEvent && transferEvent.args?.tokenId) {
          setTokenId(transferEvent.args.tokenId.toString());
        }
      } catch (e) {
        console.log("Could not extract token ID:", e);
      }

      setMintStatus(MintStatus.SUCCESS);
      setMintSuccess("✅ NFT minted successfully!");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setMintSuccess(null);
        setMintFormData({ name: "", description: "", value: "", image: null });
        setImagePreview(null);
        setMintStatus(MintStatus.IDLE);
        setTxHash("");
        setTokenId("");
      }, 3000);
    } catch (err: any) {
      console.error("❌ Mint error:", err);
      setMintStatus(MintStatus.ERROR);
      
      // Provide user-friendly error messages
      let errorMessage = err.message || "Failed to mint NFT";
      
      // Check for common error patterns
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected in MetaMask";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance for gas fees";
      } else if (err.message?.includes("user rejected")) {
        errorMessage = "You cancelled the transaction";
      }
      
      setMintError(errorMessage);
    } finally {
      setMinting(false);
    }
  };

  const handleReset = () => {
    setMintFormData({ name: "", description: "", value: "", image: null });
    setImagePreview(null);
    setMintError(null);
    setMintSuccess(null);
    setMintStatus(MintStatus.IDLE);
    setTxHash("");
    setTokenId("");
  };

  // Get status message based on minting status
  const getStatusMessage = () => {
    switch (mintStatus) {
      case MintStatus.UPLOADING_IMAGE:
        return "Uploading image to IPFS...";
      case MintStatus.UPLOADING_METADATA:
        return "Uploading metadata to IPFS...";
      case MintStatus.MINTING:
        return "Minting NFT on blockchain...";
      case MintStatus.CONFIRMING:
        return "Waiting for blockchain confirmation...";
      case MintStatus.SUCCESS:
        return "NFT minted successfully!";
      case MintStatus.ERROR:
        return "Minting failed";
      default:
        return "Mint NFT";
    }
  };

  if (authLoading) {
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
    <div className="min-h-screen flex justify-center bg-background">
      <Sidebar username={user?.username} />
      <main className="pl-20 md:pl-64 p-8">
        <div className="min-w-[400px] lg:w-5xl">
          <h1 className="text-4xl font-bold mb-8">
            <span className="text-foreground">Mint New </span>
            <span className="text-primary">NFT</span>
          </h1>

          {/* Mint NFT Form */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Transaction Status Banner */}
            {mintStatus !== MintStatus.IDLE && mintStatus !== MintStatus.ERROR && (
              <div className="bg-primary/10 border-b border-primary/20 p-4">
                <div className="flex items-center gap-3">
                  {mintStatus === MintStatus.SUCCESS ? (
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
                    {tokenId && (
                      <p className="text-xs text-muted-foreground">Token ID: {tokenId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleMintNFT} className="p-8 space-y-6">
              {/* Connected Wallet */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Connected Wallet Address
                </label>
                <div className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground font-mono text-sm break-all cursor-not-allowed opacity-75">
                  {user?.walletAddress}
                </div>
              </div>

              {/* NFT Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  NFT Name *
                </label>
                <input
                  type="text"
                  value={mintFormData.name}
                  onChange={(e) =>
                    setMintFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring outline-none transition"
                  placeholder="e.g., Rare Digital Art"
                  required
                  disabled={minting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  value={mintFormData.description}
                  onChange={(e) =>
                    setMintFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring outline-none resize-none transition"
                  placeholder="Describe your NFT..."
                  rows={4}
                  required
                  disabled={minting}
                />
              </div>

              {/* Collateral Value */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Collateral Value (Wei) *
                </label>
                <input
                  type="text"
                  value={mintFormData.value}
                  onChange={(e) =>
                    setMintFormData((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:ring-2 focus:ring-ring outline-none transition"
                  placeholder="e.g., 1000000000000000000"
                  required
                  disabled={minting}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Enter value in Wei (1 ETH = 10^18 Wei)
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground cursor-pointer focus:ring-2 focus:ring-ring outline-none transition"
                  required
                  disabled={minting}
                />
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Image Preview
                  </p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-80 object-cover rounded-lg border border-border"
                  />
                </div>
              )}

              {/* Error Message */}
              {mintError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Error</p>
                    <p className="text-sm text-destructive">{mintError}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {mintSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-5 h-5 text-green-500 shrink-0 mt-0.5">✓</div>
                  <div>
                    <p className="text-sm font-medium text-green-500">Success</p>
                    <p className="text-sm text-green-500">{mintSuccess}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={minting}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold py-3"
                >
                  {minting ? (
                    <span className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      {getStatusMessage()}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Mint NFT
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 text-foreground border-border hover:bg-muted font-semibold py-3"
                  disabled={minting}
                >
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}