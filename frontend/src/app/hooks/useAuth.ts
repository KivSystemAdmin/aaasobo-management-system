import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Check the authentication of the user.
export function useAuth(endpoint: string, redirectPath: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const messageShownRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Authenticate the session.
    const authenticateSession = async () => {
      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      const isAuthenticated = data.isAuthenticated;

      if (isAuthenticated) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      if (!messageShownRef.current) {
        alert("Unauthorized"); // Set alert message temporarily.
      }
      messageShownRef.current = true;
      setIsAuthenticated(false);
    };

    authenticateSession();
  }, [endpoint, router]);

  // Redirect to the designated page if the user is not authenticated.
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, router, redirectPath]);

  const result = { isAuthenticated, isLoading };
  return result;
}
