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
    let getNFTsUrl = `${alchemyUrl}/getNFTs?owner=${walletAddress}&withMetadata=true`;
    
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
      console.log("First NFT from Alchemy:", JSON.stringify(data.ownedNfts[0], null, 2));
      
      // Fetch metadata from tokenURI for each NFT
      const nftsPromises = data.ownedNfts.map(async (nft: any) => {
        // Get tokenId first - Alchemy returns it in nft.id.tokenId
        let rawTokenId = nft.id?.tokenId || nft.tokenId || nft.token?.tokenId || "";
        
        // Convert hex tokenId to decimal if it starts with 0x
        let tokenId = rawTokenId;
        if (rawTokenId && typeof rawTokenId === 'string' && rawTokenId.startsWith('0x')) {
          try {
            // Convert hex to decimal
            const decimalValue = BigInt(rawTokenId);
            tokenId = decimalValue.toString();
            console.log(`Converted tokenId from ${rawTokenId} to ${tokenId}`);
          } catch (error) {
            console.error("Error converting tokenId from hex:", rawTokenId, error);
            tokenId = rawTokenId; // Keep original if conversion fails
          }
        }
        
        let metadataImage = "";
        let metadata = {
          name: nft.title || nft.name || `${nft.contract?.symbol || "NFT"} #${tokenId}`,
          description: nft.description || "",
          image: "",
          attributes: nft.rawMetadata?.attributes || [],
        };

        // Get tokenURI
        let tokenURI = nft.tokenUri?.raw || nft.tokenUri?.gateway || "";
        
        // Try to fetch metadata from tokenURI
        if (tokenURI) {
          try {
            // Convert IPFS tokenURI to gateway URL
            let fetchUrl = tokenURI;
            if (tokenURI.startsWith("ipfs://")) {
              fetchUrl = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
            }
            
            // Fetch the metadata
            const metadataResponse = await fetch(fetchUrl);
            const contentType = metadataResponse.headers.get('content-type');
            
            // Only try to parse as JSON if it's actually JSON
            if (metadataResponse.ok && contentType && contentType.includes('application/json')) {
              const metadataJson = await metadataResponse.json();
              metadataImage = metadataJson.image || "";
              metadata = {
                name: metadataJson.name || metadata.name,
                description: metadataJson.description || metadata.description,
                image: metadataJson.image || "",
                attributes: metadataJson.attributes || metadata.attributes,
              };
            } else if (metadataResponse.ok && contentType && (contentType.includes('image') || contentType.includes('jpeg') || contentType.includes('png'))) {
              // If the tokenURI points directly to an image, use it as the image
              metadataImage = fetchUrl;
            } else {
              // Fallback to Alchemy's cached data
              metadataImage = nft.rawMetadata?.image || nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "";
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
            // Fallback to Alchemy's cached data
            metadataImage = nft.rawMetadata?.image || nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "";
          }
        } else {
          // No tokenURI, use Alchemy's cached data
          metadataImage = nft.rawMetadata?.image || nft.media?.[0]?.gateway || nft.media?.[0]?.raw || "";
        }

        // Format the image URL
        let imageUrl = metadataImage;
        
        // If image already has the IPFS gateway, keep it as is
        if (imageUrl && imageUrl.startsWith("https://ipfs.io/ipfs/")) {
          // Keep as is
        }
        // If image starts with ipfs://, convert to https://ipfs.io/ipfs/
        else if (imageUrl && imageUrl.startsWith("ipfs://")) {
          imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
        }
        // If it's just an IPFS hash without prefix, add the gateway
        else if (imageUrl && imageUrl.startsWith("Qm") && !imageUrl.startsWith("http")) {
          imageUrl = `https://ipfs.io/ipfs/${imageUrl}`;
        }
        
        metadata.image = imageUrl;

        return {
          tokenId: tokenId,
          contractAddress: nft.contract?.address || "",
          contractName: nft.contract?.name || "Unknown",
          contractSymbol: nft.contract?.symbol || "UNKNOWN",
          tokenURI: tokenURI,
          metadata: metadata,
          image: imageUrl,
        };
      });

      const nfts = await Promise.all(nftsPromises);

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