import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useAuth(endpoint: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const messageShownRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const authenticateSession = async () => {
      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      const isAuthenticated = data.isAuthenticated;

      if (!isAuthenticated && !messageShownRef.current) {
        alert("Unauthorized"); // Set alert message temporarily.
        messageShownRef.current = true;
        setIsAuthenticated(false);
      }
    };

    authenticateSession();
  }, [endpoint, router]);

  console.log("useAuth.ts isAuthenticated:", isAuthenticated);
  return isAuthenticated;
}
