"use client";

import { Button } from "@/components/ui/button";
import { Wallet, Search, Menu } from "lucide-react";
import WalletConnectButton from "./ConnectWallet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
  }, []);

  return (
    <nav className="fixed top-2 left-0 right-0 z-50   border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image 
                src="/lendVault.svg" 
                alt="LendVault" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <div className="text-2xl font-bold">
                <span className="text-foreground">Lend</span>
                <span className="text-primary">Vault</span>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">
                Stats
              </a>
              <a href="#collections" className="text-muted-foreground hover:text-foreground transition-colors">
                Collections
              </a>
              <a href="#cta" className="text-muted-foreground hover:text-foreground transition-colors">
                Get Started
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
            </Button>
            
            {username ? (
              <Link href="/home/explore" className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                    {username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-foreground font-medium">{username}</span>
              </Link>
            ) : (
              <WalletConnectButton onConnect={(data: { username: string; walletAddress: string; walletType: string; timestamp: string }) => {
                console.log("Wallet connected:", data);
                setUsername(data.username);
              }} />
            )}

            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
