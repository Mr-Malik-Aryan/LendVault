import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const collections = [
  {
    id: 1,
    title: "Cosmic Dreams",
    creator: "ArtistX",
    floor: "2.5 ETH",
    volume: "125 ETH",
    change: "+24%",
  },
  {
    id: 2,
    title: "Digital Abstracts",
    creator: "CryptoArt",
    floor: "1.8 ETH",
    volume: "98 ETH",
    change: "+18%",
  },
  {
    id: 3,
    title: "Neon Nights",
    creator: "PixelMaster",
    floor: "3.2 ETH",
    volume: "156 ETH",
    change: "+32%",
  },
  {
    id: 4,
    title: "Future Visions",
    creator: "MetaCreator",
    floor: "2.1 ETH",
    volume: "87 ETH",
    change: "+15%",
  },
];

const FeaturedCollections = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="container mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Trending <span className="text-primary">Collections</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the hottest NFT collections making waves in the marketplace
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((collection, index) => (
            <Card 
              key={collection.id}
              className="group bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-nft-glow cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square bg-linear-to-br from-secondary to-card-hover relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">{collection.change}</span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                    {collection.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">by {collection.creator}</p>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">Floor</div>
                    <div className="font-semibold text-foreground">{collection.floor}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Volume</div>
                    <div className="font-semibold text-foreground">{collection.volume}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
