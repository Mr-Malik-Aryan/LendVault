"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const walletAddress = localStorage.getItem("walletAddress");

        if (!walletAddress) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/auth/check?walletAddress=${walletAddress}`
        );
        const data = await response.json();

        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem("walletAddress");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("walletAddress");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/");
  };

  return { isAuthenticated, user, loading, logout };
}
