"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Compass, Zap, FileText, Wand2, User, Image, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NextImage from "next/image";

interface SidebarProps {
  username?: string;
}

export function Sidebar({ username }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false); // Default to collapsed
  const [isHovering, setIsHovering] = useState(false);

  const menuItems = [
    {
      icon: Compass,
      label: "Explore",
      href: "/home/explore",
    },
    {
      icon: Zap,
      label: "Get ETH",
      href: "/home/get-eth",
    },
    {
      icon: FileText,
      label: "Loan Requests",
      href: "/home/loans",
    },
    {
      icon: Image,
      label: "My NFTs",
      href: "/home/nfts",
    },
    {
      icon: Sparkles,
      label: "Mint NFTs",
      href: "/home/mint-nfts",
    },
    {
      icon: User,
      label: "My Account",
      href: "/home",
    },
  ];

  // On larger screens, expand on hover; on mobile, use toggle
  const isExpanded = isOpen || isHovering;

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-500 ease-in-out z-40 ${
          isExpanded ? "w-64" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {isExpanded ? (
            <Link 
              href="/" 
              className="text-xl font-bold whitespace-nowrap animate-in fade-in slide-in-from-left-5 duration-300 hover:opacity-80 transition-opacity"
            >
              <span className="text-foreground">Lend</span>
              <span className="text-primary">Vault</span>
            </Link>
          ) : (
            <Link 
              href="/" 
              className="hidden md:flex items-center justify-center w-full hover:opacity-80 transition-opacity"
            >
              <div className="p-2 animate-in fade-in duration-300">
                <NextImage 
                  src="/lendVault.svg" 
                  alt="LendVault" 
                  width={24} 
                  height={24}
                  className="w-8 h-7"
                />
              </div>
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-all duration-200 hover:scale-110 text-foreground md:hidden"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-300 ease-in-out text-foreground hover:text-primary group hover:scale-105 hover:shadow-md"
                title={!isExpanded ? item.label : undefined}
                style={{
                  transitionDelay: isExpanded ? `${index * 30}ms` : '0ms'
                }}
              >
                <Icon className="w-5 h-5 shrink-0 group-hover:text-primary transition-all duration-300 group-hover:scale-110" />
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-3 duration-300">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info - Bottom */}
        {username && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-secondary/50">
            {isExpanded ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-muted-foreground text-xs">Logged in as</p>
                  <p className="text-primary font-semibold truncate">{username}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center animate-in fade-in duration-300">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                    {username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
