import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    const contractAddress = searchParams.get("contractAddress");
    const network = searchParams.get("network") || "sepolia";

    // Validate inputs - walletAddress is required, contractAddress is optional
    if (!walletAddress) {
      return Response.json(
        { 
          success: false,
          error: "walletAddress is required" 
        },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.ALCHEMY_API_KEY && network !== "hardhat") {
      return Response.json(
        { 
          success: false,
          error: "ALCHEMY_API_KEY is not configured. Please add ALCHEMY_API_KEY to .env.local" 
        },
        { status: 500 }
      );
    }

    // Get Alchemy API URL based on network
    const alchemyUrls: { [key: string]: string } = {
      sepolia: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      goerli: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      mumbai: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      hardhat: "http://127.0.0.1:8545",
    };

    const alchemyUrl = alchemyUrls[network];
    if (!alchemyUrl) {
      return Response.json(
        { 
          success: false,
          error: `Unsupported network: ${network}` 
        },
        { status: 400 }
      );
    }

    // Use Alchemy's getNFTs API endpoint
    // If contractAddress is provided, fetch only from that contract
    // Otherwise, fetch all NFTs from the wallet
    let getNFTsUrl = `${alchemyUrl}/getNFTs?owner=${walletAddress}`;
    
    if (contractAddress && contractAddress.trim()) {
      getNFTsUrl += `&contractAddresses[]=${contractAddress}`;
    }

    const response = await fetch(getNFTsUrl);
    
    if (!response.ok) {
      return Response.json(
        { 
          success: false,
          error: `Alchemy API error: ${response.statusText}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle Alchemy API response
    if (data.ownedNfts && Array.isArray(data.ownedNfts)) {
      const nfts = data.ownedNfts.map((nft: any) => ({
        tokenId: nft.tokenId,
        contractAddress: nft.contract.address,
        contractName: nft.contract.name || "Unknown",
        contractSymbol: nft.contract.symbol || "UNKNOWN",
        tokenURI: nft.tokenUri?.raw || "",
        metadata: {
          name: nft.title || nft.name || `${nft.contract.symbol || "NFT"} #${nft.tokenId}`,
          description: nft.description || "",
          image: nft.image?.cachedUrl || nft.image?.pngUrl || nft.image?.thumbnailUrl || null,
          attributes: nft.rawMetadata?.attributes || [],
        },
        image: nft.image?.cachedUrl || nft.image?.pngUrl || nft.image?.thumbnailUrl || null,
      }));

      return Response.json({
        success: true,
        walletAddress,
        contractAddress: contractAddress || "all",
        contractName: nfts.length > 0 ? nfts[0].contractName : "Unknown Collection",
        contractSymbol: nfts.length > 0 ? nfts[0].contractSymbol : "UNKNOWN",
        nftCount: nfts.length,
        nfts,
        pageKey: data.pageKey || null, // For pagination if needed
      });
    }

    // No NFTs found
    return Response.json({
      success: true,
      walletAddress,
      contractAddress: contractAddress || "all",
      contractName: "Unknown Collection",
      contractSymbol: "UNKNOWN",
      nftCount: 0,
      nfts: [],
      message: "No NFTs found for this wallet",
    });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return Response.json(
      { 
        success: false,
        error: "Failed to fetch NFTs", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}