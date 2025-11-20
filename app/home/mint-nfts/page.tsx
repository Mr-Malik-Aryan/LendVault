"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader, Upload } from "lucide-react";
import { ethers } from "ethers";

// Add these constants at the top
const TESTNET_NFT_CONTRACT_ADDRESS = "0x3dFa911d14112fdbEA9a414Cc41F4C8613bD11a3";
const TESTNET_NFT_ABI = [
  "function safeMint(address to, string memory uri) public returns (uint256)",
  "function mint(address to, string memory uri) public returns (uint256)",
  "function publicMint(address to, string memory uri) public returns (uint256)",
  "function owner() public view returns (address)",
  "function hasRole(bytes32 role, address account) public view returns (bool)",
  "function MINTER_ROLE() public view returns (bytes32)",
];

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

interface MintFormData {
  name: string;
  description: string;
  value: string;
  image: File | null;
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
      console.log("Uploading image to Pinata...");
      const imageIpfsUrl = await uploadImageToPinata(mintFormData.image);

      // Step 2: Create and upload metadata to Pinata
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
      console.log("Minting NFT on blockchain...");
      const nftContract = new ethers.Contract(
        TESTNET_NFT_CONTRACT_ADDRESS,
        TESTNET_NFT_ABI,
        signer
      );

      // Check if user has minting permissions
      try {
        const contractOwner = await nftContract.owner();
        console.log("Contract owner:", contractOwner);
        console.log("User address:", userAddress);

        // Try to check if the contract uses role-based access control
        try {
          const minterRole = await nftContract.MINTER_ROLE();
          const hasMinterRole = await nftContract.hasRole(minterRole, userAddress);
          console.log("Has minter role:", hasMinterRole);

          if (!hasMinterRole && contractOwner.toLowerCase() !== userAddress.toLowerCase()) {
            throw new Error(
              "You don't have permission to mint NFTs. Please contact the contract owner to grant you the MINTER_ROLE."
            );
          }
        } catch (roleErr) {
          // Contract might not use role-based access control
          console.log("Role check not available, proceeding with mint...");
        }
      } catch (ownerErr) {
        console.log("Could not verify permissions:", ownerErr);
      }

      let tx;
      let mintError: any = null;

      // Try different minting methods in order
      const mintMethods = [
        { name: "publicMint", fn: () => nftContract.publicMint(userAddress, metadataIpfsUrl) },
        { name: "mint", fn: () => nftContract.mint(userAddress, metadataIpfsUrl) },
        { name: "safeMint", fn: () => nftContract.safeMint(userAddress, metadataIpfsUrl) },
      ];

      for (const method of mintMethods) {
        try {
          console.log(`Trying ${method.name}...`);
          tx = await method.fn();
          console.log(`${method.name} successful! Transaction hash:`, tx.hash);
          break; // Success, exit loop
        } catch (err: any) {
          console.log(`${method.name} failed:`, err.message);
          mintError = err;
          
          // If it's an access control error, throw immediately with helpful message
          if (
            err.message.includes("AccessControl") ||
            err.message.includes("Ownable") ||
            err.data?.includes("0x118cdaa7")
          ) {
            throw new Error(
              "Access Denied: You don't have permission to mint NFTs. The contract owner needs to grant you minting permissions first. Please contact the contract administrator."
            );
          }
        }
      }

      if (!tx) {
        throw mintError || new Error("All minting methods failed");
      }

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("NFT minted successfully:", receipt);

      setMintSuccess("NFT minted successfully!");
      setMintFormData({ name: "", description: "", value: "", image: null });
      setImagePreview(null);

      // Reset form after 2 seconds
      setTimeout(() => {
        setMintSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error("Mint error:", err);
      setMintError(err.message || "Failed to mint NFT");
    } finally {
      setMinting(false);
    }
  };

  const handleReset = () => {
    setMintFormData({ name: "", description: "", value: "", image: null });
    setImagePreview(null);
    setMintError(null);
    setMintSuccess(null);
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
    <div className="min-h-screen bg-background">
      <Sidebar username={user?.username} />
      <main className="pl-20 md:pl-64 p-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-8">
            <span className="text-foreground">Mint New </span>
            <span className="text-primary">NFT</span>
          </h1>

          {/* Mint NFT Form */}
          <div className="bg-card border border-border rounded-xl p-8">
            <form onSubmit={handleMintNFT} className="space-y-6">
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
                      Minting...
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
