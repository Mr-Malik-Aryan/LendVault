"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNFTs } from "@/hooks/useNFTs";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader } from "lucide-react";

export default function MintNFTPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { nfts, loading, error, fetchNFTs } = useNFTs();
  const [network, setNetwork] = useState("sepolia");
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch all NFTs for the wallet when component mounts
  useEffect(() => {
    if (isAuthenticated && user?.walletAddress && !hasFetched && !loading) {
      handleFetchNFTs();
    }
  }, [isAuthenticated, user?.walletAddress]);

  const handleFetchNFTs = async () => {
    if (!user?.walletAddress) {
      alert("Wallet address not found");
      return;
    }

    // Pass empty string as contractAddress to fetch all NFTs
    const response = await fetchNFTs(user.walletAddress, "", network);
    console.log("Fetch NFTs Response:", response);
    setHasFetched(true);
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
        <div className="max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">
          <span className="text-foreground">My </span>
          <span className="text-primary">NFTs</span>
        </h1>

        {/* Fetch NFTs Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 max-w-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Fetch Your Testnet NFTs
          </h2>

          <div className="space-y-4">
            {/* Wallet Address Display */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Connected Wallet
              </label>
              <div className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground font-mono text-sm">
                {user?.walletAddress}
              </div>
            </div>

            {/* Network Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Network
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


            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            {/* Fetch Button */}
            <Button
              onClick={handleFetchNFTs}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Fetching NFTs...
                </span>
              ) : (
                "Fetch My NFTs"
              )}
            </Button>
          </div>
        </div>

        {/* NFTs Grid */}
        {hasFetched && (
          <div>
            {nfts.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Your NFTs ({nfts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {nfts.map((nft, index) => {
                    // Extract value from attributes array - value is in Wei
                    const valueAttribute = nft.metadata.attributes?.[0]?.value || 0;
                    const weiValue = valueAttribute|| '0';
                    
                    // Helper to format Wei with commas for readability
                    const formatWei = (value: string) => {
                      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    };
                    
                    return (
                      <div
                        key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
                        className="bg-card border-2 border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group"
                      >
                        {/* Image */}
                        {nft.image ? (
                          <div className="w-full h-72 bg-linear-to-br from-secondary to-secondary/50 flex items-center justify-center overflow-hidden relative">
                            <img
                              src={nft.image}
                              alt={nft.metadata.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            {/* Overlay gradient on hover */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        ) : (
                          <div className="w-full h-72 bg-linear-to-br from-secondary to-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-lg">No Image</span>
                          </div>
                        )}

                        {/* Info - Dark Background */}
                        <div className="bg-linear-to-br from-black via-gray-900 to-black p-5 space-y-3">
                          {/* NFT Name */}
                          <h3 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">
                            {nft.metadata.name || `${nft.contractSymbol} #${nft.tokenId}`}
                          </h3>
                          
                          {/* Wei Value Display */}
                          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                            <div className="text-xs text-gray-400 mb-1">Collateral Value</div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-primary font-mono">
                                {formatWei(weiValue)}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">Wei</span>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="pt-3 border-t border-gray-800 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Token ID:</span>
                              <span className="text-white font-mono bg-gray-800 px-2 py-1 rounded">{nft.tokenId}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Contract:</span>
                              <span className="text-white font-mono bg-gray-800 px-2 py-1 rounded">
                                {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)}
                              </span>
                            </div>
                          </div>

                          {/* Use as Collateral Button */}
                          <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 shadow-lg hover:shadow-primary/50 transition-all duration-300">
                            Use as Collateral
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No NFTs found on this network
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make sure you have NFTs on the {network === 'sepolia' ? 'Sepolia' : network === 'goerli' ? 'Goerli' : network === 'mumbai' ? 'Mumbai' : 'Hardhat'} testnet
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
