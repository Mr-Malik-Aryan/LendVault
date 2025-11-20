import { useState, useCallback } from "react";

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  [key: string]: any;
}

export interface NFT {
  tokenId: string;
  contractAddress: string;
  contractName: string;
  contractSymbol: string;
  tokenURI: string;
  metadata: NFTMetadata;
  image: string | null;
}

export interface FetchNFTsResponse {
  success: boolean;
  walletAddress?: string;
  contractAddress?: string;
  contractName?: string;
  contractSymbol?: string;
  nftCount?: number;
  nfts?: NFT[];
  message?: string;
  error?: string;
}

export function useNFTs() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(
    async (
      walletAddress: string,
      contractAddress: string,
      network: string = "sepolia"
    ): Promise<FetchNFTsResponse> => {
      setLoading(true);
      setError(null);
      setNfts([]); // Clear previous NFTs

      try {
        // Validate inputs
        if (!walletAddress || !contractAddress) {
          const errorMsg = "Wallet address and contract address are required";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        // Build URL with proper encoding
        const params = new URLSearchParams({
          walletAddress: walletAddress.trim(),
          contractAddress: contractAddress.trim(),
          network: network.trim(),
        });

        const response = await fetch(`/api/nft/fetch?${params.toString()}`);

        // Handle non-JSON responses
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }

        const data: FetchNFTsResponse = await response.json();

        if (!response.ok) {
          const errorMessage = 
            data.error || 
            data.message || 
            `HTTP ${response.status}: Failed to fetch NFTs`;
          setError(errorMessage);
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            data,
          });
          return { success: false, error: errorMessage };
        }

        if (data.success && data.nfts && data.nfts.length > 0) {
          setNfts(data.nfts);
          setError(null);
          return data;
        } else if (data.success && (!data.nfts || data.nfts.length === 0)) {
          const msg = "No NFTs found for this wallet and contract";
          setError(msg);
          setNfts([]);
          return { ...data, message: msg };
        } else {
          const errorMsg = data.error || data.message || "Failed to fetch NFTs";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error 
            ? err.message 
            : "Network error: Unable to fetch NFTs";
        setError(errorMessage);
        console.error("Error fetching NFTs:", err);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearNFTs = useCallback(() => {
    setNfts([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    nfts, 
    loading, 
    error, 
    fetchNFTs,
    clearNFTs,
    clearError,
  };
}