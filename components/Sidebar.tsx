"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Compass, Zap, FileText, Wand2, User } from "lucide-react";

interface SidebarProps {
  username?: string;
}

export function Sidebar({ username }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

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
      icon: Wand2,
      label: "My NFTs",
      href: "/home/nfts",
    },
    {
      icon: User,
      label: "My Account",
      href: "/home/account",
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 ${
          isOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {isOpen && (
            <h2 className="text-xl font-bold">
              <span className="text-foreground">Lend</span>
              <span className="text-primary">Vault</span>
            </h2>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-foreground hover:text-primary group"
              >
                <Icon className="w-5 h-5 shrink-0 group-hover:text-primary transition-colors" />
                {isOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info - Bottom */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-secondary/50">
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">Logged in as</p>
              <p className="text-primary font-semibold truncate">{username}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Content Offset */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-64" : "ml-20"}`} />
    </>
  );
}
